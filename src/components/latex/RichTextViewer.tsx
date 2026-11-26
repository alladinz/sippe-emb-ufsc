import React from "react";
import { rawContentToHtml, decodeHtmlEntities } from "@/components/pdf/pdfHelpers";
import { latexToSvg, splitTextWithLatex } from "@/lib/latex/mathjax";
import { cn } from "@/lib/utils";

interface RichTextViewerProps {
  content: unknown;
  emptyText?: string;
  className?: string;
}

function injectLatexSvgsIntoHtml(html: string): string {
  if (!html.includes("$")) return html;

  const tokens = html.match(/<[^>]+>|[^<]+/g) ?? [];
  return tokens
    .map((token) => {
      if (token.startsWith("<")) return token;
      if (!token.includes("$")) return token;

      // Decode entities temporarily so MathJax handles e.g. $x < 5$ inside Tiptap HTML
      const decodedForLatex = decodeHtmlEntities(token);
      const segments = splitTextWithLatex(decodedForLatex);
      if (!segments.some((s) => s.type !== "text")) {
        return token;
      }

      return segments
        .map((seg) => {
          if (seg.type === "text") {
            return seg.value
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;");
          }

          const isDisplay = seg.type === "latex-block";
          const rendered = latexToSvg(seg.value, isDisplay);
          if (!rendered || rendered.hasError) {
            const rawDelim = isDisplay ? `$$${seg.value}$$` : `$${seg.value}$`;
            return rawDelim
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;");
          }

          if (isDisplay) {
            return `<span class="block my-2 text-center overflow-x-auto">${rendered.svg}</span>`;
          }
          return `<span class="inline-flex items-center align-middle mx-0.5">${rendered.svg}</span>`;
        })
        .join("");
    })
    .join("");
}

export function RichTextViewer({
  content,
  emptyText = "Não informado.",
  className,
}: RichTextViewerProps) {
  const html = rawContentToHtml(content);

  if (!html.trim()) {
    return (
      <p className={cn("text-xs leading-relaxed text-slate-500 italic", className)}>
        {emptyText}
      </p>
    );
  }

  const enrichedHtml = injectLatexSvgsIntoHtml(html);

  return (
    <div
      className={cn(
        "text-xs leading-relaxed text-justify text-slate-900 viewer-rich-content",
        className
      )}
      dangerouslySetInnerHTML={{ __html: enrichedHtml }}
    />
  );
}
