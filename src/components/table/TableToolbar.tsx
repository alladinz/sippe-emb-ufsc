"use client";

import * as React from "react";
import { Search, X, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TableToolbarProps {
  title?: string;
  count?: number;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onClearSearch?: () => void;
  actions?: React.ReactNode;
  showFilters?: boolean;
  onToggleFilters?: () => void;
  className?: string;
}

export function TableToolbar({
  title,
  count,
  searchPlaceholder = "Buscar...",
  searchValue,
  onSearchChange,
  onClearSearch,
  actions,
  showFilters,
  onToggleFilters,
  className,
}: TableToolbarProps) {
  return (
    <div className={cn("flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between", className)}>
      <div className="flex items-center gap-4">
        {title && (
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
            {count !== undefined && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                {count}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-1 items-center gap-2 md:justify-end">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="h-9 pl-9 pr-8 transition-all focus-visible:ring-brand-blue"
          />
          {searchValue && (
            <button
              onClick={onClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {onToggleFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleFilters}
            className={cn("h-9 gap-2", showFilters && "bg-slate-100")}
          >
            <Filter className="h-4 w-4" />
            <span>Filtros</span>
          </Button>
        )}

        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
