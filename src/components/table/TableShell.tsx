"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type TableShellProps = React.HTMLAttributes<HTMLDivElement>;

export function TableShell({
  children,
  className,
  ...props
}: TableShellProps) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
