import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import type { PageConfig, ExportConfig } from '../types';

/**
 * Render a single page DOM element to a canvas at the given scale.
 */
async function pageToCanvas(
  pageElement: HTMLElement,
  scale: number,
  pageConfig?: PageConfig
): Promise<HTMLCanvasElement> {
  const widthPx = pageConfig?.dimensions.widthPx || pageElement.offsetWidth || 794;
  const heightPx = pageConfig?.dimensions.heightPx || pageElement.offsetHeight || 1123;

  // Make sure fonts in main document are fully ready before cloning
  try {
    await document.fonts.ready;
  } catch (e) {
    // continue
  }

  return html2canvas(pageElement, {
    scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    width: widthPx,
    height: heightPx,
    windowWidth: widthPx,
    windowHeight: heightPx,
    scrollX: 0,
    scrollY: 0,
    x: 0,
    y: 0,
    onclone: async (clonedDoc, element) => {
      // 1. Remove all zoom/scaling transforms from all ancestor elements
      let curr: HTMLElement | null = element.parentElement;
      while (curr && curr !== clonedDoc.body) {
        curr.style.transform = 'none';
        curr.style.transformOrigin = 'top left';
        curr.style.margin = '0';
        curr.style.padding = '0';
        curr.style.width = `${widthPx}px`;
        curr.style.overflow = 'visible';
        curr = curr.parentElement;
      }

      // 2. Ensure cloned element is strictly rendered at 1:1 scale
      element.style.transform = 'none';
      element.style.transformOrigin = 'top left';
      element.style.margin = '0';
      element.style.width = `${widthPx}px`;
      element.style.height = `${heightPx}px`;
      element.style.boxShadow = 'none';

      // 3. Reset KaTeX styles to prevent character overlap in canvas
      const katexNodes = element.querySelectorAll<HTMLElement>('.katex, .katex *');
      katexNodes.forEach((node) => {
        node.style.letterSpacing = 'normal';
        node.style.wordSpacing = 'normal';
        (node.style as any).WebkitTextStroke = '0px';
      });

      // 4. Wait for fonts in cloned document
      try {
        if (clonedDoc.fonts) {
          await clonedDoc.fonts.ready;
        }
      } catch (e) {
        // continue
      }
    },
  });
}

/**
 * Export all pages as a multi-page PDF.
 */
export async function exportPDF(
  pageElements: HTMLElement[],
  pageConfig: PageConfig,
  config: ExportConfig,
  onProgress?: (current: number, total: number) => void
): Promise<Blob> {
  const { widthMm, heightMm } = pageConfig.dimensions;
  const orientation = pageConfig.orientation === 'landscape' ? 'l' : 'p';

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: [widthMm, heightMm],
    compress: true,
  });

  const pagesToExport = config.allPages
    ? pageElements
    : config.currentPage !== undefined
    ? [pageElements[config.currentPage]]
    : pageElements;

  for (let i = 0; i < pagesToExport.length; i++) {
    if (onProgress) onProgress(i + 1, pagesToExport.length);

    const canvas = await pageToCanvas(pagesToExport[i], config.scale, pageConfig);

    if (i > 0) {
      pdf.addPage([widthMm, heightMm], orientation);
    }

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    pdf.addImage(imgData, 'JPEG', 0, 0, widthMm, heightMm, undefined, 'FAST');
  }

  return pdf.output('blob');
}

/**
 * Export a single page as PNG or JPEG.
 */
export async function exportImage(
  pageElement: HTMLElement,
  format: 'png' | 'jpeg',
  scale: number,
  quality: number = 0.95,
  pageConfig?: PageConfig
): Promise<Blob> {
  const canvas = await pageToCanvas(pageElement, scale, pageConfig);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create image blob'));
      },
      format === 'png' ? 'image/png' : 'image/jpeg',
      quality
    );
  });
}

/**
 * Export all pages as individual images.
 */
export async function exportAllImages(
  pageElements: HTMLElement[],
  format: 'png' | 'jpeg',
  scale: number,
  quality: number = 0.95,
  pageConfig?: PageConfig,
  onProgress?: (current: number, total: number) => void
): Promise<Blob[]> {
  const blobs: Blob[] = [];
  for (let i = 0; i < pageElements.length; i++) {
    if (onProgress) onProgress(i + 1, pageElements.length);
    const blob = await exportImage(pageElements[i], format, scale, quality, pageConfig);
    blobs.push(blob);
  }
  return blobs;
}

/**
 * Download a blob as a file.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Open print dialog for the page preview area.
 */
export function printPages(): void {
  window.print();
}
