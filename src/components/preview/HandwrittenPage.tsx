import React, { useMemo } from 'react';
import type { Block, PageContent, FontConfig, PageConfig, HandwritingConfig, DocumentMode } from '../../types';
import { generateBackground } from '../../backgrounds/registry';
import { renderLatexToHTML } from '../../engine/formula';
import { splitInlineMath, formatInlineMarkdown } from '../../engine/parser';
import {
  getLineVariation,
  getWordVariation,
  getParagraphVariation,
  getInkColor,
  getPenThicknessStyle,
  getBulletChar,
} from '../../engine/handwriting';

interface HandwrittenPageProps {
  page: PageContent;
  font: FontConfig;
  pageConfig: PageConfig;
  handwriting: HandwritingConfig;
  mode: DocumentMode;
  totalPages: number;
  pageRef?: React.Ref<HTMLDivElement>;
  formulaSheetColumns?: number;
}

const CALLOUT_STYLES: Record<string, { bg: string; border: string; icon: string; label: string }> = {
  remember: { bg: 'rgba(59, 130, 246, 0.08)', border: '#3b82f6', icon: '💡', label: 'Remember' },
  important: { bg: 'rgba(239, 68, 68, 0.08)', border: '#ef4444', icon: '⚠️', label: 'Important' },
  shortcut: { bg: 'rgba(16, 185, 129, 0.08)', border: '#10b981', icon: '⚡', label: 'Shortcut' },
  warning: { bg: 'rgba(245, 158, 11, 0.08)', border: '#f59e0b', icon: '⚠️', label: 'Warning' },
  common_mistake: { bg: 'rgba(239, 68, 68, 0.06)', border: '#dc2626', icon: '❌', label: 'Common Mistake' },
  gate_trick: { bg: 'rgba(139, 92, 246, 0.08)', border: '#8b5cf6', icon: '🎯', label: 'GATE Trick' },
  definition: { bg: 'rgba(20, 184, 166, 0.08)', border: '#14b8a6', icon: '📖', label: 'Definition' },
  formula_note: { bg: 'rgba(99, 102, 241, 0.08)', border: '#6366f1', icon: '🔢', label: 'Formula' },
  example: { bg: 'rgba(245, 158, 11, 0.06)', border: '#d97706', icon: '📝', label: 'Example' },
};

/**
 * Renders a single handwritten notebook page.
 * This is the core rendering component — the same output is used for preview AND export.
 */
