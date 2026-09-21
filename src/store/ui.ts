import { create } from 'zustand';

export type SidebarTab = 'import' | 'fonts' | 'backgrounds' | 'page' | 'handwriting' | 'formatting';

interface UIState {
  sidebarTab: SidebarTab;
  currentPageIndex: number;
  totalPages: number;
  previewZoom: number;
  showFormulaDialog: boolean;
  showExportDialog: boolean;
  showSaveDialog: boolean;
  showLoadDialog: boolean;
  showQuickGenerate: boolean;
  isSidebarCollapsed: boolean;
  isRightPanelCollapsed: boolean;
  editorMode: 'editor' | 'preview' | 'split';
  // Actions
  setSidebarTab: (tab: SidebarTab) => void;
  setCurrentPageIndex: (idx: number) => void;
  setTotalPages: (n: number) => void;
  setPreviewZoom: (z: number) => void;
  toggleFormulaDialog: () => void;
  toggleExportDialog: () => void;
  toggleSaveDialog: () => void;
  toggleLoadDialog: () => void;
  toggleQuickGenerate: () => void;
  toggleSidebar: () => void;
  toggleRightPanel: () => void;
  setEditorMode: (m: 'editor' | 'preview' | 'split') => void;
  nextPage: () => void;
  prevPage: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarTab: 'import',
  currentPageIndex: 0,
  totalPages: 1,
  previewZoom: 0.5,
  showFormulaDialog: false,
  showExportDialog: false,
  showSaveDialog: false,
  showLoadDialog: false,
  showQuickGenerate: false,
  isSidebarCollapsed: false,
  isRightPanelCollapsed: false,
  editorMode: 'split',

  setSidebarTab: (sidebarTab) => set({ sidebarTab }),
  setCurrentPageIndex: (currentPageIndex) => set({ currentPageIndex }),
  setTotalPages: (totalPages) => set({ totalPages }),
  setPreviewZoom: (previewZoom) => set({ previewZoom }),
  toggleFormulaDialog: () => set((s) => ({ showFormulaDialog: !s.showFormulaDialog })),
  toggleExportDialog: () => set((s) => ({ showExportDialog: !s.showExportDialog })),
  toggleSaveDialog: () => set((s) => ({ showSaveDialog: !s.showSaveDialog })),
  toggleLoadDialog: () => set((s) => ({ showLoadDialog: !s.showLoadDialog })),
  toggleQuickGenerate: () => set((s) => ({ showQuickGenerate: !s.showQuickGenerate })),
  toggleSidebar: () => set((s) => ({ isSidebarCollapsed: !s.isSidebarCollapsed })),
  toggleRightPanel: () => set((s) => ({ isRightPanelCollapsed: !s.isRightPanelCollapsed })),
  setEditorMode: (editorMode) => set({ editorMode }),
  nextPage: () =>
    set((s) => ({
      currentPageIndex: Math.min(s.currentPageIndex + 1, s.totalPages - 1),
    })),
  prevPage: () =>
    set((s) => ({
      currentPageIndex: Math.max(s.currentPageIndex - 1, 0),
    })),
}));
