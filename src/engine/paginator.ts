import type { Block, PageContent, FontConfig, PageConfig, HandwritingConfig, DocumentMode } from '../types';

/**
 * Smart paginator that splits blocks across pages.
 * 
 * Rules:
 * - Never cut a formula in half
 * - Keep heading + first content block together
 * - Keep bullet groups together
 * - Keep equations together
 * - Avoid orphan headings
 * - Intelligently continue on next page
 */

interface PaginationContext {
  pageHeightPx: number;
  contentWidthPx: number;
  font: FontConfig;
  handwriting: HandwritingConfig;
  mode: DocumentMode;
}

// Estimated block heights in pixels
function estimateBlockHeight(block: Block, ctx: PaginationContext): number {
  const fontSize = ctx.font.size;
  const lineH = fontSize * ctx.font.lineHeight;

  switch (block.type) {
    case 'heading': {
      const scale = block.level === 1 ? 1.6 : block.level === 2 ? 1.35 : block.level === 3 ? 1.2 : 1.1;
      return lineH * scale + 16; // heading + bottom margin
    }
    case 'paragraph': {
      const text = block.content || '';
      const charsPerLine = Math.floor(ctx.contentWidthPx / (fontSize * 0.55));
      const numLines = Math.max(1, Math.ceil(text.length / charsPerLine));
      return numLines * lineH + 12;
    }
    case 'formula': {
      // Display formulas take more space
      const latex = block.latex || '';
      const hasMultiline = latex.includes('\\\\') || latex.includes('begin{');
      if (hasMultiline) {
        const lineCount = (latex.match(/\\\\/g) || []).length + 1;
        return Math.max(60, lineCount * 30 + 40);
      }
      return block.displayMode ? 70 : lineH + 8;
    }
    case 'bullet':
    case 'numbered': {
      const items = block.items || [];
      let total = 0;
      const charsPerLine = Math.floor(ctx.contentWidthPx / (fontSize * 0.55));
      for (const item of items) {
        total += Math.max(1, Math.ceil(item.length / charsPerLine)) * lineH + 4;
      }
      return total + 12;
    }
    case 'table': {
      const rowCount = (block.rows?.length || 0) + 1; // +1 for header
      return rowCount * (lineH + 10) + 20;
    }
    case 'callout': {
      if (block.children && block.children.length > 0) {
        let total = 36; // title + padding
        for (const child of block.children) {
          total += estimateBlockHeight(child, ctx);
        }
        return total;
      }
      const content = block.content || '';
      const charsPerLine = Math.floor((ctx.contentWidthPx - 40) / (fontSize * 0.55));
      const numLines = Math.max(1, Math.ceil(content.length / charsPerLine));
      return (numLines + 1) * lineH + 36; // +1 for title, +padding
    }
    case 'divider':
      return 24;
    case 'code': {
      const codeContent = block.content || '';
      const codeLineCount = codeContent.split('\n').length;
      // Code uses ~0.85x font size, plus padding/border
      const codeLineH = fontSize * 0.85 * ctx.font.lineHeight;
      return codeLineCount * codeLineH + 28; // 28px for padding + border
    }
    case 'pagebreak':
      return Infinity; // Forces page break
    case 'image':
      return 200; // Default image height estimate
    default:
      return lineH + 8;
  }
}

export function paginateBlocks(
  blocks: Block[],
  pageConfig: PageConfig,
  font: FontConfig,
  handwriting: HandwritingConfig,
  mode: DocumentMode
): PageContent[] {
  const margins = pageConfig.margins;
  const marginTopPx = margins.top * 3.78;
  const marginBottomPx = margins.bottom * 3.78;
  const marginLeftPx = (margins.left + margins.binding) * 3.78;
  const marginRightPx = margins.right * 3.78;

  const contentHeightPx = pageConfig.dimensions.heightPx - marginTopPx - marginBottomPx;
  const contentWidthPx = pageConfig.dimensions.widthPx - marginLeftPx - marginRightPx;

  const ctx: PaginationContext = {
    pageHeightPx: contentHeightPx,
    contentWidthPx,
    font,
    handwriting,
    mode,
  };

  const pages: PageContent[] = [];
  let currentPage: Block[] = [];
  let currentHeight = 0;
  let pageNumber = 1;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const blockHeight = estimateBlockHeight(block, ctx);

    // Page break block
    if (block.type === 'pagebreak') {
      pages.push({ pageNumber, blocks: currentPage });
      currentPage = [];
      currentHeight = 0;
      pageNumber++;
      continue;
    }

    // Would this block fit on the current page?
    if (currentHeight + blockHeight > contentHeightPx && currentPage.length > 0) {
      // Don't orphan a heading — check if current block is a heading
      // If so, push it to the next page
      pages.push({ pageNumber, blocks: currentPage });
      currentPage = [];
      currentHeight = 0;
      pageNumber++;
    }

    // If this is a heading, try to keep it with the next block
    if (block.type === 'heading' && i + 1 < blocks.length) {
      const nextBlockHeight = estimateBlockHeight(blocks[i + 1], ctx);
      if (currentHeight + blockHeight + nextBlockHeight > contentHeightPx && currentPage.length > 0) {
        // Push heading + next block to new page
        pages.push({ pageNumber, blocks: currentPage });
        currentPage = [];
        currentHeight = 0;
        pageNumber++;
      }
    }

    currentPage.push(block);
    currentHeight += blockHeight;
  }

  // Last page
  if (currentPage.length > 0) {
    pages.push({ pageNumber, blocks: currentPage });
  }

  // Ensure at least one page
  if (pages.length === 0) {
    pages.push({ pageNumber: 1, blocks: [] });
  }

  return pages;
}
