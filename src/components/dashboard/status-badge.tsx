import React from "react";
import { cn } from "@/lib/utils";

export type DocumentStatus =
  | "draft"
  | "submitted"
  | "pending_review"
  | "pending_chefe"
  | "approved"
  | "rejected"
  | "archived"
  | string;

interface StatusConfig {
  label: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
}

const STATUS_MAP: Record<string, StatusConfig> = {
  draft: {
    label: "Rascunho",
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
  submitted: {
    label: "Aguardando Revisão",
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200/80",
    dot: "bg-amber-500",
  },
  pending_review: {
    label: "Em Revisão",
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-200/80",
    dot: "bg-blue-500",
  },
  pending_chefe: {
    label: "Aguardando Chefia",
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200/80",
    dot: "bg-amber-500",
  },
  approved: {
    label: "Aprovado",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200/80",
    dot: "bg-emerald-500",
  },
  rejected: {
    label: "Devolvido",
    bg: "bg-orange-50",
    text: "text-orange-800",
    border: "border-orange-200/80",
    dot: "bg-orange-500",
  },
  archived: {
    label: "Arquivado",
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
};

interface StatusBadgeProps {
  status: DocumentStatus;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = STATUS_MAP[status] || {
    label: status,
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-slate-400",
  };

  const displayLabel = label || config.label;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border transition-colors",
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      <span
        className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dot)}
        aria-hidden="true"
      />
      <span>{displayLabel}</span>
    </span>
  );
}
