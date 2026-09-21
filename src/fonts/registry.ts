import type { FontDefinition } from '../types';

/**
 * Handwriting font registry.
 * All fonts are Google Fonts with open licenses (OFL or Apache 2.0).
 * Ordered by recommendation for GATE technical notes.
 */
export const FONT_REGISTRY: FontDefinition[] = [
  {
    id: 'kalam',
    family: 'Kalam',
    displayName: 'Kalam',
    style: 'handwriting',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Kalam:wght@300;400;700&display=swap',
    isCustom: false,
    isRecommended: true,
    languages: ['en', 'hi'],
    spacingHints: { letterSpacing: 0.3, wordSpacing: 2, lineHeight: 1.9 },
  },
  {
    id: 'patrick-hand',
    family: 'Patrick Hand',
    displayName: 'Patrick Hand',
    style: 'handwriting',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap',
    isCustom: false,
    isRecommended: true,
    languages: ['en'],
    spacingHints: { letterSpacing: 0.5, wordSpacing: 2.5, lineHeight: 1.85 },
  },
  {
    id: 'caveat',
    family: 'Caveat',
    displayName: 'Caveat',
    style: 'handwriting',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&display=swap',
    isCustom: false,
    isRecommended: true,
    languages: ['en'],
    spacingHints: { letterSpacing: 0.4, wordSpacing: 3, lineHeight: 1.8 },
  },
  {
    id: 'indie-flower',
    family: 'Indie Flower',
    displayName: 'Indie Flower',
    style: 'handwriting',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Indie+Flower&display=swap',
    isCustom: false,
    isRecommended: false,
    languages: ['en'],
    spacingHints: { letterSpacing: 0.5, wordSpacing: 3, lineHeight: 2.0 },
  },
  {
    id: 'schoolbell',
    family: 'Schoolbell',
    displayName: 'Schoolbell',
    style: 'print',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Schoolbell&display=swap',
    isCustom: false,
    isRecommended: true,
    languages: ['en'],
    spacingHints: { letterSpacing: 0.3, wordSpacing: 2, lineHeight: 1.9 },
  },
  {
    id: 'handlee',
    family: 'Handlee',
    displayName: 'Handlee',
    style: 'casual',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Handlee&display=swap',
    isCustom: false,
    isRecommended: false,
    languages: ['en'],
    spacingHints: { letterSpacing: 0.4, wordSpacing: 2.5, lineHeight: 1.95 },
  },
  {
    id: 'shadows-into-light',
    family: 'Shadows Into Light',
    displayName: 'Shadows Into Light',
    style: 'handwriting',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Shadows+Into+Light&display=swap',
    isCustom: false,
    isRecommended: false,
    languages: ['en'],
    spacingHints: { letterSpacing: 0.6, wordSpacing: 3, lineHeight: 2.1 },
  },
  {
    id: 'architects-daughter',
    family: 'Architects Daughter',
    displayName: 'Architects Daughter',
    style: 'print',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Architects+Daughter&display=swap',
    isCustom: false,
    isRecommended: true,
    languages: ['en'],
    spacingHints: { letterSpacing: 0.3, wordSpacing: 2.5, lineHeight: 1.9 },
  },
  {
    id: 'coming-soon',
    family: 'Coming Soon',
    displayName: 'Coming Soon',
    style: 'casual',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Coming+Soon&display=swap',
    isCustom: false,
    isRecommended: false,
    languages: ['en'],
    spacingHints: { letterSpacing: 0.3, wordSpacing: 2, lineHeight: 1.85 },
  },
  {
    id: 'dancing-script',
    family: 'Dancing Script',
    displayName: 'Dancing Script',
    style: 'cursive',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;500;600;700&display=swap',
    isCustom: false,
    isRecommended: false,
    languages: ['en'],
    spacingHints: { letterSpacing: 0.2, wordSpacing: 2, lineHeight: 1.8 },
  },
  {
    id: 'reenie-beanie',
    family: 'Reenie Beanie',
    displayName: 'Reenie Beanie',
    style: 'handwriting',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Reenie+Beanie&display=swap',
    isCustom: false,
    isRecommended: false,
    languages: ['en'],
    spacingHints: { letterSpacing: 0.5, wordSpacing: 3, lineHeight: 2.0 },
  },
  {
    id: 'gloria-hallelujah',
    family: 'Gloria Hallelujah',
    displayName: 'Gloria Hallelujah',
    style: 'handwriting',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Gloria+Hallelujah&display=swap',
    isCustom: false,
    isRecommended: false,
    languages: ['en'],
    spacingHints: { letterSpacing: 0.4, wordSpacing: 2.5, lineHeight: 2.0 },
  },
];

/**
 * Get all registered fonts including user-uploaded custom fonts.
 */
export function getAllFonts(): FontDefinition[] {
  const customFonts = getCustomFonts();
  return [...FONT_REGISTRY, ...customFonts];
}

/**
 * Get fonts recommended for GATE notes.
 */
export function getRecommendedFonts(): FontDefinition[] {
  return FONT_REGISTRY.filter((f) => f.isRecommended);
}

/**
 * Find a font by family name.
 */
export function findFont(family: string): FontDefinition | undefined {
  return getAllFonts().find((f) => f.family === family);
}

/**
 * Get custom fonts from localStorage.
 */
function getCustomFonts(): FontDefinition[] {
  try {
    const stored = localStorage.getItem('gate_notes_custom_fonts');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Add a custom font.
 */
export function addCustomFont(font: FontDefinition): void {
  const customs = getCustomFonts();
  customs.push(font);
  localStorage.setItem('gate_notes_custom_fonts', JSON.stringify(customs));
}

/**
 * Remove a custom font.
 */
export function removeCustomFont(id: string): void {
  const customs = getCustomFonts().filter((f) => f.id !== id);
  localStorage.setItem('gate_notes_custom_fonts', JSON.stringify(customs));
}
