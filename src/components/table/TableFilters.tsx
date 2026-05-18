"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TableFiltersProps {
  children: React.ReactNode;
  isOpen: boolean;
  className?: string;
}

export function TableFilters({
  children,
  isOpen,
  className,
}: TableFiltersProps) {
  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "animate-in fade-in zoom-in-95 duration-200 border-t bg-slate-50/50 p-4",
        className
      )}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {children}
      </div>
    </div>
  );
}
