import "./mathjax-env";
import { mathjax } from "mathjax-full/js/mathjax.js";
import { TeX } from "mathjax-full/js/input/tex.js";
import { SVG } from "mathjax-full/js/output/svg.js";
import { liteAdaptor } from "mathjax-full/js/adaptors/liteAdaptor.js";
import { RegisterHTMLHandler } from "mathjax-full/js/handlers/html.js";
import { AllPackages } from "mathjax-full/js/input/tex/AllPackages.js";

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);

const texInput = new TeX({
  packages: AllPackages,
});

const svgOutput = new SVG({
  fontCache: "none",
});

const mathDocument = mathjax.document("", {
  InputJax: texInput,
  OutputJax: svgOutput,
});

export interface RenderedLatexSvg {
  svg: string;
  widthEx: number;
  heightEx: number;
  hasError: boolean;
}

export interface TextLatexSegment {
  type: "text" | "latex-inline" | "latex-block";
  value: string;
}

export function latexToSvg(
  latex: string,
  display: boolean = true
): RenderedLatexSvg | null {
  const cleaned = latex?.trim();
  if (!cleaned) return null;

  try {
    const node = mathDocument.convert(cleaned, { display });
    const rawHtml = adaptor.innerHTML(node);
    const svgMatch = rawHtml.match(/<svg[\s\S]*?<\/svg>/i);
    if (!svgMatch) return null;

    const svg = svgMatch[0];
    const widthMatch = svg.match(/\bwidth="([\d.]+)ex"/i);
    const heightMatch = svg.match(/\bheight="([\d.]+)ex"/i);
    const widthEx = widthMatch ? parseFloat(widthMatch[1]) : 4;
    const heightEx = heightMatch ? parseFloat(heightMatch[1]) : 1.5;
    const hasError = svg.includes('data-mml-node="merror"');

    return {
      svg,
      widthEx,
      heightEx,
      hasError,
    };
  } catch {
    return null;
  }
}

export function stripLatexDelimiters(input: string): {
  latex: string;
  display: boolean;
} {
  const trimmed = (input || "").trim();
  if (trimmed.startsWith("$$") && trimmed.endsWith("$$") && trimmed.length >= 4) {
    return { latex: trimmed.slice(2, -2).trim(), display: true };
  }
  if (trimmed.startsWith("$") && trimmed.endsWith("$") && trimmed.length >= 2) {
    return { latex: trimmed.slice(1, -1).trim(), display: false };
  }
  if (trimmed.startsWith("\\[") && trimmed.endsWith("\\]")) {
    return { latex: trimmed.slice(2, -2).trim(), display: true };
  }
  if (trimmed.startsWith("\\(") && trimmed.endsWith("\\)")) {
    return { latex: trimmed.slice(2, -2).trim(), display: false };
  }
  return { latex: trimmed, display: true };
}

export function splitTextWithLatex(text: string): TextLatexSegment[] {
  if (!text) return [];

  const segments: TextLatexSegment[] = [];
  let buffer = "";
  let i = 0;

  const flushText = () => {
    if (buffer) {
      segments.push({ type: "text", value: buffer });
      buffer = "";
    }
  };

  while (i < text.length) {
    // Skip escaped dollar sign \$
    if (text[i] === "\\" && text[i + 1] === "$") {
      buffer += "$";
      i += 2;
      continue;
    }

    // Block math: $$...$$
    if (text[i] === "$" && text[i + 1] === "$") {
      const endIdx = text.indexOf("$$", i + 2);
      if (endIdx !== -1) {
        const inner = text.slice(i + 2, endIdx).trim();
        if (inner) {
          flushText();
          segments.push({ type: "latex-block", value: inner });
          i = endIdx + 2;
          continue;
        }
      }
    }

    // Inline math: $...$ (avoid matching currency patterns like R$ 10,00)
    if (text[i] === "$") {
      const prevChar = i > 0 ? text[i - 1] : "";
      const nextChar = i + 1 < text.length ? text[i + 1] : "";

      if (prevChar !== "R" && nextChar !== "" && !/\s/.test(nextChar)) {
        let endIdx = -1;
        for (let j = i + 1; j < text.length; j++) {
          if (text[j] === "\n") break;
          if (text[j] === "$" && text[j - 1] !== "\\") {
            if (!/\s/.test(text[j - 1])) {
              endIdx = j;
            }
            break;
          }
        }

        if (endIdx !== -1) {
          const inner = text.slice(i + 1, endIdx).trim();
          if (inner) {
            flushText();
            segments.push({ type: "latex-inline", value: inner });
            i = endIdx + 1;
            continue;
          }
        }
      }
    }

    buffer += text[i];
    i++;
  }

  flushText();
  return segments;
}

export function hasLatexSyntax(text: string): boolean {
  if (!text || !text.trim()) return false;
  const trimmed = text.trim();

  if (
    (trimmed.startsWith("$$") && trimmed.endsWith("$$")) ||
    (trimmed.startsWith("$") && trimmed.endsWith("$")) ||
    trimmed.startsWith("\\[") ||
    trimmed.startsWith("\\(")
  ) {
    return true;
  }

  const segments = splitTextWithLatex(trimmed);
  if (segments.some((s) => s.type !== "text")) {
    return true;
  }

  // Commands like \frac, \sum, \sqrt, \alpha, \times, \cdot, etc.
  if (/\\[a-zA-Z]+/.test(trimmed)) return true;

  // Subscript or superscript math notation like P_1, P_{1}, x^2, (A+B)^{0.5}
  if (/[a-zA-Z0-9)\]}][_^][{a-zA-Z0-9\\-]/.test(trimmed)) return true;

  return false;
}

export function isComplexLatex(latex: string): boolean {
  return /\\(frac|dfrac|tfrac|sum|int|iint|prod|lim|sqrt|binom|begin|left|right|matrix|cases)\b/.test(
    latex
  );
}

export function getLatexCacheKey(latex: string, display: boolean): string {
  return `${display ? "D" : "I"}:${latex.trim()}`;
}
