"use client";

import * as React from "react";
import { Inbox, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TableEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function TableEmptyState({
  icon = <Inbox className="h-12 w-12 text-slate-300" />,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: TableEmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-12 text-center", className)}>
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50">
        {icon}
      </div>
      <h3 className="mb-1 text-base font-bold text-slate-900">{title}</h3>
      {description && <p className="mb-6 max-w-sm text-sm font-normal text-slate-500">{description}</p>}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="gap-2 bg-brand-blue hover:bg-brand-blue/90 font-bold">
          <Plus className="h-4 w-4" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