const HandwrittenPage: React.FC<HandwrittenPageProps> = ({
  page,
  font,
  pageConfig,
  handwriting,
  mode,
  totalPages,
  pageRef,
  formulaSheetColumns = 1,
}) => {
  const inkColor = getInkColor(handwriting);
  const penStyle = getPenThicknessStyle(handwriting);
  const bgStyle = generateBackground(pageConfig.template, pageConfig.backgroundOpacity);

  const margins = pageConfig.margins;
  const marginTop = margins.top * 3.78;
  const marginBottom = margins.bottom * 3.78;
  const marginLeft = (margins.left + margins.binding) * 3.78;
  const marginRight = margins.right * 3.78;

  const pageStyle: React.CSSProperties = {
    width: `${pageConfig.dimensions.widthPx}px`,
    height: `${pageConfig.dimensions.heightPx}px`,
    position: 'relative',
    overflow: 'hidden',
    boxSizing: 'border-box',
    ...bgStyle,
    ...(pageConfig.template === 'custom' && pageConfig.customBackgroundUrl
      ? {
          backgroundImage: `url(${pageConfig.customBackgroundUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }
      : {}),
  };

  const contentStyle: React.CSSProperties = {
    position: 'absolute',
    top: `${marginTop}px`,
    left: `${marginLeft}px`,
    right: `${marginRight}px`,
    bottom: `${marginBottom}px`,
    fontFamily: `"${font.family}", cursive, sans-serif`,
    fontSize: `${font.size}px`,
    lineHeight: font.lineHeight,
    letterSpacing: `${font.letterSpacing}px`,
    wordSpacing: `${font.wordSpacing}px`,
    color: inkColor,
    ...penStyle,
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
  };

  let globalLineIndex = 0;

  const renderInlineContent = (text: string) => {
    const segments = splitInlineMath(text);
    return segments.map((seg, idx) => {
      if (seg.type === 'math') {
        return (
          <span
            key={idx}
            className="inline-math"
            dangerouslySetInnerHTML={{ __html: renderLatexToHTML(seg.content, false) }}
            style={{ verticalAlign: 'middle' }}
          />
        );
      }
      return (
        <span
          key={idx}
          dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(seg.content) }}
        />
      );
    });
  };

  const renderHandwrittenText = (text: string, lineIdx: number, extraStyle?: React.CSSProperties) => {
    const lines = text.split('\n');
    if (lines.length > 1) {
      return (
        <div style={extraStyle}>
          {lines.map((l, subIdx) => {
            const variation = getLineVariation(handwriting, lineIdx + subIdx);
            return (
              <div
                key={subIdx}
                style={{
                  transform: variation.transform,
                  letterSpacing: variation.letterSpacing,
                  marginLeft: variation.marginLeft,
                  opacity: variation.opacity,
                  minHeight: `${font.size * font.lineHeight * 0.9}px`,
                }}
              >
                {renderInlineContent(l)}
              </div>
            );
          })}
        </div>
      );
    }
    const variation = getLineVariation(handwriting, lineIdx);
    return (
      <div
        style={{
          transform: variation.transform,
          letterSpacing: variation.letterSpacing,
          marginLeft: variation.marginLeft,
          opacity: variation.opacity,
          ...extraStyle,
        }}
      >
        {renderInlineContent(text)}
      </div>
    );
  };

  const renderBlock = (block: Block, blockIndex: number) => {
    const paraVar = getParagraphVariation(handwriting, blockIndex);

    switch (block.type) {
      case 'heading': {
        const scale = block.level === 1 ? 1.5 : block.level === 2 ? 1.3 : block.level === 3 ? 1.15 : 1.05;
        const lineIdx = globalLineIndex++;
        const variation = getLineVariation(handwriting, lineIdx);
        const isH1 = block.level === 1;
        const isH2 = block.level === 2;

        return (
          <div
            key={block.id}
            style={{
              fontSize: `${font.size * scale}px`,
              fontWeight: block.level && block.level <= 2 ? 600 : 500,
              marginBottom: isH1 ? '14px' : '10px',
              marginTop: blockIndex > 0 ? (isH1 ? '20px' : '14px') : '0',
              textDecoration: isH2 ? 'underline' : 'none',
              textDecorationColor: isH2 ? `${inkColor}80` : undefined,
              textUnderlineOffset: '4px',
              transform: variation.transform,
              letterSpacing: variation.letterSpacing,
              opacity: variation.opacity,
              borderBottom: isH1 ? `2px solid ${inkColor}30` : 'none',
              paddingBottom: isH1 ? '6px' : '0',
              ...paraVar,
            }}
          >
            {renderInlineContent(block.text || '')}
          </div>
        );
      }

      case 'paragraph': {
        const lineIdx = globalLineIndex++;
        return (
          <div
            key={block.id}
            style={{
              marginBottom: '10px',
              textIndent: `${handwriting.paragraphIndent}px`,
              ...paraVar,
            }}
          >
            {renderHandwrittenText(block.content || '', lineIdx)}
          </div>
        );
      }

      case 'formula': {
        globalLineIndex++;
        const formulaVariation = getLineVariation(handwriting, globalLineIndex);
        // Formula position has subtle variation but content is NOT distorted
        return (
          <div
            key={block.id}
            style={{
              margin: block.displayMode ? '16px 0' : '4px 0',
              textAlign: block.displayMode ? 'center' : 'left',
              transform: `translateY(${parseFloat(formulaVariation.marginTop) * 0.3}px)`,
              padding: block.displayMode ? '8px 0' : '0',
            }}
          >
            <span
              dangerouslySetInnerHTML={{
                __html: renderLatexToHTML(block.latex || '', block.displayMode !== false),
              }}
            />
          </div>
        );
      }

      case 'bullet': {
        const bulletChar = getBulletChar(handwriting.bulletStyle);
        return (
          <div key={block.id} style={{ marginBottom: '10px', ...paraVar }}>
            {(block.items || []).map((item, idx) => {
              const lineIdx = globalLineIndex++;
              const variation = getLineVariation(handwriting, lineIdx);
              return (
                <div
                  key={idx}
                  style={{
                    paddingLeft: '24px',
                    textIndent: '-20px',
                    marginBottom: '3px',
                    transform: variation.transform,
                    letterSpacing: variation.letterSpacing,
                    opacity: variation.opacity,
                  }}
                >
                  <span style={{ marginRight: '8px', display: 'inline-block' }}>
                    {bulletChar}
                  </span>
                  {renderInlineContent(item)}
                </div>
              );
            })}
          </div>
        );
      }

      case 'numbered': {
        return (
          <div key={block.id} style={{ marginBottom: '10px', ...paraVar }}>
            {(block.items || []).map((item, idx) => {
              const lineIdx = globalLineIndex++;
              const variation = getLineVariation(handwriting, lineIdx);
              return (
                <div
                  key={idx}
                  style={{
                    paddingLeft: '28px',
                    textIndent: '-24px',
                    marginBottom: '3px',
                    transform: variation.transform,
                    letterSpacing: variation.letterSpacing,
                    opacity: variation.opacity,
                  }}
                >
                  <span style={{ marginRight: '6px', display: 'inline-block', minWidth: '18px' }}>
                    {idx + 1}.
                  </span>
                  {renderInlineContent(item)}
                </div>
              );
            })}
          </div>
        );
      }

      case 'table': {
        globalLineIndex++;
        return (
          <div key={block.id} style={{ margin: '12px 0', overflowX: 'auto', ...paraVar }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontFamily: `"${font.family}", cursive, sans-serif`,
                fontSize: `${font.size * 0.9}px`,
              }}
            >
              {block.headers && (
                <thead>
                  <tr>
                    {block.headers.map((h, idx) => (
                      <th
                        key={idx}
                        style={{
                          borderBottom: `2px solid ${inkColor}40`,
                          padding: '6px 10px',
                          textAlign: 'left',
                          fontWeight: 600,
                        }}
                      >
                        {renderInlineContent(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {(block.rows || []).map((row, rIdx) => (
                  <tr key={rIdx}>
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        style={{
                          borderBottom: `1px solid ${inkColor}20`,
                          padding: '5px 10px',
                        }}
                      >
                        {renderInlineContent(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      case 'callout': {
        const style = CALLOUT_STYLES[block.calloutType || 'important'] || CALLOUT_STYLES.important;
        const lineIdx = globalLineIndex++;
        const variation = getLineVariation(handwriting, lineIdx);
        return (
          <div
            key={block.id}
            style={{
              margin: '12px 0',
              padding: '10px 14px',
              borderLeft: `3px solid ${style.border}`,
              backgroundColor: style.bg,
              borderRadius: '4px',
              ...paraVar,
            }}
          >
            <div
              style={{
                fontWeight: 600,
                marginBottom: '6px',
                fontSize: `${font.size * 1.05}px`,
                color: style.border,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transform: variation.transform,
              }}
            >
              <span>{style.icon}</span>
              <span>{block.calloutTitle || style.label}</span>
            </div>
            {block.children && block.children.length > 0 ? (
              <div className="callout-children">
                {block.children.map((childBlock, cIdx) => (
                  <div key={childBlock.id || cIdx}>
                    {renderBlock(childBlock, cIdx)}
                  </div>
                ))}
              </div>
            ) : (
              block.content && renderHandwrittenText(block.content, lineIdx)
            )}
          </div>
        );
      }

      case 'code': {
        globalLineIndex++;
        const codeVariation = getLineVariation(handwriting, globalLineIndex);
        return (
          <div
            key={block.id}
            style={{
              margin: '12px 0',
              padding: '12px 16px',
              backgroundColor: `${inkColor}06`,
              borderLeft: `3px solid ${inkColor}25`,
              borderRadius: '4px',
              transform: `translateY(${parseFloat(codeVariation.marginTop) * 0.2}px)`,
              ...paraVar,
            }}
          >
            <pre
              style={{
                margin: 0,
                padding: 0,
                fontFamily: '"Courier New", "Consolas", "Liberation Mono", monospace',
                fontSize: `${font.size * 0.82}px`,
                lineHeight: 1.5,
                color: inkColor,
                whiteSpace: 'pre',
                overflowX: 'auto',
                overflowY: 'hidden',
                tabSize: 4,
                letterSpacing: '0px',
                wordSpacing: '0px',
              }}
            >
              {block.content || ''}
            </pre>
          </div>
        );
      }

      case 'divider':
        return (
          <hr
            key={block.id}
            style={{
              border: 'none',
              borderTop: `1px solid ${inkColor}30`,
              margin: '14px 0',
            }}
          />
        );

      default:
        return null;
    }
  };

  const isFormulaSheet = mode === 'formula_sheet' && formulaSheetColumns > 1;

  return (
    <div ref={pageRef} className="handwritten-page" style={pageStyle} data-page={page.pageNumber}>
      <div style={contentStyle}>
        {isFormulaSheet ? (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${formulaSheetColumns}, 1fr)`, gap: '16px' }}>
            {page.blocks.map((block, idx) => (
              <div key={block.id}>{renderBlock(block, idx)}</div>
            ))}
          </div>
        ) : (
          page.blocks.map((block, idx) => renderBlock(block, idx))
        )}
      </div>

      {/* Page number */}
      <div
        style={{
          position: 'absolute',
          bottom: `${marginBottom * 0.3}px`,
          right: `${marginRight + 10}px`,
          fontSize: `${font.size * 0.7}px`,
          color: `${inkColor}60`,
          fontFamily: `"${font.family}", cursive, sans-serif`,
        }}
      >
        {page.pageNumber} / {totalPages}
      </div>
    </div>
  );
};

export default React.memo(HandwrittenPage);
