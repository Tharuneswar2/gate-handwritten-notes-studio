import { v4 as uuidv4 } from 'uuid';
import type { Block, BlockType, HeadingLevel, CalloutType } from '../types';

/**
 * Parses raw text (Markdown + LaTeX) into structured Block[].
 * Handles headings, bullets, numbered lists, formulas, tables, callouts, dividers, page breaks, code fences.
 */
export function parseRawText(raw: string): Block[] {
  if (!raw.trim()) return [];

  const lines = raw.split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
      i++;
      continue;
    }

    // Dividers
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      blocks.push({ id: uuidv4(), type: 'divider' });
      i++;
      continue;
    }

    // Page break marker
    if (trimmed.toLowerCase() === '<!-- pagebreak -->' || trimmed.toLowerCase() === '\\pagebreak' || trimmed.toLowerCase() === '[pagebreak]') {
      blocks.push({ id: uuidv4(), type: 'pagebreak' });
      i++;
      continue;
    }

    // Callout blocks (> [!TYPE])
    const calloutMatch = trimmed.match(/^>\s*\[!(REMEMBER|IMPORTANT|SHORTCUT|WARNING|COMMON[_ ]MISTAKE|GATE[_ ]TRICK|DEFINITION|FORMULA|EXAMPLE)\]\s*(.*)/i);
    if (calloutMatch) {
      const rawType = calloutMatch[1].toLowerCase().replace(/\s+/g, '_');
      const calloutType: CalloutType = rawType === 'formula' ? 'formula_note' : (rawType as CalloutType);
      const calloutTitle = calloutMatch[2]?.trim() || '';
      const contentLines: string[] = [];
      i++;
      while (i < lines.length) {
        const lTrim = lines[i].trim();
        // Stop if a new callout starts on this line
        if (lTrim.match(/^>\s*\[!(REMEMBER|IMPORTANT|SHORTCUT|WARNING|COMMON[_ ]MISTAKE|GATE[_ ]TRICK|DEFINITION|FORMULA|EXAMPLE)\]/i)) {
          break;
        }
        if (lTrim.startsWith('>')) {
          contentLines.push(lines[i].replace(/^\s*>\s?/, ''));
          i++;
        } else {
          // If a line does not start with '>', the callout block has ended
          break;
        }
      }
      const rawContent = contentLines.join('\n');
      const children = parseRawText(rawContent);
      blocks.push({
        id: uuidv4(),
        type: 'callout',
        calloutType: calloutType,
        calloutTitle: calloutTitle,
        content: rawContent,
        children: children.length > 0 ? children : undefined,
      });
      continue;
    }

    // Code block or table wrapped in code fence (```)
    if (trimmed.startsWith('```')) {
      i++;
      const codeLines: string[] = [];
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length && lines[i].trim().startsWith('```')) {
        i++; // skip closing ```
      }
      const tableLines = codeLines.filter((l) => l.trim().length > 0);
      if (tableLines.length >= 2 && tableLines.every((l) => l.trim().includes('|'))) {
        const parsed = parseTable(tableLines);
        if (parsed) {
          blocks.push(parsed);
          continue;
        }
      }
      blocks.push({
        id: uuidv4(),
        type: 'paragraph',
        content: codeLines.join('\n'),
      });
      continue;
    }

    // Display LaTeX block: \[ ... \] or $$ ... $$
    if (trimmed.startsWith('\\[') || trimmed.startsWith('$$')) {
      const endMarker = trimmed.startsWith('\\[') ? '\\]' : '$$';
      const startMarker = trimmed.startsWith('\\[') ? '\\[' : '$$';
      let latex = trimmed.slice(startMarker.length);
      i++;

      if (latex.endsWith(endMarker)) {
        // Single-line formula: $$ formula $$
        latex = latex.slice(0, -endMarker.length).trim();
      } else {
        // Multi-line formula
        while (i < lines.length) {
          const fl = lines[i].trim();
          if (fl.endsWith(endMarker) || fl === endMarker) {
            latex += '\n' + fl.replace(endMarker, '').trim();
            i++;
            break;
          }
          latex += '\n' + fl;
          i++;
        }
      }
      blocks.push({
        id: uuidv4(),
        type: 'formula',
        latex: latex.trim(),
        displayMode: true,
      });
      continue;
    }

    // Heading: # ## ### ####
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        id: uuidv4(),
        type: 'heading',
        text: headingMatch[2],
        level: headingMatch[1].length as HeadingLevel,
      });
      i++;
      continue;
    }

    // Table: lines with | separators
    if (trimmed.includes('|') && trimmed.startsWith('|')) {
      const tableLines: string[] = [trimmed];
      i++;
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      const parsed = parseTable(tableLines);
      if (parsed) {
        blocks.push(parsed);
      }
      continue;
    }

    // Bullet list: - or *
    if (trimmed.match(/^[-*]\s+/)) {
      const items: string[] = [];
      while (i < lines.length) {
        const lTrim = lines[i].trim();
        if (lTrim.match(/^[-*]\s+/)) {
          items.push(lTrim.replace(/^[-*]\s+/, ''));
          i++;
        } else if (items.length > 0 && lines[i].match(/^\s{2,}/) && lTrim) {
          items[items.length - 1] += '\n' + lTrim;
          i++;
        } else {
          break;
        }
      }
      blocks.push({ id: uuidv4(), type: 'bullet', items });
      continue;
    }

    // Numbered list: 1. 2. etc.
    if (trimmed.match(/^\d+\.\s+/)) {
      const items: string[] = [];
      while (i < lines.length) {
        const lTrim = lines[i].trim();
        if (lTrim.match(/^\d+\.\s+/)) {
          items.push(lTrim.replace(/^\d+\.\s+/, ''));
          i++;
        } else if (items.length > 0 && lines[i].match(/^\s{2,}/) && lTrim) {
          items[items.length - 1] += '\n' + lTrim;
          i++;
        } else {
          break;
        }
      }
      blocks.push({ id: uuidv4(), type: 'numbered', items });
      continue;
    }

    // Paragraph (collect consecutive non-special lines)
    {
      const paraLines: string[] = [];
      while (
        i < lines.length &&
        lines[i].trim() &&
        !lines[i].trim().startsWith('#') &&
        !lines[i].trim().match(/^[-*]\s+/) &&
        !lines[i].trim().match(/^\d+\.\s+/) &&
        !lines[i].trim().startsWith('\\[') &&
        !lines[i].trim().startsWith('$$') &&
        !lines[i].trim().startsWith('|') &&
        !lines[i].trim().startsWith('```') &&
        !lines[i].trim().match(/^>\s*\[!/) &&
        lines[i].trim() !== '---' &&
        lines[i].trim() !== '***' &&
        lines[i].trim() !== '___'
      ) {
        paraLines.push(lines[i]);
        i++;
      }

      let content = '';
      for (let p = 0; p < paraLines.length; p++) {
        const lineText = paraLines[p].trim();
        if (p === 0) {
          content = lineText;
        } else {
          const prevRaw = paraLines[p - 1];
          if (prevRaw.endsWith('  ') || prevRaw.trim().endsWith('\\\\')) {
            content += '\n' + lineText;
          } else {
            content += ' ' + lineText;
          }
        }
      }

      blocks.push({
        id: uuidv4(),
        type: 'paragraph',
        content,
      });
    }
  }

  return blocks;
}

