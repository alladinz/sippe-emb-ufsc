import React from "react";
import { View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { parseHtmlToRichBlocks, type PdfTextRun } from "./pdfHelpers";
import { splitTextWithLatex, getLatexCacheKey } from "@/lib/latex/mathjax";
import type { LatexPdfImage } from "@/lib/latex/pdfLatexRenderer";

const styles = StyleSheet.create({
  paragraph: {
    fontSize: 10,
    lineHeight: 1.4,
    textAlign: "justify",
    marginBottom: 5,
    fontFamily: "Times-Roman",
  },
  heading: {
    fontSize: 10,
    lineHeight: 1.4,
    fontFamily: "Times-Bold",
    marginTop: 4,
    marginBottom: 4,
  },
  inlineFlowParagraph: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginBottom: 5,
  },
  inlineTextChunk: {
    fontSize: 10,
    lineHeight: 1.4,
  },
  listItemRow: {
    flexDirection: "row",
    marginBottom: 3,
    alignItems: "flex-start",
  },
  listMarker: {
    width: 24,
    fontSize: 10,
    lineHeight: 1.4,
    fontFamily: "Times-Roman",
  },
  listContentCol: {
    flex: 1,
  },
  listText: {
    fontSize: 10,
    lineHeight: 1.4,
    textAlign: "justify",
  },
  latexBlockWrapper: {
    alignItems: "center",
    marginVertical: 4,
  },
});

function getPdfFontFamily(bold: boolean, italic: boolean): string {
  if (bold && italic) return "Times-BoldItalic";
  if (bold) return "Times-Bold";
  if (italic) return "Times-Italic";
  return "Times-Roman";
}

interface InlineChunk {
  kind: "text" | "latex-inline" | "latex-block";
  text?: string;
  bold?: boolean;
  italic?: boolean;
  latex?: string;
}

function expandRunsWithLatex(runs: PdfTextRun[]): InlineChunk[] {
  const chunks: InlineChunk[] = [];
  for (const run of runs) {
    const segments = splitTextWithLatex(run.text);
    for (const seg of segments) {
      if (seg.type === "text") {
        chunks.push({
          kind: "text",
          text: seg.value,
          bold: run.bold,
          italic: run.italic,
        });
      } else if (seg.type === "latex-inline") {
        chunks.push({ kind: "latex-inline", latex: seg.value });
      } else {
        chunks.push({ kind: "latex-block", latex: seg.value });
      }
    }
  }
  return chunks;
}

type PdfTextStyle = (typeof styles)["paragraph" | "heading" | "listText"];

function renderPlainRuns(
  runs: PdfTextRun[],
  baseStyle: PdfTextStyle,
  keyPrefix: string
) {
  return (
    <Text style={baseStyle}>
      {runs.map((run, idx) => (
        <Text
          key={`${keyPrefix}-r-${idx}`}
          style={{ fontFamily: getPdfFontFamily(run.bold, run.italic) }}
        >
          {run.text}
        </Text>
      ))}
    </Text>
  );
}

