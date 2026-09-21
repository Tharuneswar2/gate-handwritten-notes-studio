import type { PageTemplate } from '../types';

export interface BackgroundDefinition {
  id: PageTemplate;
  name: string;
  description: string;
  lineColor: string;
  lineSpacing: number; // px between ruled lines
  marginLineColor?: string;
  marginLineX?: number;
}

export const BACKGROUND_REGISTRY: BackgroundDefinition[] = [
  {
    id: 'white',
    name: 'White Paper',
    description: 'Clean white paper',
    lineColor: 'transparent',
    lineSpacing: 0,
  },
  {
    id: 'blue_ruled',
    name: 'Blue Ruled',
    description: 'Classic blue ruled notebook',
    lineColor: '#a8c8e8',
    lineSpacing: 32,
    marginLineColor: '#e8a8a8',
    marginLineX: 80,
  },
  {
    id: 'light_ruled',
    name: 'Light Ruled',
    description: 'Light gray ruled paper',
    lineColor: '#d8d8d8',
    lineSpacing: 32,
  },
  {
    id: 'graph',
    name: 'Graph Paper',
    description: '5mm graph paper grid',
    lineColor: '#c8dce8',
    lineSpacing: 19, // ~5mm at 96dpi
  },
  {
    id: 'engineering_graph',
    name: 'Engineering Graph',
    description: 'Engineering graph with major/minor grid',
    lineColor: '#d0e4d0',
    lineSpacing: 19,
  },
  {
    id: 'dot_grid',
    name: 'Dot Grid',
    description: 'Dot grid paper',
    lineColor: '#b8b8b8',
    lineSpacing: 24,
  },
  {
    id: 'blank_notebook',
    name: 'Blank Notebook',
    description: 'Slightly off-white notebook paper',
    lineColor: 'transparent',
    lineSpacing: 0,
  },
  {
    id: 'exam_rough',
    name: 'Exam Rough Work',
    description: 'Exam-style rough work paper',
    lineColor: '#e0e0e0',
    lineSpacing: 28,
    marginLineColor: '#d0b0b0',
    marginLineX: 60,
  },
  {
    id: 'formula_revision',
    name: 'Formula Revision',
    description: 'Clean revision paper with sections',
    lineColor: '#e8e8f0',
    lineSpacing: 28,
  },
];

/**
 * Generate CSS background for a page template.
 * Returns a CSS background string to be applied to the page div.
 */
export function generateBackground(
  template: PageTemplate,
  opacity: number = 1
): React.CSSProperties {
  const bg = BACKGROUND_REGISTRY.find((b) => b.id === template);
  if (!bg) return { backgroundColor: '#fff' };

  const o = opacity;

  switch (template) {
    case 'white':
      return { backgroundColor: '#ffffff' };

    case 'blue_ruled':
      return {
        backgroundColor: `rgba(253, 251, 247, ${o})`,
        backgroundImage: [
          // Horizontal ruled lines
          `repeating-linear-gradient(
            to bottom,
            transparent,
            transparent ${bg.lineSpacing - 1}px,
            rgba(168, 200, 232, ${0.6 * o}) ${bg.lineSpacing - 1}px,
            rgba(168, 200, 232, ${0.6 * o}) ${bg.lineSpacing}px
          )`,
          // Red margin line
          `linear-gradient(
            to right,
            transparent ${bg.marginLineX! - 1}px,
            rgba(232, 168, 168, ${0.5 * o}) ${bg.marginLineX! - 1}px,
            rgba(232, 168, 168, ${0.5 * o}) ${bg.marginLineX!}px,
            transparent ${bg.marginLineX!}px
          )`,
        ].join(', '),
      };

    case 'light_ruled':
      return {
        backgroundColor: `rgba(255, 255, 255, ${o})`,
        backgroundImage: `repeating-linear-gradient(
          to bottom,
          transparent,
          transparent ${bg.lineSpacing - 1}px,
          rgba(216, 216, 216, ${0.5 * o}) ${bg.lineSpacing - 1}px,
          rgba(216, 216, 216, ${0.5 * o}) ${bg.lineSpacing}px
        )`,
      };

    case 'graph':
      return {
        backgroundColor: `rgba(255, 255, 255, ${o})`,
        backgroundImage: [
          `linear-gradient(rgba(200, 220, 232, ${0.4 * o}) 1px, transparent 1px)`,
          `linear-gradient(90deg, rgba(200, 220, 232, ${0.4 * o}) 1px, transparent 1px)`,
        ].join(', '),
        backgroundSize: `${bg.lineSpacing}px ${bg.lineSpacing}px`,
      };

    case 'engineering_graph':
      return {
        backgroundColor: `rgba(255, 255, 255, ${o})`,
        backgroundImage: [
          // Minor grid
          `linear-gradient(rgba(208, 228, 208, ${0.3 * o}) 1px, transparent 1px)`,
          `linear-gradient(90deg, rgba(208, 228, 208, ${0.3 * o}) 1px, transparent 1px)`,
          // Major grid (every 5 lines)
          `linear-gradient(rgba(180, 210, 180, ${0.5 * o}) 1px, transparent 1px)`,
          `linear-gradient(90deg, rgba(180, 210, 180, ${0.5 * o}) 1px, transparent 1px)`,
        ].join(', '),
        backgroundSize: `${bg.lineSpacing}px ${bg.lineSpacing}px, ${bg.lineSpacing}px ${bg.lineSpacing}px, ${bg.lineSpacing * 5}px ${bg.lineSpacing * 5}px, ${bg.lineSpacing * 5}px ${bg.lineSpacing * 5}px`,
      };

    case 'dot_grid':
      return {
        backgroundColor: `rgba(255, 255, 255, ${o})`,
        backgroundImage: `radial-gradient(circle, rgba(184, 184, 184, ${0.5 * o}) 1px, transparent 1px)`,
        backgroundSize: `${bg.lineSpacing}px ${bg.lineSpacing}px`,
      };

    case 'blank_notebook':
      return {
        backgroundColor: `rgba(252, 250, 245, ${o})`,
      };

    case 'exam_rough':
      return {
        backgroundColor: `rgba(255, 253, 248, ${o})`,
        backgroundImage: [
          `repeating-linear-gradient(
            to bottom,
            transparent,
            transparent ${bg.lineSpacing - 1}px,
            rgba(224, 224, 224, ${0.4 * o}) ${bg.lineSpacing - 1}px,
            rgba(224, 224, 224, ${0.4 * o}) ${bg.lineSpacing}px
          )`,
          `linear-gradient(
            to right,
            transparent ${bg.marginLineX! - 1}px,
            rgba(208, 176, 176, ${0.4 * o}) ${bg.marginLineX! - 1}px,
            rgba(208, 176, 176, ${0.4 * o}) ${bg.marginLineX!}px,
            transparent ${bg.marginLineX!}px
          )`,
        ].join(', '),
      };

    case 'formula_revision':
      return {
        backgroundColor: `rgba(248, 248, 252, ${o})`,
        backgroundImage: `repeating-linear-gradient(
          to bottom,
          transparent,
          transparent ${bg.lineSpacing - 1}px,
          rgba(232, 232, 240, ${0.4 * o}) ${bg.lineSpacing - 1}px,
          rgba(232, 232, 240, ${0.4 * o}) ${bg.lineSpacing}px
        )`,
      };

    default:
      return { backgroundColor: '#fff' };
  }
}

/**
 * Find background definition by template ID.
 */
export function findBackground(template: PageTemplate): BackgroundDefinition | undefined {
  return BACKGROUND_REGISTRY.find((b) => b.id === template);
}
