import type { HandwritingConfig } from '../types';

/**
 * 3-layer handwriting variation engine.
 * 
 * Layer 1: Real handwriting font (handled by font system)
 * Layer 2: Natural variation (this engine)
 * Layer 3: Notebook presentation (handled by background system)
 * 
 * This engine generates CSS transform properties for characters, words, and lines
 * to create subtle natural handwriting variation. Mathematical formulas are NOT
 * distorted — only surrounding text.
 */

// Seeded pseudo-random number generator for deterministic variation per position
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

export interface HandwritingVariation {
  transform: string;
  letterSpacing: string;
  marginLeft: string;
  marginTop: string;
  opacity: number;
}

/**
 * Generate CSS variation for a line of text at a given position.
 * Uses line index + character index as seed for deterministic output.
 */
export function getLineVariation(
  config: HandwritingConfig,
  lineIndex: number
): HandwritingVariation {
  if (config.naturalness === 0) {
    return {
      transform: 'none',
      letterSpacing: '0px',
      marginLeft: '0px',
      marginTop: '0px',
      opacity: 1,
    };
  }

  const seed = lineIndex * 137;
  const n = config.naturalness / 100;

  // Baseline jitter: ±px
  const baselineJitter = (seededRandom(seed) - 0.5) * config.baselineVariation * 2;

  // Slight rotation: ±degrees
  const rotation = (seededRandom(seed + 1) - 0.5) * config.characterRotation * 0.5;

  // Horizontal offset: ±px
  const xOffset = (seededRandom(seed + 2) - 0.5) * config.positionVariation * 2;

  // Letter spacing variation
  const letterSpacingVar = (seededRandom(seed + 3) - 0.5) * config.spacingVariation;

  // Very subtle opacity variation (simulates ink pressure)
  const opacityVar = 1 - (seededRandom(seed + 4) * 0.05 * n);

  return {
    transform: `translateY(${baselineJitter}px) rotate(${rotation}deg)`,
    letterSpacing: `${letterSpacingVar}px`,
    marginLeft: `${xOffset}px`,
    marginTop: `${baselineJitter * 0.5}px`,
    opacity: Math.max(0.88, opacityVar),
  };
}

/**
 * Generate CSS variation for a word at a given position.
 */
export function getWordVariation(
  config: HandwritingConfig,
  lineIndex: number,
  wordIndex: number
): React.CSSProperties {
  if (config.naturalness === 0) return {};

  const seed = lineIndex * 137 + wordIndex * 43;
  const n = config.naturalness / 100;

  const yOffset = (seededRandom(seed) - 0.5) * config.baselineVariation * 1.2;
  const rotation = (seededRandom(seed + 1) - 0.5) * config.characterRotation * 0.3;
  const xOffset = (seededRandom(seed + 2) - 0.5) * config.positionVariation * 0.8;
  const spacingVar = (seededRandom(seed + 3) - 0.5) * config.spacingVariation * 0.5;

  return {
    display: 'inline-block',
    transform: `translateY(${yOffset}px) rotate(${rotation}deg) translateX(${xOffset}px)`,
    marginRight: `${2 + spacingVar}px`,
  };
}

/**
 * Generate CSS style for paragraph-level variation (indent, top offset).
 */
export function getParagraphVariation(
  config: HandwritingConfig,
  paragraphIndex: number
): React.CSSProperties {
  if (config.naturalness === 0) return {};

  const seed = paragraphIndex * 97;
  const n = config.naturalness / 100;

  const indentVar = (seededRandom(seed) - 0.5) * 3 * n;
  const topVar = (seededRandom(seed + 1) - 0.5) * 2 * n;

  return {
    marginLeft: `${indentVar}px`,
    marginTop: `${topVar}px`,
  };
}

/**
 * Get the resolved ink color CSS value.
 */
export function getInkColor(config: HandwritingConfig): string {
  switch (config.inkColor) {
    case 'blue': return '#1a3a8a';
    case 'black': return '#1a1a1a';
    case 'dark_blue': return '#0d2357';
    case 'custom': return config.customInkColor;
    default: return '#1a3a8a';
  }
}

/**
 * Get pen thickness as CSS font-weight-like value.
 */
export function getPenThicknessStyle(config: HandwritingConfig): React.CSSProperties {
  switch (config.penThickness) {
    case 'thin':
      return { fontWeight: 300 };
    case 'normal':
      return { fontWeight: 400 };
    case 'medium':
      return { fontWeight: 600 };
    default:
      return { fontWeight: 400 };
  }
}

/**
 * Get bullet character for the selected style.
 */
export function getBulletChar(style: string): string {
  switch (style) {
    case 'dot': return '•';
    case 'circle': return '○';
    case 'arrow': return '→';
    case 'check': return '✓';
    case 'dash': return '–';
    default: return '•';
  }
}
