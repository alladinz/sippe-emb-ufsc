import { describe, it, expect } from "vitest";
import { parseHtmlToRichBlocks, decodeHtmlEntities, normalizePlainTextToHtml } from "@/components/pdf/pdfHelpers";
import { latexToSvg, splitTextWithLatex, hasLatexSyntax, stripLatexDelimiters, getLatexCacheKey } from "@/lib/latex/mathjax";

describe("Rich HTML to PDF AST & LaTeX Engine", () => {
  it("should preserve bold, italic and bold+italic inline spans", () => {
    const html = "<p>Texto <strong>negrito</strong>, <em>itálico</em> e <strong><em>ambos</em></strong>.</p>";
    const blocks = parseHtmlToRichBlocks(html);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe("paragraph");
    if (blocks[0].type === "paragraph") {
      expect(blocks[0].runs).toEqual([
        { text: "Texto ", bold: false, italic: false },
        { text: "negrito", bold: true, italic: false },
        { text: ", ", bold: false, italic: false },
        { text: "itálico", bold: false, italic: true },
        { text: " e ", bold: false, italic: false },
        { text: "ambos", bold: true, italic: true },
        { text: ".", bold: false, italic: false },
      ]);
    }
  });

  it("should parse nested ordered and bullet lists from Tiptap HTML with 1 / 1.1 markers", () => {
    const html =
      "<ol><li><p>Unidade 1</p><ol><li><p>Subtópico <strong>A</strong></p></li></ol></li></ol><ul><li><p>Item bullet</p></li></ul>";
    const blocks = parseHtmlToRichBlocks(html);
    const listItems = blocks.filter((b) => b.type === "list-item");
    expect(listItems).toHaveLength(3);
    expect(listItems[0]).toMatchObject({ type: "list-item", marker: "1.", depth: 0 });
    expect(listItems[1]).toMatchObject({ type: "list-item", marker: "1.1.", depth: 1 });
    expect(listItems[2]).toMatchObject({ type: "list-item", marker: "•", depth: 0 });
  });

  it("should preserve multi-line plain text paragraphs and markdown **bold**", () => {
    const text = "Primeira linha com **destaque**.\n\nSegunda linha.";
    const blocks = parseHtmlToRichBlocks(text);
    expect(blocks).toHaveLength(2);
    if (blocks[0].type === "paragraph") {
      expect(blocks[0].runs).toEqual([
        { text: "Primeira linha com ", bold: false, italic: false },
        { text: "destaque", bold: true, italic: false },
        { text: ".", bold: false, italic: false },
      ]);
    }
  });

  it("should decode extended HTML entities safely", () => {
    expect(decodeHtmlEntities("Avalia&ccedil;&atilde;o &ndash; m&eacute;dia &ge; 6,0")).toBe(
      "Avaliação – média ≥ 6,0"
    );
  });

  it("should distinguish LaTeX vs plain formula and ignore currency '$'", () => {
    expect(hasLatexSyntax("MF = \\frac{P_1 + P_2}{2}")).toBe(true);
    expect(hasLatexSyntax("MF = 0,5*P1 + 0,5*P2")).toBe(false);
    expect(splitTextWithLatex("Taxa R$ 10,00 ou nota $P_1 + P_2$.")).toEqual([
      { type: "text", value: "Taxa R$ 10,00 ou nota " },
      { type: "latex-inline", value: "P_1 + P_2" },
      { type: "text", value: "." },
    ]);
  });

  it("should render LaTeX expression to standalone SVG synchronously via MathJax", () => {
    const rendered = latexToSvg("MF = \\frac{P_1 + P_2}{2}", true);
    expect(rendered).not.toBeNull();
    expect(rendered?.svg).toContain("<svg");
    expect(rendered?.svg).toContain("<path");
    expect(rendered?.svg).not.toContain("<use");
  });

  it("should normalize legacy plain text without duplicating existing HTML", () => {
    expect(normalizePlainTextToHtml("Critério 1\n\nCritério 2")).toBe(
      "<p>Critério 1</p><p>Critério 2</p>"
    );
    expect(normalizePlainTextToHtml("<p>Já em <strong>HTML</strong></p>")).toBe(
      "<p>Já em <strong>HTML</strong></p>"
    );
  });

  it("should handle escaped inequalities inside Tiptap HTML LaTeX blocks", () => {
    const blocks = parseHtmlToRichBlocks("<p>Aprovado se $MF &ge; 6{,}0$ ou $x &lt; 3$ na m&eacute;dia.</p>");
    const combined = blocks[0]?.runs.map((r) => r.text).join("") ?? "";
    const segments = splitTextWithLatex(combined);
    expect(segments.filter((s) => s.type === "latex-inline").map((s) => s.value)).toEqual([
      "MF ≥ 6{,}0",
      "x < 3",
    ]);
    const svg = latexToSvg("x < 3", false);
    expect(svg?.hasError).toBe(false);
    expect(getLatexCacheKey(stripLatexDelimiters("$$MF = P_1$$").latex, true)).toBe("D:MF = P_1");
    expect(getLatexCacheKey("x < 3", false)).toBe("I:x < 3");
  });
});