function parseTable(lines: string[]): Block | null {
  if (lines.length < 2) return null;

  const parseLine = (l: string) => {
    let content = l.trim();
    if (content.startsWith('|')) content = content.slice(1);
    if (content.endsWith('|')) content = content.slice(0, -1);
    return content.split('|').map((c) => c.trim());
  };

  const headers = parseLine(lines[0]);

  // Skip separator line (---|---|---)
  let startRow = 1;
  if (lines[1] && lines[1].match(/^[\s|:-]+$/)) {
    startRow = 2;
  }

  const rows = lines.slice(startRow).map(parseLine);

  return {
    id: uuidv4(),
    type: 'table',
    headers,
    rows,
  };
}

/**
 * Detects inline LaTeX in text and splits into segments.
 * Returns array of { type: 'text' | 'math', content: string }
 */
export interface TextSegment {
  type: 'text' | 'math';
  content: string;
}

export function splitInlineMath(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  // Match \(...\) or $$...$$ or $...$
  const regex = /\\\(([\s\S]+?)\\\)|\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    const mathContent = match[1] || match[2] || match[3];
    segments.push({ type: 'math', content: mathContent });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }

  if (segments.length === 0 && text) {
    segments.push({ type: 'text', content: text });
  }

  return segments;
}

/**
 * Applies basic Markdown inline formatting to text.
 * Returns HTML string with <strong>, <em>, <u> tags.
 */
export function formatInlineMarkdown(text: string): string {
  let result = text;
  // Bold: **text** or __text__
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/__(.+?)__/g, '<strong>$1</strong>');
  // Italic: *text* or _text_
  result = result.replace(/\*(.+?)\*/g, '<em>$1</em>');
  result = result.replace(/\b_([^_]+?)_\b/g, '<em>$1</em>');
  // Underline: ~~text~~
  result = result.replace(/~~(.+?)~~/g, '<u>$1</u>');
  // Code: `text`
  result = result.replace(/`(.+?)`/g, '<code>$1</code>');
  return result;
}
