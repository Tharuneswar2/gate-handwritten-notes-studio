import katex from 'katex';

/**
 * Render LaTeX to HTML string using KaTeX.
 * Falls back to raw LaTeX text in a styled span on error.
 */
export function renderLatexToHTML(latex: string, displayMode: boolean = false): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      trust: true,
      strict: false,
      output: 'html',
    });
  } catch (e) {
    console.warn('KaTeX rendering error:', e);
    return `<span class="katex-error" style="color: #c00; font-family: monospace;">${escapeHtml(latex)}</span>`;
  }
}

/**
 * Render LaTeX to an HTML element (for DOM insertion).
 */
export function renderLatexToElement(latex: string, displayMode: boolean = false): HTMLSpanElement {
  const span = document.createElement('span');
  try {
    katex.render(latex, span, {
      displayMode,
      throwOnError: false,
      trust: true,
      strict: false,
    });
  } catch (e) {
    span.textContent = latex;
    span.style.color = '#c00';
    span.style.fontFamily = 'monospace';
  }
  return span;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