function renderChunksWithLatex(
  chunks: InlineChunk[],
  baseTextStyle: PdfTextStyle,
  latexImages: Record<string, LatexPdfImage> | undefined,
  keyPrefix: string
) {
  // Split into sequences separated by latex-block
  const groups: Array<
    { type: "block"; latex: string } | { type: "inline"; items: InlineChunk[] }
  > = [];
  let currentInline: InlineChunk[] = [];

  for (const c of chunks) {
    if (c.kind === "latex-block" && c.latex) {
      if (currentInline.length > 0) {
        groups.push({ type: "inline", items: currentInline });
        currentInline = [];
      }
      groups.push({ type: "block", latex: c.latex });
    } else {
      currentInline.push(c);
    }
  }
  if (currentInline.length > 0) {
    groups.push({ type: "inline", items: currentInline });
  }

  return groups.map((group, gIdx) => {
    if (group.type === "block") {
      const key = getLatexCacheKey(group.latex, true);
      const img = latexImages?.[key];
      if (img) {
        return (
          <View key={`${keyPrefix}-blk-${gIdx}`} style={styles.latexBlockWrapper}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image
              src={img.dataUrl}
              style={{ width: img.width, height: img.height }}
            />
          </View>
        );
      }
      return (
        <Text key={`${keyPrefix}-blk-${gIdx}`} style={baseTextStyle}>
          {group.latex}
        </Text>
      );
    }

    const hasInlineLatex = group.items.some((i) => i.kind === "latex-inline");
    if (!hasInlineLatex) {
      const runs: PdfTextRun[] = group.items.map((i) => ({
        text: i.text || "",
        bold: Boolean(i.bold),
        italic: Boolean(i.italic),
      }));
      return (
        <React.Fragment key={`${keyPrefix}-inl-${gIdx}`}>
          {renderPlainRuns(runs, baseTextStyle, `${keyPrefix}-inl-${gIdx}`)}
        </React.Fragment>
      );
    }

    // Inline math present: tokenize into word-level <Text> + <Image> inside flex-wrap row
    const flowNodes: React.ReactNode[] = [];
    group.items.forEach((item, iIdx) => {
      if (item.kind === "latex-inline" && item.latex) {
        const key = getLatexCacheKey(item.latex, false);
        const img = latexImages?.[key];
        if (img) {
          flowNodes.push(
            /* eslint-disable-next-line jsx-a11y/alt-text */
            <Image
              key={`${keyPrefix}-il-${gIdx}-${iIdx}`}
              src={img.dataUrl}
              style={{
                width: img.width,
                height: img.height,
                marginHorizontal: 2,
              }}
            />
          );
        } else {
          flowNodes.push(
            <Text
              key={`${keyPrefix}-ilfb-${gIdx}-${iIdx}`}
              style={styles.inlineTextChunk}
            >
              {`$${item.latex}$`}
            </Text>
          );
        }
      } else if (item.text) {
        const fontFamily = getPdfFontFamily(
          Boolean(item.bold),
          Boolean(item.italic)
        );
        const wordTokens = item.text.match(/\S+\s*|\s+/g) ?? [item.text];
        wordTokens.forEach((wt, wIdx) => {
          flowNodes.push(
            <Text
              key={`${keyPrefix}-w-${gIdx}-${iIdx}-${wIdx}`}
              style={[styles.inlineTextChunk, { fontFamily }]}
            >
              {wt}
            </Text>
          );
        });
      }
    });

    return (
      <View
        key={`${keyPrefix}-flow-${gIdx}`}
        style={styles.inlineFlowParagraph}
      >
        {flowNodes}
      </View>
    );
  });
}

interface PdfRichContentProps {
  content: unknown;
  fallbackText?: string;
  latexImages?: Record<string, LatexPdfImage>;
}

export function PdfRichContent({
  content,
  fallbackText = "Não informado.",
  latexImages,
}: PdfRichContentProps) {
  const blocks = parseHtmlToRichBlocks(content);

  if (blocks.length === 0) {
    return (
      <Text style={[styles.paragraph, { fontFamily: "Times-Italic" }]}>
        {fallbackText}
      </Text>
    );
  }

  return (
    <View>
      {blocks.map((block, bIdx) => {
        const hasAnyLatex = block.runs.some((r) => r.text.includes("$"));

        if (block.type === "list-item") {
          const safeMarker = block.marker === "◦" ? "-" : block.marker;
          const markerWidth = Math.max(18, safeMarker.length * 6 + 8);
          const indentLeft = 8 + block.depth * 14;

          return (
            <View
              key={`b-${bIdx}`}
              style={[styles.listItemRow, { marginLeft: indentLeft }]}
              wrap={false}
            >
              <Text style={[styles.listMarker, { width: markerWidth }]}>
                {safeMarker}
              </Text>
              <View style={styles.listContentCol}>
                {hasAnyLatex
                  ? renderChunksWithLatex(
                      expandRunsWithLatex(block.runs),
                      styles.listText,
                      latexImages,
                      `li-${bIdx}`
                    )
                  : renderPlainRuns(block.runs, styles.listText, `li-${bIdx}`)}
              </View>
            </View>
          );
        }

        const baseStyle = block.isHeading ? styles.heading : styles.paragraph;
        if (hasAnyLatex) {
          return (
            <View key={`b-${bIdx}`}>
              {renderChunksWithLatex(
                expandRunsWithLatex(block.runs),
                baseStyle,
                latexImages,
                `p-${bIdx}`
              )}
            </View>
          );
        }

        return (
          <React.Fragment key={`b-${bIdx}`}>
            {renderPlainRuns(block.runs, baseStyle, `p-${bIdx}`)}
          </React.Fragment>
        );
      })}
    </View>
  );
}
