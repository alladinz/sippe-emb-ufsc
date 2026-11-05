import type { ProgramaListItem } from '../../types/programaEnsino';
import { cn } from "@/lib/utils";

interface StatsBarProps {
  programas: ProgramaListItem[];
  total: number;
  isLoading?: boolean;
}

export function StatsBar({ programas, total, isLoading = false }: StatsBarProps) {
  const stats = [
    {
      label: 'Total',
      value: total,
      dot: 'bg-slate-400',
    },
    {
      label: 'Rascunho',
      value: programas.filter(p => p.status === 'draft').length,
      dot: 'bg-slate-400',
    },
    {
      label: 'Aguardando',
      value: programas.filter(p => p.status === 'submitted' || p.status === 'pending_chefe').length,
      dot: 'bg-amber-500',
    },
    {
      label: 'Aprovados',
      value: programas.filter(p => p.status === 'approved').length,
      dot: 'bg-emerald-500',
    },
    {
      label: 'Arquivados',
      value: programas.filter(p => p.status === 'archived').length,
      dot: 'bg-blue-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      {stats.map(stat => (
        <div
          key={stat.label}
          className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-xs flex items-center justify-between"
        >
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {stat.label}
            </p>
            {isLoading ? (
              <div className="h-6 w-8 bg-slate-200 animate-pulse rounded mt-1" />
            ) : (
              <p className="text-2xl font-bold text-[#102E52] mt-0.5 leading-none transition-opacity duration-200">
                {stat.value}
              </p>
            )}
          </div>
          <div
            className={cn("w-2.5 h-2.5 rounded-full shrink-0", stat.dot, isLoading && "opacity-40 animate-pulse")}
            aria-hidden="true"
          />
        </div>
      ))}
    </div>
  );
}
