"use client";

import {
  latexToSvg,
  stripLatexDelimiters,
  hasLatexSyntax,
  splitTextWithLatex,
  getLatexCacheKey,
} from "./mathjax";
import { parseHtmlToRichBlocks } from "@/components/pdf/pdfHelpers";

export interface LatexPdfImage {
  dataUrl: string;
  width: number; // points in PDF
  height: number; // points in PDF
}

const PT_PER_EX = 4.6; // matched to Times-Roman 10pt in PlanoPDF
const FORMULA_PT_PER_EX = 5.4; // slightly larger for centered formula box
const CANVAS_SCALE = 4; // 4x retina resolution (~288-400 DPI)
const MAX_PDF_CONTENT_WIDTH_PT = 470;

function buildSizedSvgDataUrl(
  svg: string,
  pxWidth: number,
  pxHeight: number
): string {
  const coloredSvg = svg
    .replace(/currentColor/g, "#000000")
    .replace(/<svg\b([^>]*)>/i, (_, attrs: string) => {
      const cleanedAttrs = attrs
        .replace(/\bwidth="[^"]*"/i, "")
        .replace(/\bheight="[^"]*"/i, "")
        .replace(/\bstyle="[^"]*"/i, "");
      return `<svg${cleanedAttrs} width="${pxWidth}" height="${pxHeight}" style="color:#000000;">`;
    });

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(coloredSvg)}`;
}

async function svgToPngDataUrl(
  svg: string,
  widthEx: number,
  heightEx: number,
  display: boolean,
  isFormulaBox: boolean = false
): Promise<LatexPdfImage | null> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return null;
  }

  const ptPerEx = isFormulaBox ? FORMULA_PT_PER_EX : PT_PER_EX;
  let widthPt = Math.max(8, widthEx * ptPerEx);
  let heightPt = Math.max(8, heightEx * ptPerEx);

  if (widthPt > MAX_PDF_CONTENT_WIDTH_PT) {
    const ratio = MAX_PDF_CONTENT_WIDTH_PT / widthPt;
    widthPt = MAX_PDF_CONTENT_WIDTH_PT;
    heightPt = heightPt * ratio;
  }

  const pxWidth = Math.ceil(widthPt * CANVAS_SCALE);
  const pxHeight = Math.ceil(heightPt * CANVAS_SCALE);

  const svgUrl = buildSizedSvgDataUrl(svg, pxWidth, pxHeight);

  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = pxWidth;
        canvas.height = pxHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.clearRect(0, 0, pxWidth, pxHeight);
        ctx.drawImage(img, 0, 0, pxWidth, pxHeight);
        const pngDataUrl = canvas.toDataURL("image/png");
        resolve({
          dataUrl: pngDataUrl,
          width: display ? widthPt : widthPt,
          height: heightPt,
        });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = svgUrl;
  });
}

export async function prepareLatexImagesForPdf(plan: {
  syllabus?: string | null;
  objectives?: string | null;
  programContent?: string | null;
  methodology?: string | null;
  evaluation?: string | null;
  evaluationFormula?: string | null;
  finalEvaluationRules?: string | null;
  finalConsiderations?: string | null;
}): Promise<Record<string, LatexPdfImage>> {
  const expressions = new Map<
    string,
    { latex: string; display: boolean; isFormulaBox: boolean }
  >();

  // 1. Dedicated evaluation formula box
  if (plan.evaluationFormula && hasLatexSyntax(plan.evaluationFormula)) {
    const { latex } = stripLatexDelimiters(plan.evaluationFormula);
    if (latex) {
      const key = getLatexCacheKey(latex, true);
      expressions.set(key, { latex, display: true, isFormulaBox: true });
    }
  }

  // 2. Inline and display LaTeX inside all rich fields
  const richFields = [
    plan.syllabus,
    plan.objectives,
    plan.programContent,
    plan.methodology,
    plan.evaluation,
    plan.finalEvaluationRules,
    plan.finalConsiderations,
  ];

  for (const field of richFields) {
    if (!field) continue;
    const blocks = parseHtmlToRichBlocks(field);
    for (const block of blocks) {
      const combinedText = block.runs.map((r) => r.text).join("");
      const segments = splitTextWithLatex(combinedText);
      for (const seg of segments) {
        if (seg.type === "latex-block") {
          const key = getLatexCacheKey(seg.value, true);
          if (!expressions.has(key)) {
            expressions.set(key, {
              latex: seg.value,
              display: true,
              isFormulaBox: false,
            });
          }
        } else if (seg.type === "latex-inline") {
          const key = getLatexCacheKey(seg.value, false);
          if (!expressions.has(key)) {
            expressions.set(key, {
              latex: seg.value,
              display: false,
              isFormulaBox: false,
            });
          }
        }
      }
    }
  }

  const results: Record<string, LatexPdfImage> = {};

  await Promise.all(
    Array.from(expressions.entries()).map(async ([key, item]) => {
      const rendered = latexToSvg(item.latex, item.display);
      if (!rendered || rendered.hasError) return;
      const png = await svgToPngDataUrl(
        rendered.svg,
        rendered.widthEx,
        rendered.heightEx,
        item.display,
        item.isFormulaBox
      );
      if (png) {
        results[key] = png;
      }
    })
  );

  return results;
}
