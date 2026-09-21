import { create } from 'zustand';
import type {
  FontConfig,
  PageConfig,
  HandwritingConfig,
  PageSize,
  PageOrientation,
  PageTemplate,
  MarginConfig,
  BulletStyle,
  InkColor,
  PenThickness,
  PAGE_SIZE_PRESETS,
  MM_TO_PX,
} from '../types';

interface SettingsState {
  font: FontConfig;
  page: PageConfig;
  handwriting: HandwritingConfig;
  formulaSheetColumns: number;
  // Font actions
  setFontFamily: (family: string) => void;
  setFontSize: (size: number) => void;
  setLetterSpacing: (v: number) => void;
  setWordSpacing: (v: number) => void;
  setLineHeight: (v: number) => void;
  setFont: (f: Partial<FontConfig>) => void;
  // Page actions
  setPageSize: (size: PageSize) => void;
  setPageOrientation: (o: PageOrientation) => void;
  setPageTemplate: (t: PageTemplate) => void;
  setCustomBackground: (url: string) => void;
  setBackgroundOpacity: (o: number) => void;
  setMargins: (m: Partial<MarginConfig>) => void;
  setPage: (p: Partial<PageConfig>) => void;
  // Handwriting actions
  setNaturalness: (v: number) => void;
  setInkColor: (c: InkColor) => void;
  setCustomInkColor: (c: string) => void;
  setPenThickness: (t: PenThickness) => void;
  setBulletStyle: (s: BulletStyle) => void;
  setParagraphIndent: (v: number) => void;
  setHandwriting: (h: Partial<HandwritingConfig>) => void;
  setFormulaSheetColumns: (c: number) => void;
}

const MM_PX = 3.7795275591;

function computeDimensions(size: PageSize, orientation: PageOrientation, customW?: number, customH?: number) {
  const presets: Record<string, { widthMm: number; heightMm: number }> = {
    A4: { widthMm: 210, heightMm: 297 },
    A5: { widthMm: 148, heightMm: 210 },
    Letter: { widthMm: 216, heightMm: 279 },
    Legal: { widthMm: 216, heightMm: 356 },
    Custom: { widthMm: customW || 210, heightMm: customH || 297 },
  };
  const base = presets[size] || presets.A4;
  const w = orientation === 'landscape' ? base.heightMm : base.widthMm;
  const h = orientation === 'landscape' ? base.widthMm : base.heightMm;
  return {
    widthMm: w,
    heightMm: h,
    widthPx: Math.round(w * MM_PX),
    heightPx: Math.round(h * MM_PX),
  };
}

const defaultPage: PageConfig = {
  size: 'A4',
  orientation: 'portrait',
  template: 'light_ruled',
  backgroundOpacity: 1,
  dimensions: computeDimensions('A4', 'portrait'),
  margins: { top: 20, bottom: 20, left: 25, right: 15, binding: 0 },
};

const defaultFont: FontConfig = {
  family: 'Kalam',
  size: 18,
  letterSpacing: 0.3,
  wordSpacing: 2,
  lineHeight: 1.9,
};

const defaultHandwriting: HandwritingConfig = {
  naturalness: 25,
  baselineVariation: 1.2,
  characterRotation: 0.8,
  spacingVariation: 0.5,
  positionVariation: 0.3,
  inkColor: 'blue',
  customInkColor: '#1a3a7a',
  penThickness: 'normal',
  paragraphIndent: 20,
  bulletStyle: 'dot',
};

export const useSettingsStore = create<SettingsState>((set) => ({
  font: defaultFont,
  page: defaultPage,
  handwriting: defaultHandwriting,
  formulaSheetColumns: 1,

  setFontFamily: (family) => set((s) => ({ font: { ...s.font, family } })),
  setFontSize: (size) => set((s) => ({ font: { ...s.font, size } })),
  setLetterSpacing: (letterSpacing) => set((s) => ({ font: { ...s.font, letterSpacing } })),
  setWordSpacing: (wordSpacing) => set((s) => ({ font: { ...s.font, wordSpacing } })),
  setLineHeight: (lineHeight) => set((s) => ({ font: { ...s.font, lineHeight } })),
  setFont: (f) => set((s) => ({ font: { ...s.font, ...f } })),

  setPageSize: (size) =>
    set((s) => ({
      page: {
        ...s.page,
        size,
        dimensions: computeDimensions(size, s.page.orientation),
      },
    })),
  setPageOrientation: (orientation) =>
    set((s) => ({
      page: {
        ...s.page,
        orientation,
        dimensions: computeDimensions(s.page.size, orientation),
      },
    })),
  setPageTemplate: (template) => set((s) => ({ page: { ...s.page, template } })),
  setCustomBackground: (url) =>
    set((s) => ({ page: { ...s.page, customBackgroundUrl: url, template: 'custom' as PageTemplate } })),
  setBackgroundOpacity: (backgroundOpacity) => set((s) => ({ page: { ...s.page, backgroundOpacity } })),
  setMargins: (m) => set((s) => ({ page: { ...s.page, margins: { ...s.page.margins, ...m } } })),
  setPage: (p) => set((s) => ({ page: { ...s.page, ...p } })),

  setNaturalness: (naturalness) => {
    const scale = naturalness / 100;
    set((s) => ({
      handwriting: {
        ...s.handwriting,
        naturalness,
        baselineVariation: scale * 4,
        characterRotation: scale * 3,
        spacingVariation: scale * 2,
        positionVariation: scale * 1.5,
      },
    }));
  },
  setInkColor: (inkColor) => set((s) => ({ handwriting: { ...s.handwriting, inkColor } })),
  setCustomInkColor: (customInkColor) =>
    set((s) => ({ handwriting: { ...s.handwriting, customInkColor, inkColor: 'custom' as InkColor } })),
  setPenThickness: (penThickness) => set((s) => ({ handwriting: { ...s.handwriting, penThickness } })),
  setBulletStyle: (bulletStyle) => set((s) => ({ handwriting: { ...s.handwriting, bulletStyle } })),
  setParagraphIndent: (paragraphIndent) => set((s) => ({ handwriting: { ...s.handwriting, paragraphIndent } })),
  setHandwriting: (h) => set((s) => ({ handwriting: { ...s.handwriting, ...h } })),
  setFormulaSheetColumns: (formulaSheetColumns) => set({ formulaSheetColumns }),
}));
