// ===== DOCUMENT TYPES =====

export type DocumentMode = 'study_notes' | 'formula_sheet';

export type BlockType =
  | 'heading'
  | 'paragraph'
  | 'formula'
  | 'bullet'
  | 'numbered'
  | 'table'
  | 'image'
  | 'divider'
  | 'callout'
  | 'pagebreak'
  | 'code';

export type CalloutType =
  | 'remember'
  | 'important'
  | 'shortcut'
  | 'warning'
  | 'common_mistake'
  | 'gate_trick'
  | 'definition'
  | 'formula_note'
  | 'example';

export type HeadingLevel = 1 | 2 | 3 | 4;

export interface Block {
  id: string;
  type: BlockType;
  // Heading
  text?: string;
  level?: HeadingLevel;
  // Paragraph
  content?: string;
  // Formula
  latex?: string;
  displayMode?: boolean;
  numbered?: boolean;
  // Bullet / Numbered
  items?: string[];
  // Table
  headers?: string[];
  rows?: string[][];
  // Callout
  calloutType?: CalloutType;
  calloutTitle?: string;
  children?: Block[];
  // Image
  imageUrl?: string;
  imageCaption?: string;
  // Code
  language?: string;
}

export interface DocumentModel {
  id: string;
  title: string;
  mode: DocumentMode;
  subject: string;
  createdAt: number;
  updatedAt: number;
  rawText: string;
  blocks: Block[];
}

// ===== PAGE TYPES =====

export type PageSize = 'A4' | 'A5' | 'Letter' | 'Legal' | 'Custom';
export type PageOrientation = 'portrait' | 'landscape';
export type PageTemplate =
  | 'white'
  | 'blue_ruled'
  | 'light_ruled'
  | 'graph'
  | 'engineering_graph'
  | 'dot_grid'
  | 'blank_notebook'
  | 'exam_rough'
  | 'formula_revision'
  | 'custom';

export interface PageDimensions {
  widthMm: number;
  heightMm: number;
  widthPx: number;
  heightPx: number;
}

export interface MarginConfig {
  top: number;
  bottom: number;
  left: number;
  right: number;
  binding: number;
}

export interface PageConfig {
  size: PageSize;
  orientation: PageOrientation;
  template: PageTemplate;
  customBackgroundUrl?: string;
  backgroundOpacity: number;
  dimensions: PageDimensions;
  margins: MarginConfig;
  customWidthMm?: number;
  customHeightMm?: number;
}

// ===== FONT TYPES =====

export interface FontDefinition {
  id: string;
  family: string;
  displayName: string;
  style: 'handwriting' | 'cursive' | 'casual' | 'print';
  googleFontsUrl?: string;
  isCustom: boolean;
  isRecommended: boolean;
  languages: string[];
  spacingHints: {
    letterSpacing: number;
    wordSpacing: number;
    lineHeight: number;
  };
}

export interface FontConfig {
  family: string;
  size: number;
  letterSpacing: number;
  wordSpacing: number;
  lineHeight: number;
}

// ===== HANDWRITING TYPES =====

export type BulletStyle = 'dot' | 'circle' | 'arrow' | 'check' | 'dash';
export type InkColor = 'blue' | 'black' | 'dark_blue' | 'custom';
export type PenThickness = 'thin' | 'normal' | 'medium';

export interface HandwritingConfig {
  naturalness: number; // 0-100
  baselineVariation: number;
  characterRotation: number;
  spacingVariation: number;
  positionVariation: number;
  inkColor: InkColor;
  customInkColor: string;
  penThickness: PenThickness;
  paragraphIndent: number;
  bulletStyle: BulletStyle;
}

// ===== RENDER TYPES =====

export interface PageContent {
  pageNumber: number;
  blocks: Block[];
}

export interface RenderConfig {
  font: FontConfig;
  page: PageConfig;
  handwriting: HandwritingConfig;
  mode: DocumentMode;
  formulaSheetColumns: number;
}

// ===== EXPORT TYPES =====

export type ExportFormat = 'pdf' | 'png' | 'jpeg';

export interface ExportConfig {
  format: ExportFormat;
  quality: number; // 0-1 for JPEG
  scale: number; // 2 for ~192 DPI, 3 for ~288 DPI
  allPages: boolean;
  currentPage?: number;
}

// ===== AI TYPES =====

export type AIAction =
  | 'summarize'
  | 'simplify'
  | 'convert_to_gate_notes'
  | 'generate_formula_sheet'
  | 'convert_to_bullets'
  | 'explain_teluglish'
  | 'extract_formulas'
  | 'find_important'
  | 'generate_revision';

export interface AIProvider {
  name: string;
  isAvailable: () => boolean;
  execute: (action: AIAction, input: string) => Promise<string>;
}

// ===== GATE SUBJECTS =====

export const GATE_SUBJECTS = [
  'Probability & Statistics',
  'Linear Algebra',
  'Calculus & Optimization',
  'Machine Learning',
  'Artificial Intelligence',
  'Algorithms',
  'Data Structures',
  'Database Management Systems',
  'Data Warehousing',
  'Programming / Python',
  'Other',
] as const;

export type GATESubject = (typeof GATE_SUBJECTS)[number];

// ===== STORAGE TYPES =====

export interface SavedDocument {
  id: string;
  title: string;
  mode: DocumentMode;
  subject: string;
  updatedAt: number;
  data: DocumentModel;
}

// ===== PAGE SIZE PRESETS =====

export const PAGE_SIZE_PRESETS: Record<PageSize, { widthMm: number; heightMm: number }> = {
  A4: { widthMm: 210, heightMm: 297 },
  A5: { widthMm: 148, heightMm: 210 },
  Letter: { widthMm: 216, heightMm: 279 },
  Legal: { widthMm: 216, heightMm: 356 },
  Custom: { widthMm: 210, heightMm: 297 },
};

// Scale factor: 1mm ≈ 3.7795275591 pixels at 96 DPI
export const MM_TO_PX = 3.7795275591;
export const EXPORT_SCALE = 2.6; // ~250 DPI for good print quality without huge files
