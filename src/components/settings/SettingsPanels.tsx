import React, { useState, useCallback } from 'react';
import type { FontConfig, HandwritingConfig, PageConfig } from '../../types';
import { getAllFonts, getRecommendedFonts } from '../../fonts/registry';
import { BACKGROUND_REGISTRY, generateBackground } from '../../backgrounds/registry';
import { useSettingsStore } from '../../store/settings';

// =====================================================
// FONT GALLERY
// =====================================================

const SAMPLE_TEXT = `GATE DA — Linear Algebra

Eigenvalues & Eigenvectors

For a square matrix A, the characteristic equation is det(A - λI) = 0. The roots are eigenvalues.`;

export const FontGallery: React.FC = () => {
  const font = useSettingsStore((s) => s.font);
  const setFontFamily = useSettingsStore((s) => s.setFontFamily);
  const setFont = useSettingsStore((s) => s.setFont);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'recommended'>('recommended');

  const allFonts = getAllFonts();
  const recommended = getRecommendedFonts();
  const displayFonts = (filter === 'recommended' ? recommended : allFonts).filter((f) =>
    f.displayName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder="Search fonts..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
      />

      <div className="flex gap-1">
        <button
          onClick={() => setFilter('recommended')}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            filter === 'recommended'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          ★ Recommended
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            filter === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          All Fonts
        </button>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
        {displayFonts.map((f) => (
          <button
            key={f.id}
            onClick={() => {
              setFontFamily(f.family);
              setFont({ ...f.spacingHints });
            }}
            className={`w-full text-left p-3 rounded-lg border transition-all ${
              font.family === f.family
                ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500/30'
                : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-slate-300">{f.displayName}</span>
              <div className="flex items-center gap-1.5">
                {f.isRecommended && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded">
                    GATE
                  </span>
                )}
                <span className="text-[10px] px-1.5 py-0.5 bg-slate-700 text-slate-400 rounded capitalize">
                  {f.style}
                </span>
              </div>
            </div>
            <div
              style={{
                fontFamily: `"${f.family}", cursive, sans-serif`,
                fontSize: '13px',
                lineHeight: 1.5,
                color: '#c8d0e0',
              }}
            >
              {SAMPLE_TEXT.split('\n')[0]}
            </div>
            <div
              style={{
                fontFamily: `"${f.family}", cursive, sans-serif`,
                fontSize: '11px',
                lineHeight: 1.4,
                color: '#8090a8',
                marginTop: '2px',
              }}
            >
              det(A - λI) = 0 — The roots are eigenvalues.
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// =====================================================
// BACKGROUND GALLERY
// =====================================================

export const BackgroundGallery: React.FC = () => {
  const pageConfig = useSettingsStore((s) => s.page);
  const setPageTemplate = useSettingsStore((s) => s.setPageTemplate);
  const setCustomBackground = useSettingsStore((s) => s.setCustomBackground);
  const setBackgroundOpacity = useSettingsStore((s) => s.setBackgroundOpacity);

  const handleUploadBackground = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCustomBackground(reader.result as string);
    reader.readAsDataURL(file);
  }, [setCustomBackground]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {BACKGROUND_REGISTRY.map((bg) => {
          const bgStyle = generateBackground(bg.id, 1);
          return (
            <button
              key={bg.id}
              onClick={() => setPageTemplate(bg.id)}
              className={`p-1 rounded-lg border transition-all ${
                pageConfig.template === bg.id
                  ? 'border-indigo-500 ring-1 ring-indigo-500/30'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              <div
                style={{
                  ...bgStyle,
                  width: '100%',
                  height: '60px',
                  borderRadius: '4px',
                }}
              />
              <span className="text-[10px] text-slate-400 mt-1 block">{bg.name}</span>
            </button>
          );
        })}
      </div>

      {/* Upload custom background */}
      <div>
        <label className="block text-xs text-slate-400 mb-1">Custom Background</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleUploadBackground}
          className="w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-slate-700 file:text-slate-300 file:text-xs file:cursor-pointer hover:file:bg-slate-600"
        />
      </div>

      {/* Opacity slider */}
      <div>
        <label className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Background Opacity</span>
          <span className="text-slate-500">{Math.round(pageConfig.backgroundOpacity * 100)}%</span>
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={pageConfig.backgroundOpacity}
          onChange={(e) => setBackgroundOpacity(parseFloat(e.target.value))}
          className="w-full accent-indigo-500"
        />
      </div>
    </div>
  );
};

