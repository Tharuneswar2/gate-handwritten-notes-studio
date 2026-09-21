import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useDocumentStore } from './store/document';
import { useSettingsStore } from './store/settings';
import { useUIStore } from './store/ui';
import { parseRawText } from './engine/parser';
import { paginateBlocks } from './engine/paginator';
import { loadAllGoogleFonts } from './fonts/loader';
import { loadCustomFontFile } from './fonts/loader';
import { addCustomFont, getAllFonts } from './fonts/registry';
import { GATE_SUBJECTS } from './types';
import { exportPDF, exportImage, exportAllImages, downloadBlob, printPages } from './export/pdf';
import { saveDocument, loadDocument, listDocuments, autoSave, exportDocumentJSON, importDocumentJSON } from './store/storage';
import { renderLatexToHTML } from './engine/formula';
import { getAvailableActions, isAIAvailable } from './ai/provider';
import { FontGallery, BackgroundGallery, HandwritingSettings, PageSettings } from './components/settings/SettingsPanels';
import HandwrittenPage from './components/preview/HandwrittenPage';
import type { Block, PageContent, SavedDocument, DocumentMode } from './types';
import { v4 as uuidv4 } from 'uuid';

// Load all Google Fonts on app start
loadAllGoogleFonts();

const SAMPLE_NOTES = `# GATE DA — Linear Algebra
## Lecture 05: Eigenvalues & Eigenvectors

### Eigenvalue Definition

For a square matrix **A**, if there exists a non-zero vector **x** and a scalar **λ** such that:

$$
A\\mathbf{x} = \\lambda\\mathbf{x}
$$

Then **λ** is called an **eigenvalue** and **x** is the corresponding **eigenvector**.

### Characteristic Equation

To find eigenvalues, solve:

$$
\\det(A - \\lambda I) = 0
$$

This polynomial equation of degree \\(n\\) gives \\(n\\) eigenvalues (counting multiplicity).

### Properties of Eigenvalues

- Sum of eigenvalues = Trace of the matrix: \\(\\sum \\lambda_i = \\text{tr}(A)\\)
- Product of eigenvalues = Determinant: \\(\\prod \\lambda_i = \\det(A)\\)
- Eigenvalues of \\(A^T\\) are the same as eigenvalues of \\(A\\)
- If \\(\\lambda\\) is an eigenvalue of \\(A\\), then \\(\\lambda^k\\) is an eigenvalue of \\(A^k\\)

### Example: 2×2 Matrix

$$
A = \\begin{bmatrix} 4 & 1 \\\\ 2 & 3 \\end{bmatrix}
$$

Characteristic equation:

$$
\\det(A - \\lambda I) = (4-\\lambda)(3-\\lambda) - 2 = \\lambda^2 - 7\\lambda + 10 = 0
$$

Solving: \\(\\lambda_1 = 5\\), \\(\\lambda_2 = 2\\)

> [!REMEMBER]
> Always verify: trace(A) = 4+3 = 7 = 5+2 = λ₁+λ₂ ✓ and det(A) = 12-2 = 10 = 5×2 = λ₁·λ₂ ✓

> [!GATE TRICK]
> For 2×2 matrices, you can often find eigenvalues mentally using trace and determinant instead of solving the full characteristic equation.

### Diagonalization

A matrix \\(A\\) is diagonalizable if it has \\(n\\) linearly independent eigenvectors:

$$
A = PDP^{-1}
$$

where \\(D\\) is the diagonal matrix of eigenvalues and \\(P\\) is the matrix of eigenvectors.

> [!IMPORTANT]
> Not all matrices are diagonalizable. A matrix is diagonalizable iff algebraic multiplicity equals geometric multiplicity for every eigenvalue.

> [!SHORTCUT]
> Symmetric matrices are always diagonalizable and have real eigenvalues.

### Cayley-Hamilton Theorem

Every square matrix satisfies its own characteristic equation:

$$
p(A) = A^n + c_{n-1}A^{n-1} + \\cdots + c_1A + c_0I = 0
$$

> [!COMMON MISTAKE]
> Don't confuse eigenvalues of A² with squares of eigenvalues of A. While eigenvalues of A² are indeed squares of eigenvalues of A, the eigenvectors may differ for non-symmetric matrices.
`;

