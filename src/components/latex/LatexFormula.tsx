import React from "react";
import {
  latexToSvg,
  stripLatexDelimiters,
  hasLatexSyntax,
} from "@/lib/latex/mathjax";
import { cn } from "@/lib/utils";

interface LatexFormulaProps {
  formula: string | null | undefined;
  display?: boolean;
  className?: string;
}

export function LatexFormula({
  formula,
  display = true,
  className,
}: LatexFormulaProps) {
  const raw = formula?.trim();
  if (!raw) return null;

  if (!hasLatexSyntax(raw)) {
    return (
      <span className={cn("font-mono text-sm font-bold tracking-wider", className)}>
        {raw}
      </span>
    );
  }

  const { latex } = stripLatexDelimiters(raw);
  const rendered = latexToSvg(latex, display);

  if (!rendered) {
    return (
      <span className={cn("font-mono text-sm text-slate-700", className)}>
        {raw}
      </span>
    );
  }

  if (rendered.hasError) {
    return (
      <div className={cn("space-y-1", className)}>
        <span className="font-mono text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
          Verifique a sintaxe LaTeX: {latex}
        </span>
      </div>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center max-w-full overflow-x-auto text-slate-900",
        className
      )}
      dangerouslySetInnerHTML={{ __html: rendered.svg }}
    />
  );
}
