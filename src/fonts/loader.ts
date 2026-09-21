import { FONT_REGISTRY, getAllFonts } from './registry';
import type { FontDefinition } from '../types';

const loadedFonts = new Set<string>();

/**
 * Load a Google Font by injecting a <link> tag.
 */
export function loadGoogleFont(font: FontDefinition): Promise<void> {
  if (loadedFonts.has(font.id) || !font.googleFontsUrl) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = font.googleFontsUrl!;
    link.onload = () => {
      loadedFonts.add(font.id);
      resolve();
    };
    link.onerror = () => reject(new Error(`Failed to load font: ${font.displayName}`));
    document.head.appendChild(link);
  });
}

/**
 * Load all registered Google Fonts.
 */
export async function loadAllGoogleFonts(): Promise<void> {
  // Combine all font URLs into one request for efficiency
  const families = FONT_REGISTRY
    .filter((f) => f.googleFontsUrl)
    .map((f) => f.family.replace(/ /g, '+'))
    .join('&family=');

  if (!families) return;

  const url = `https://fonts.googleapis.com/css2?family=${families}&display=swap`;

  return new Promise((resolve) => {
    const existing = document.querySelector(`link[href*="fonts.googleapis.com"]`);
    if (existing) {
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.onload = () => {
      FONT_REGISTRY.forEach((f) => loadedFonts.add(f.id));
      resolve();
    };
    link.onerror = () => {
      console.warn('Failed to load Google Fonts, using system fallbacks');
      resolve();
    };
    document.head.appendChild(link);
  });
}

/**
 * Load a custom user font file via FontFace API.
 */
export async function loadCustomFontFile(
  file: File,
  fontFamily: string
): Promise<FontFace> {
  const buffer = await file.arrayBuffer();
  const fontFace = new FontFace(fontFamily, buffer);
  await fontFace.load();
  document.fonts.add(fontFace);
  loadedFonts.add(fontFamily);
  return fontFace;
}

/**
 * Check if a font is loaded and available.
 */
export function isFontLoaded(family: string): boolean {
  return document.fonts.check(`16px "${family}"`);
}