export default function App() {
  const doc = useDocumentStore((s) => s.document);
  const setRawText = useDocumentStore((s) => s.setRawText);
  const setBlocks = useDocumentStore((s) => s.setBlocks);
  const setTitle = useDocumentStore((s) => s.setTitle);
  const setMode = useDocumentStore((s) => s.setMode);
  const setSubject = useDocumentStore((s) => s.setSubject);
  const newDocument = useDocumentStore((s) => s.newDocument);
  const loadDocumentState = useDocumentStore((s) => s.loadDocument);

  const font = useSettingsStore((s) => s.font);
  const page = useSettingsStore((s) => s.page);
  const handwriting = useSettingsStore((s) => s.handwriting);
  const formulaSheetColumns = useSettingsStore((s) => s.formulaSheetColumns);
  const setFormulaSheetColumns = useSettingsStore((s) => s.setFormulaSheetColumns);

  const sidebarTab = useUIStore((s) => s.sidebarTab);
  const setSidebarTab = useUIStore((s) => s.setSidebarTab);
  const currentPageIndex = useUIStore((s) => s.currentPageIndex);
  const setCurrentPageIndex = useUIStore((s) => s.setCurrentPageIndex);
  const setTotalPages = useUIStore((s) => s.setTotalPages);
  const editorMode = useUIStore((s) => s.editorMode);
  const setEditorMode = useUIStore((s) => s.setEditorMode);
  const previewZoom = useUIStore((s) => s.previewZoom);
  const setPreviewZoom = useUIStore((s) => s.setPreviewZoom);
  const showFormulaDialog = useUIStore((s) => s.showFormulaDialog);
  const toggleFormulaDialog = useUIStore((s) => s.toggleFormulaDialog);
  const isSidebarCollapsed = useUIStore((s) => s.isSidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');
  const [formulaInput, setFormulaInput] = useState('');
  const [savedDocs, setSavedDocs] = useState<SavedDocument[]>([]);
  const [showLoadPanel, setShowLoadPanel] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualTab, setManualTab] = useState<'syntax' | 'math' | 'realism' | 'chatgpt'>('syntax');
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Parse raw blocks
  const blocks = useMemo(() => parseRawText(doc.rawText), [doc.rawText]);

  // Paginate
  const pages = useMemo(() => {
    return paginateBlocks(blocks, page, font, handwriting, doc.mode);
  }, [blocks, page, font, handwriting, doc.mode]);

  useEffect(() => {
    setBlocks(blocks);
  }, [blocks, setBlocks]);

  useEffect(() => {
    setTotalPages(pages.length);
  }, [pages.length, setTotalPages]);

  // Auto-save debounced
  useEffect(() => {
    const timer = setTimeout(() => {
      autoSave(doc);
    }, 2000);
    return () => clearTimeout(timer);
  }, [doc]);

  // Load sample notes on first render if empty
  useEffect(() => {
    if (!doc.rawText) {
      setRawText(SAMPLE_NOTES);
    }
  }, []);

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setRawText(e.target.value);
    },
    [setRawText]
  );

  const handleInsertFormula = useCallback(() => {
    if (!formulaInput.trim()) return;
    const insertion = `\n$$\n${formulaInput}\n$$\n`;
    setRawText(doc.rawText + insertion);
    setFormulaInput('');
    toggleFormulaDialog();
  }, [formulaInput, doc.rawText, setRawText, toggleFormulaDialog]);

  const handleExportPDF = useCallback(async () => {
    setIsExporting(true);
    setExportProgress('Preparing pages...');
    try {
      const elements = pageRefs.current.filter(Boolean) as HTMLElement[];
      const blob = await exportPDF(elements, page, { format: 'pdf', quality: 0.95, scale: 2.6, allPages: true }, (cur, total) =>
        setExportProgress(`Rendering page ${cur}/${total}...`)
      );
      downloadBlob(blob, `${doc.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
      setExportProgress('');
    } catch (err: any) {
      setExportProgress(`Error: ${err.message}`);
    }
    setIsExporting(false);
  }, [pages, page, doc.title]);

  const handleExportPNG = useCallback(async () => {
    setIsExporting(true);
    setExportProgress('Exporting PNG...');
    try {
      const el = pageRefs.current[currentPageIndex];
      if (el) {
        const blob = await exportImage(el, 'png', 2.6, 0.95, page);
        downloadBlob(blob, `${doc.title.replace(/[^a-zA-Z0-9]/g, '_')}_page${currentPageIndex + 1}.png`);
      }
      setExportProgress('');
    } catch (err: any) {
      setExportProgress(`Error: ${err.message}`);
    }
    setIsExporting(false);
  }, [currentPageIndex, doc.title, page]);

  const handleExportAllPNG = useCallback(async () => {
    setIsExporting(true);
    try {
      const elements = pageRefs.current.filter(Boolean) as HTMLElement[];
      const blobs = await exportAllImages(elements, 'png', 2.6, 0.95, page, (cur, total) =>
        setExportProgress(`Exporting page ${cur}/${total}...`)
      );
      blobs.forEach((blob, idx) => {
        downloadBlob(blob, `${doc.title.replace(/[^a-zA-Z0-9]/g, '_')}_page${idx + 1}.png`);
      });
      setExportProgress('');
    } catch (err: any) {
      setExportProgress(`Error: ${err.message}`);
    }
    setIsExporting(false);
  }, [doc.title, page]);

  const handleSave = useCallback(async () => {
    await saveDocument(doc);
    setExportProgress('Saved!');
    setTimeout(() => setExportProgress(''), 2000);
  }, [doc]);

  const handleLoadDocuments = useCallback(async () => {
    const docs = await listDocuments();
    setSavedDocs(docs);
    setShowLoadPanel(true);
  }, []);

  const handleLoadDocument = useCallback(async (id: string) => {
    const loaded = await loadDocument(id);
    if (loaded) {
      loadDocumentState(loaded);
      setShowLoadPanel(false);
    }
  }, [loadDocumentState]);

  const handleExportJSON = useCallback(() => {
    const json = exportDocumentJSON(doc);
    const blob = new Blob([json], { type: 'application/json' });
    downloadBlob(blob, `${doc.title.replace(/[^a-zA-Z0-9]/g, '_')}.json`);
  }, [doc]);

  const handleImportJSON = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = importDocumentJSON(reader.result as string);
        loadDocumentState(imported);
      } catch (err: any) {
        alert(`Import error: ${err.message}`);
      }
    };
    reader.readAsText(file);
  }, [loadDocumentState]);

  const handleUploadFont = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['ttf', 'otf', 'woff', 'woff2'].includes(ext || '')) {
      alert('Supported formats: .ttf, .otf, .woff, .woff2');
      return;
    }
    const family = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9 ]/g, '');
    try {
      await loadCustomFontFile(file, family);
      addCustomFont({
        id: `custom-${Date.now()}`,
        family,
        displayName: family,
        style: 'handwriting',
        isCustom: true,
        isRecommended: false,
        languages: ['en'],
        spacingHints: { letterSpacing: 0.3, wordSpacing: 2, lineHeight: 1.9 },
      });
      setExportProgress(`Font "${family}" loaded!`);
      setTimeout(() => setExportProgress(''), 2000);
    } catch (err: any) {
      alert(`Failed to load font: ${err.message}`);
    }
  }, []);

  const handleQuickGenerate = useCallback(() => {
    // Quick generate just switches to preview mode
    setEditorMode('preview');
    setCurrentPageIndex(0);
  }, [setEditorMode, setCurrentPageIndex]);

  // =====================================================
  // SIDEBAR TABS
  // =====================================================

  const sidebarTabs = [
    { id: 'import' as const, icon: '📥', label: 'Import' },
    { id: 'fonts' as const, icon: '✍️', label: 'Fonts' },
    { id: 'backgrounds' as const, icon: '📄', label: 'Paper' },
    { id: 'page' as const, icon: '📐', label: 'Page' },
    { id: 'handwriting' as const, icon: '🖊️', label: 'Style' },
  ];

  const renderSidebarContent = () => {
    switch (sidebarTab) {
      case 'import':
        return (
          <div className="space-y-4">
            {/* Document Title */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Document Title</label>
              <input
                type="text"
                value={doc.title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">GATE Subject</label>
              <select
                value={doc.subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {GATE_SUBJECTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Document Mode */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Document Mode</label>
              <div className="flex rounded-lg overflow-hidden border border-slate-700">
                <button
                  onClick={() => setMode('study_notes')}
                  className={`flex-1 py-2 text-xs font-medium transition-colors ${
                    doc.mode === 'study_notes'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  📝 Study Notes
                </button>
                <button
                  onClick={() => setMode('formula_sheet')}
                  className={`flex-1 py-2 text-xs font-medium transition-colors ${
                    doc.mode === 'formula_sheet'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🔢 Formula Sheet
                </button>
              </div>
            </div>

            {doc.mode === 'formula_sheet' && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Columns</label>
                <div className="flex gap-1">
                  {[1, 2, 3].map((c) => (
                    <button
                      key={c}
                      onClick={() => setFormulaSheetColumns(c)}
                      className={`flex-1 py-1.5 rounded-md text-xs transition-colors ${
                        formulaSheetColumns === c
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {c} Col
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Document Actions */}
            <div className="space-y-2 pt-2 border-t border-slate-700/50">
              <div className="grid grid-cols-2 gap-1.5">
                <button onClick={handleSave} className="px-3 py-2 bg-emerald-600/20 border border-emerald-600/30 text-emerald-400 rounded-lg text-xs hover:bg-emerald-600/30 transition-colors">
                  💾 Save
                </button>
                <button onClick={handleLoadDocuments} className="px-3 py-2 bg-slate-700/50 border border-slate-600/30 text-slate-300 rounded-lg text-xs hover:bg-slate-700 transition-colors">
                  📂 Load
                </button>
                <button onClick={() => { newDocument(); setRawText(''); }} className="px-3 py-2 bg-slate-700/50 border border-slate-600/30 text-slate-300 rounded-lg text-xs hover:bg-slate-700 transition-colors">
                  📄 New
                </button>
                <button onClick={handleExportJSON} className="px-3 py-2 bg-slate-700/50 border border-slate-600/30 text-slate-300 rounded-lg text-xs hover:bg-slate-700 transition-colors">
                  📤 Export JSON
                </button>
              </div>
              <label className="block">
                <span className="text-xs text-slate-500">Import JSON:</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  className="w-full text-xs text-slate-400 mt-1 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-slate-700 file:text-slate-300 file:text-xs file:cursor-pointer hover:file:bg-slate-600"
                />
              </label>
            </div>

            {/* AI Writer */}
            <div className="pt-2 border-t border-slate-700/50">
              <label className="block text-xs text-slate-400 mb-1.5">🤖 AI Writer</label>
              <div className="grid grid-cols-2 gap-1">
                {getAvailableActions().slice(0, 6).map((a) => (
                  <button
                    key={a.action}
                    disabled={!isAIAvailable()}
                    className="px-2 py-1.5 bg-slate-800/50 border border-slate-700 rounded text-[10px] text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-left"
                    title={isAIAvailable() ? a.label : 'Configure an AI provider to enable'}
                  >
                    {a.icon} {a.label}
                  </button>
                ))}
              </div>
              {!isAIAvailable() && (
                <p className="text-[9px] text-slate-600 mt-1">AI requires provider configuration</p>
              )}
            </div>
          </div>
        );

      case 'fonts':
        return (
          <div className="space-y-4">
            <FontGallery />
            {/* Font Upload */}
            <div className="pt-3 border-t border-slate-700/50">
              <label className="block text-xs text-slate-400 mb-1">Upload Custom Font</label>
              <input
                type="file"
                accept=".ttf,.otf,.woff,.woff2"
                onChange={handleUploadFont}
                className="w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-slate-700 file:text-slate-300 file:text-xs file:cursor-pointer hover:file:bg-slate-600"
              />
              <p className="text-[9px] text-slate-600 mt-1">.ttf, .otf, .woff, .woff2</p>
            </div>
          </div>
        );

      case 'backgrounds':
        return <BackgroundGallery />;

      case 'page':
        return <PageSettings />;

      case 'handwriting':
        return <HandwritingSettings />;

      default:
        return null;
    }
  };

  // =====================================================
  // LOAD PANEL MODAL
  // =====================================================

  const renderLoadPanel = () => {
    if (!showLoadPanel) return null;
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setShowLoadPanel(false)}>
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-[420px] max-h-[80vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-lg font-semibold text-white mb-4">📂 Saved Documents</h3>
          {savedDocs.length === 0 ? (
            <p className="text-slate-400 text-sm">No saved documents found.</p>
          ) : (
            <div className="space-y-2">
              {savedDocs.map((d) => (
                <button
                  key={d.id}
                  onClick={() => handleLoadDocument(d.id)}
                  className="w-full text-left p-3 bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-800 hover:border-slate-600 transition-colors"
                >
                  <div className="text-sm text-slate-200 font-medium">{d.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {d.mode === 'study_notes' ? '📝' : '🔢'} {d.subject} • {new Date(d.updatedAt).toLocaleString()}
                  </div>
                </button>
              ))}
            </div>
          )}
          <button onClick={() => setShowLoadPanel(false)} className="mt-4 w-full py-2 bg-slate-800 text-slate-300 rounded-lg text-sm hover:bg-slate-700 transition-colors">
            Close
          </button>
        </div>
      </div>
    );
  };

  // =====================================================
  // FORMULA DIALOG MODAL
  // =====================================================

  const renderFormulaDialog = () => {
    if (!showFormulaDialog) return null;
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={toggleFormulaDialog}>
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-[520px] shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-lg font-semibold text-white mb-4">ƒ Insert Formula</h3>
          <textarea
            value={formulaInput}
            onChange={(e) => setFormulaInput(e.target.value)}
            placeholder="Enter LaTeX... e.g. \frac{a}{b}"
            className="w-full h-28 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 font-mono focus:outline-none focus:border-indigo-500 resize-none"
          />
          {formulaInput && (
            <div className="mt-3 p-4 bg-white rounded-lg min-h-[50px] flex items-center justify-center">
              <span
                dangerouslySetInnerHTML={{ __html: renderLatexToHTML(formulaInput, true) }}
              />
            </div>
          )}
          <div className="flex gap-2 mt-4">
            <button onClick={handleInsertFormula} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors">
              Insert Formula
            </button>
            <button onClick={toggleFormulaDialog} className="px-6 py-2.5 bg-slate-800 text-slate-300 rounded-lg text-sm hover:bg-slate-700 transition-colors">
              Cancel
            </button>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Quick: <code className="bg-slate-800 px-1 rounded">{'\\frac{a}{b}'}</code>{' '}
            <code className="bg-slate-800 px-1 rounded">{'\\sqrt{x}'}</code>{' '}
          </div>
        </div>
      </div>
    );
  };

  // =====================================================
  // IN-APP MANUAL MODAL
  // =====================================================

  const CHATGPT_PROMPT_TEXT = `Act as a GATE subject expert. Create concise, structured handwritten-ready revision notes for the topic: [YOUR TOPIC HERE].

Format the notes strictly using:
1. Markdown headings (# for title, ## for sections, ### for subtopics)
2. Bullet points for key properties and takeaways
3. LaTeX formulas enclosed in $$ ... $$ for display equations and \\( ... \\) for inline math
4. Include at least 2 worked examples with step-by-step math
5. Use special callout blocks for revision highlights:
   > [!REMEMBER] Key things to remember
   > [!GATE TRICK] Fast calculation tricks or shortcuts
   > [!COMMON MISTAKE] Frequent traps or errors in previous GATE questions
   > [!FORMULA] Core equations to memorize`;

  const renderManualModal = () => {
    if (!showManualModal) return null;
    return (
      <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowManualModal(false)}>
        <div className="bg-slate-900 border border-slate-700 rounded-2xl w-[780px] max-h-[85vh] flex flex-col shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xl">📖</span>
              <h2 className="text-base font-bold text-white">GATE Handwritten Notes Studio — User Manual</h2>
            </div>
            <button onClick={() => setShowManualModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              ✕
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 flex-shrink-0">
            {(
              [
                { id: 'syntax', label: '📝 Syntax & Callouts' },
                { id: 'math', label: '∑ LaTeX & Formulas' },
                { id: 'realism', label: '✍️ Handwriting & Paper' },
                { id: 'chatgpt', label: '🤖 ChatGPT Prompt' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setManualTab(t.id)}
                className={`py-3 px-4 text-xs font-semibold transition-colors border-b-2 ${
                  manualTab === t.id
                    ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs text-slate-300 custom-scrollbar">
            {manualTab === 'syntax' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">Headings & Structure</h4>
                  <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-emerald-400 font-mono text-[11px] leading-relaxed">
{`# Main Title (Large handwritten title with decorative border)
## Section Heading (Underlined handwriting)
### Sub-topic
#### Detail Note
---               (Notebook divider line)
[pagebreak]       (Forces content onto next page)`}
                  </pre>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">GATE Callout Boxes</h4>
                  <p className="text-slate-400 mb-2">Special boxes with color-accented borders and icons for high-yield notes:</p>
                  <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-indigo-300 font-mono text-[11px] leading-relaxed">
{`> [!REMEMBER]
> Always verify: trace(A) = sum of eigenvalues and det(A) = product of eigenvalues.

> [!GATE TRICK]
> Solve 2x2 eigenvalues mentally using trace & det!

> [!IMPORTANT]
> A is diagonalizable iff algebraic multiplicity equals geometric multiplicity.

> [!SHORTCUT]
> Real symmetric matrices are always diagonalizable with real eigenvalues.

> [!COMMON MISTAKE]
> Don't confuse eigenvalues of A^2 with squares of eigenvectors.`}
                  </pre>
                </div>
              </div>
            )}

            {manualTab === 'math' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">Inline vs Display Equations</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-slate-400 font-medium">Inline Equation:</span>
                      <pre className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-amber-300 font-mono text-[11px] mt-1">
{`For any eigenvalue \\(\\det(A - \\lambda I) = 0\\), we have...`}
                      </pre>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Block Display Equation:</span>
                      <pre className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-amber-300 font-mono text-[11px] mt-1">
{`$$
A\\mathbf{x} = \\lambda\\mathbf{x}
$$`}
                      </pre>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">Common GATE Math Patterns</h4>
                  <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-slate-300 font-mono text-[11px] leading-relaxed">
{`Matrices:
$$ A = \\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix} $$

Calculus:
$$ \\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}, \\quad \\lim_{x \\to 0} \\frac{\\sin x}{x} = 1 $$

Fractions & Summations:
$$ \\sum_{i=1}^{n} i = \\frac{n(n+1)}{2} $$`}
                  </pre>
                  <p className="text-[11px] text-slate-500 mt-1">💡 Formulas are automatically protected by the paginator so they are never split in half across page boundaries.</p>
                </div>
              </div>
            )}

            {manualTab === 'realism' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1.5">3-Layer Handwriting Realism</h4>
                  <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                    <li><strong className="text-indigo-300">Layer 1 (Curated Fonts):</strong> Select from Kalam, Caveat, Patrick Hand, Schoolbell, etc., or upload your personal font (.ttf, .otf, .woff).</li>
                    <li><strong className="text-indigo-300">Layer 2 (Naturalness Slider):</strong> Adjust 0–100% to control baseline jitter, slight character rotations (±0.5° to 1.5°), spacing inconsistency, and organic margin drift.</li>
                    <li><strong className="text-indigo-300">Layer 3 (Paper Physics):</strong> Choose between Blue Ruled, Light Ruled, Engineering Grid, Dot Grid, or Blank Notebook, with authentic red margin line and binding gutters.</li>
                  </ul>
                </div>

                <div className="p-3 bg-indigo-950/40 border border-indigo-800/40 rounded-xl">
                  <h5 className="font-semibold text-indigo-200 mb-1">🔢 Formula Sheet Mode Tip</h5>
                  <p className="text-slate-300 text-[11px]">
                    Switch between <strong>Study Notes</strong> (spacious narrative notes) and <strong>Formula Sheet</strong> (compact 1, 2, or 3-column layout) for high-density exam revision sheets!
                  </p>
                </div>
              </div>
            )}

            {manualTab === 'chatgpt' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white">Copyable ChatGPT Prompt Template</h4>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(CHATGPT_PROMPT_TEXT);
                      setCopiedPrompt(true);
                      setTimeout(() => setCopiedPrompt(false), 2000);
                    }}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                  >
                    {copiedPrompt ? '✓ Copied!' : '📋 Copy Prompt'}
                  </button>
                </div>
                <p className="text-slate-400">Paste this prompt into ChatGPT to get notes tailored for this studio:</p>
                <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300 font-mono text-[11px] leading-relaxed whitespace-pre-wrap select-all">
{CHATGPT_PROMPT_TEXT}
                </pre>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex justify-end flex-shrink-0">
            <button onClick={() => setShowManualModal(false)} className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors">
              Got it!
            </button>
          </div>
        </div>
      </div>
    );
  };

  // =====================================================
  // MAIN RENDER
  // =====================================================

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-200 overflow-hidden">
      {/* ===== TOP TOOLBAR ===== */}
      <header className="flex items-center justify-between px-4 h-12 bg-slate-900/80 border-b border-slate-800 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            ✍️ GATE Notes Studio
          </h1>
          <div className="h-4 w-px bg-slate-700" />
          <div className="flex items-center bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
            <button
              onClick={() => setMode('study_notes')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                doc.mode === 'study_notes' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Study Notes
            </button>
            <button
              onClick={() => setMode('formula_sheet')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                doc.mode === 'formula_sheet' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Formula Sheet
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Editor/Preview Toggle */}
          <div className="flex items-center bg-slate-800 rounded-lg overflow-hidden border border-slate-700 mr-2">
            {(['editor', 'split', 'preview'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setEditorMode(m)}
                className={`px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                  editorMode === m ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {m === 'split' ? '⬛⬛' : m === 'editor' ? '📝' : '👁️'} {m}
              </button>
            ))}
          </div>

          {/* Toolbar Buttons */}
          <button onClick={() => setShowManualModal(true)} className="px-2.5 py-1 text-xs bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 rounded-md hover:bg-indigo-600/30 transition-colors font-medium flex items-center gap-1" title="Open User Manual & Syntax Guide">
            📖 Manual
          </button>
          <button onClick={toggleFormulaDialog} className="px-2.5 py-1 text-xs bg-slate-800 border border-slate-700 rounded-md text-slate-300 hover:bg-slate-700 hover:text-white transition-colors" title="Insert Formula (Ctrl+M)">
            ƒ Formula
          </button>
          <button onClick={handleQuickGenerate} className="px-3 py-1 text-xs bg-emerald-600/20 border border-emerald-600/30 text-emerald-400 rounded-md hover:bg-emerald-600/30 transition-colors font-medium">
            ⚡ Quick Generate
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ===== LEFT SIDEBAR ===== */}
        {!isSidebarCollapsed && (
          <aside className="w-72 bg-slate-900/50 border-r border-slate-800 flex flex-col flex-shrink-0 overflow-hidden">
            {/* Sidebar Tabs */}
            <div className="flex border-b border-slate-800">
              {sidebarTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSidebarTab(tab.id)}
                  className={`flex-1 py-2.5 text-center transition-colors ${
                    sidebarTab === tab.id
                      ? 'text-indigo-400 border-b-2 border-indigo-400 bg-slate-800/30'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title={tab.label}
                >
                  <div className="text-sm">{tab.icon}</div>
                  <div className="text-[9px] mt-0.5">{tab.label}</div>
                </button>
              ))}
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
              {renderSidebarContent()}
            </div>
          </aside>
        )}

        {/* Sidebar Toggle */}
        <button
          onClick={toggleSidebar}
          className="w-5 flex-shrink-0 flex items-center justify-center bg-slate-900/30 hover:bg-slate-800/50 text-slate-600 hover:text-slate-400 transition-colors border-r border-slate-800"
          title={isSidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
        >
          {isSidebarCollapsed ? '›' : '‹'}
        </button>

        {/* ===== CENTER: EDITOR + PREVIEW ===== */}
        <main className="flex-1 flex overflow-hidden">
          {/* EDITOR */}
          {(editorMode === 'editor' || editorMode === 'split') && (
            <div className={`${editorMode === 'split' ? 'w-1/2' : 'flex-1'} flex flex-col border-r border-slate-800`}>
              <div className="px-3 py-1.5 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-500">📝 Markdown + LaTeX Editor</span>
                <span className="text-[10px] text-slate-600">{doc.rawText.length} chars</span>
              </div>
              <textarea
                value={doc.rawText}
                onChange={handleTextChange}
                placeholder={`Paste your GATE notes here...\n\nSupported:\n# Headings\n- Bullets\n1. Numbered lists\n**Bold** *Italic*\n$$LaTeX formulas$$\n\\(inline math\\)\n| Tables |\n\n> [!REMEMBER] Callout blocks\n> [!IMPORTANT] Important notes\n> [!GATE TRICK] GATE tricks`}
                className="flex-1 w-full px-4 py-3 bg-slate-950 text-slate-200 font-mono text-sm leading-relaxed resize-none focus:outline-none placeholder-slate-700"
                spellCheck={false}
              />
            </div>
          )}

          {/* PREVIEW */}
          {(editorMode === 'preview' || editorMode === 'split') && (
            <div className={`${editorMode === 'split' ? 'w-1/2' : 'flex-1'} flex flex-col bg-slate-800/20`}>
              <div className="px-3 py-1.5 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-500">👁️ Handwritten Preview</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewZoom(Math.max(0.2, previewZoom - 0.1))}
                    className="text-xs text-slate-500 hover:text-slate-300 px-1"
                  >
                    −
                  </button>
                  <span className="text-[10px] text-slate-500 w-10 text-center">
                    {Math.round(previewZoom * 100)}%
                  </span>
                  <button
                    onClick={() => setPreviewZoom(Math.min(1.5, previewZoom + 0.1))}
                    className="text-xs text-slate-500 hover:text-slate-300 px-1"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4 flex flex-col items-center gap-6 custom-scrollbar print-area">
                {pages.map((pageContent, idx) => (
                  <div
                    key={idx}
                    style={{ transform: `scale(${previewZoom})`, transformOrigin: 'top center' }}
                    className="transition-transform"
                  >
                    <HandwrittenPage
                      page={pageContent}
                      font={font}
                      pageConfig={page}
                      handwriting={handwriting}
                      mode={doc.mode}
                      totalPages={pages.length}
                      pageRef={(el) => { pageRefs.current[idx] = el; }}
                      formulaSheetColumns={formulaSheetColumns}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* ===== RIGHT PANEL: EXPORT ===== */}
        <aside className="w-56 bg-slate-900/50 border-l border-slate-800 flex flex-col flex-shrink-0">
          <div className="px-3 py-2 border-b border-slate-800">
            <span className="text-xs font-medium text-slate-400">Export & Navigation</span>
          </div>

          <div className="p-3 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
            {/* Page Navigation */}
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Pages</label>
              <div className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
                <button
                  onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))}
                  disabled={currentPageIndex === 0}
                  className="text-slate-400 hover:text-white disabled:opacity-30 text-sm"
                >
                  ◀
                </button>
                <span className="text-sm font-medium text-slate-200">
                  {currentPageIndex + 1} / {pages.length}
                </span>
                <button
                  onClick={() => setCurrentPageIndex(Math.min(pages.length - 1, currentPageIndex + 1))}
                  disabled={currentPageIndex >= pages.length - 1}
                  className="text-slate-400 hover:text-white disabled:opacity-30 text-sm"
                >
                  ▶
                </button>
              </div>
            </div>

            {/* Page Thumbnails */}
            <div className="space-y-1.5 max-h-52 overflow-y-auto custom-scrollbar">
              {pages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPageIndex(idx)}
                  className={`w-full text-left px-3 py-1.5 rounded text-xs transition-colors ${
                    currentPageIndex === idx
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  📄 Page {idx + 1}
                </button>
              ))}
            </div>

            {/* Zoom */}
            <div>
              <label className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Preview Zoom</span>
                <span>{Math.round(previewZoom * 100)}%</span>
              </label>
              <input
                type="range"
                min="0.2"
                max="1"
                step="0.05"
                value={previewZoom}
                onChange={(e) => setPreviewZoom(parseFloat(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            {/* Export Buttons */}
            <div className="space-y-1.5 pt-2 border-t border-slate-700/50">
              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-wait text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                📥 Download PDF
              </button>
              <button
                onClick={handleExportPNG}
                disabled={isExporting}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg text-xs transition-colors"
              >
                🖼️ Download Current Page (PNG)
              </button>
              <button
                onClick={handleExportAllPNG}
                disabled={isExporting}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg text-xs transition-colors"
              >
                📦 Download All Pages (PNG)
              </button>
              <button
                onClick={() => printPages()}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors"
              >
                🖨️ Print
              </button>
            </div>

            {/* Export status */}
            {(isExporting || exportProgress) && (
              <div className={`text-xs p-2 rounded-lg text-center ${isExporting ? 'bg-indigo-900/30 text-indigo-300 animate-pulse' : 'bg-emerald-900/30 text-emerald-300'}`}>
                {exportProgress || 'Processing...'}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Modals */}
      {renderFormulaDialog()}
      {renderLoadPanel()}
      {renderManualModal()}
    </div>
  );
}
