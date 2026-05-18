"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Table } from "@/components/ui/table";

interface TableContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  stickyHeader?: boolean;
  density?: 'compact' | 'default' | 'spacious';
}

export function TableContainer({
  children,
  className,
  stickyHeader = true,
  density = 'default',
  ...props
}: TableContainerProps) {
  return (
    <div
      className={cn(
        "relative w-full overflow-auto",
        className
      )}
      {...props}
    >
      <div 
        className={cn(
          "w-full",
          density === 'compact' && "[&_td]:py-2 [&_th]:py-2",
          density === 'default' && "[&_td]:py-4 [&_th]:py-3",
          density === 'spacious' && "[&_td]:py-6 [&_th]:py-4",
          stickyHeader && "[&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10 [&_thead]:bg-slate-50/90 [&_thead]:backdrop-blur-sm [&_thead]:shadow-sm"
        )}
      >
        {children}
      </div>
    </div>
  );
}