// =====================================================
// HANDWRITING SETTINGS
// =====================================================

export const HandwritingSettings: React.FC = () => {
  const handwriting = useSettingsStore((s) => s.handwriting);
  const font = useSettingsStore((s) => s.font);
  const setNaturalness = useSettingsStore((s) => s.setNaturalness);
  const setInkColor = useSettingsStore((s) => s.setInkColor);
  const setCustomInkColor = useSettingsStore((s) => s.setCustomInkColor);
  const setPenThickness = useSettingsStore((s) => s.setPenThickness);
  const setBulletStyle = useSettingsStore((s) => s.setBulletStyle);
  const setParagraphIndent = useSettingsStore((s) => s.setParagraphIndent);
  const setFontSize = useSettingsStore((s) => s.setFontSize);
  const setLetterSpacing = useSettingsStore((s) => s.setLetterSpacing);
  const setWordSpacing = useSettingsStore((s) => s.setWordSpacing);
  const setLineHeight = useSettingsStore((s) => s.setLineHeight);

  const naturalnessLabel = (v: number) => {
    if (v === 0) return 'Digital Clean';
    if (v <= 10) return 'Slightly Natural';
    if (v <= 25) return 'Student Notes';
    if (v <= 40) return 'Strongly Handwritten';
    return 'Artistic/Irregular';
  };

  return (
    <div className="space-y-4">
      {/* Naturalness — the key slider */}
      <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
        <label className="flex items-center justify-between text-xs font-medium text-indigo-300 mb-1">
          <span>✨ Naturalness</span>
          <span className="text-indigo-400">{handwriting.naturalness}% — {naturalnessLabel(handwriting.naturalness)}</span>
        </label>
        <input
          type="range"
          min="0"
          max="80"
          step="1"
          value={handwriting.naturalness}
          onChange={(e) => setNaturalness(parseInt(e.target.value))}
          className="w-full accent-indigo-500"
        />
        <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
          <span>Clean</span>
          <span>Natural</span>
          <span>Artistic</span>
        </div>
      </div>

      {/* Font Size */}
      <SettingSlider label="Font Size" value={font.size} min={12} max={32} step={1} unit="px" onChange={setFontSize} />
      <SettingSlider label="Letter Spacing" value={font.letterSpacing} min={-1} max={3} step={0.1} unit="px" onChange={setLetterSpacing} />
      <SettingSlider label="Word Spacing" value={font.wordSpacing} min={0} max={8} step={0.5} unit="px" onChange={setWordSpacing} />
      <SettingSlider label="Line Height" value={font.lineHeight} min={1.2} max={3} step={0.05} unit="×" onChange={setLineHeight} />
      <SettingSlider label="Paragraph Indent" value={handwriting.paragraphIndent} min={0} max={60} step={2} unit="px" onChange={setParagraphIndent} />

      {/* Ink Color */}
      <div>
        <label className="block text-xs text-slate-400 mb-1.5">Pen Color</label>
        <div className="flex gap-2">
          {(['blue', 'black', 'dark_blue'] as const).map((color) => {
            const colors: Record<string, string> = {
              blue: '#1a3a8a',
              black: '#1a1a1a',
              dark_blue: '#0d2357',
            };
            return (
              <button
                key={color}
                onClick={() => setInkColor(color)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  handwriting.inkColor === color ? 'border-white scale-110' : 'border-slate-600'
                }`}
                style={{ backgroundColor: colors[color] }}
                title={color.replace('_', ' ')}
              />
            );
          })}
          <input
            type="color"
            value={handwriting.customInkColor}
            onChange={(e) => setCustomInkColor(e.target.value)}
            className="w-8 h-8 rounded-full border-2 border-slate-600 cursor-pointer bg-transparent"
            title="Custom color"
          />
        </div>
      </div>

      {/* Pen Thickness */}
      <div>
        <label className="block text-xs text-slate-400 mb-1.5">Pen Thickness</label>
        <div className="flex gap-1">
          {(['thin', 'normal', 'medium'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setPenThickness(t)}
              className={`flex-1 py-1.5 rounded-md text-xs capitalize transition-colors ${
                handwriting.penThickness === t
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Bullet Style */}
      <div>
        <label className="block text-xs text-slate-400 mb-1.5">Bullet Style</label>
        <div className="flex gap-1">
          {([
            { id: 'dot', char: '•' },
            { id: 'circle', char: '○' },
            { id: 'arrow', char: '→' },
            { id: 'check', char: '✓' },
            { id: 'dash', char: '–' },
          ] as const).map((b) => (
            <button
              key={b.id}
              onClick={() => setBulletStyle(b.id)}
              className={`flex-1 py-1.5 rounded-md text-sm transition-colors ${
                handwriting.bulletStyle === b.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {b.char}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// =====================================================
// PAGE SETTINGS
// =====================================================

export const PageSettings: React.FC = () => {
  const page = useSettingsStore((s) => s.page);
  const setPageSize = useSettingsStore((s) => s.setPageSize);
  const setPageOrientation = useSettingsStore((s) => s.setPageOrientation);
  const setMargins = useSettingsStore((s) => s.setMargins);

  return (
    <div className="space-y-4">
      {/* Page Size */}
      <div>
        <label className="block text-xs text-slate-400 mb-1.5">Page Size</label>
        <select
          value={page.size}
          onChange={(e) => setPageSize(e.target.value as any)}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="A4">A4 (210 × 297 mm)</option>
          <option value="A5">A5 (148 × 210 mm)</option>
          <option value="Letter">Letter (8.5 × 11 in)</option>
          <option value="Legal">Legal (8.5 × 14 in)</option>
        </select>
      </div>

      {/* Orientation */}
      <div>
        <label className="block text-xs text-slate-400 mb-1.5">Orientation</label>
        <div className="flex gap-1">
          {(['portrait', 'landscape'] as const).map((o) => (
            <button
              key={o}
              onClick={() => setPageOrientation(o)}
              className={`flex-1 py-1.5 rounded-md text-xs capitalize transition-colors ${
                page.orientation === o
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      </div>

      {/* Margins */}
      <div>
        <label className="block text-xs text-slate-400 mb-2">Margins (mm)</label>
        <div className="grid grid-cols-2 gap-2">
          <MarginInput label="Top" value={page.margins.top} onChange={(v) => setMargins({ top: v })} />
          <MarginInput label="Bottom" value={page.margins.bottom} onChange={(v) => setMargins({ bottom: v })} />
          <MarginInput label="Left" value={page.margins.left} onChange={(v) => setMargins({ left: v })} />
          <MarginInput label="Right" value={page.margins.right} onChange={(v) => setMargins({ right: v })} />
          <MarginInput label="Binding" value={page.margins.binding} onChange={(v) => setMargins({ binding: v })} />
        </div>
      </div>

      {/* Page Info */}
      <div className="text-[10px] text-slate-500 p-2 bg-slate-800/50 rounded">
        Content area: {page.dimensions.widthPx}×{page.dimensions.heightPx}px
        ({page.dimensions.widthMm}×{page.dimensions.heightMm}mm)
      </div>
    </div>
  );
};

// =====================================================
// HELPER COMPONENTS
// =====================================================

const SettingSlider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}> = ({ label, value, min, max, step, unit, onChange }) => (
  <div>
    <label className="flex items-center justify-between text-xs text-slate-400 mb-1">
      <span>{label}</span>
      <span className="text-slate-500">{typeof value === 'number' ? (Number.isInteger(step) ? value : value.toFixed(1)) : value}{unit}</span>
    </label>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full accent-indigo-500"
    />
  </div>
);

const MarginInput: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
}> = ({ label, value, onChange }) => (
  <div className="flex items-center gap-2">
    <span className="text-[10px] text-slate-500 w-12">{label}</span>
    <input
      type="number"
      min={0}
      max={100}
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value) || 0)}
      className="flex-1 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-200 w-16 focus:outline-none focus:border-indigo-500"
    />
  </div>
);
