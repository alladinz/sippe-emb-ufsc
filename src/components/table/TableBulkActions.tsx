"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TableBulkActionsProps {
  selectedCount: number;
  onClearSelection: () => void;
  actions: React.ReactNode;
  className?: string;
}

export function TableBulkActions({
  selectedCount,
  onClearSelection,
  actions,
  className,
}: TableBulkActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      className={cn(
        "flex animate-in fade-in slide-in-from-bottom-2 duration-200 items-center justify-between gap-4 rounded-lg bg-slate-900 px-4 py-2 text-slate-50 shadow-lg",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-full text-slate-400 hover:bg-slate-800 hover:text-slate-50"
          onClick={onClearSelection}
        >
          <X className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">
          {selectedCount} {selectedCount === 1 ? "item selecionado" : "itens selecionados"}
        </span>
      </div>
      <div className="flex items-center gap-2">{actions}</div>
    </div>
  );
}
