import type { ProgramaListItem } from '../../types/programaEnsino';

interface StatsBarProps {
  programas: ProgramaListItem[];
  total: number;
}

export function StatsBar({ programas, total }: StatsBarProps) {
  const stats = [
    {
      label: 'Total',
      value: total,
      colorClass: 'border-l-gray-400',
      textClass: 'text-gray-700',
    },
    {
      label: 'Rascunho',
      value: programas.filter(p => p.status === 'draft').length,
      colorClass: 'border-l-gray-400',
      textClass: 'text-gray-700',
    },
    {
      label: 'Aguardando',
      value: programas.filter(p => p.status === 'submitted').length,
      colorClass: 'border-l-yellow-400',
      textClass: 'text-yellow-700',
    },
    {
      label: 'Aprovados',
      value: programas.filter(p => p.status === 'approved').length,
      colorClass: 'border-l-green-500',
      textClass: 'text-green-700',
    },
    {
      label: 'Arquivados',
      value: programas.filter(p => p.status === 'archived').length,
      colorClass: 'border-l-blue-500',
      textClass: 'text-blue-700',
    },
  ];

  return (
    <div className="grid grid-cols-5 gap-3 mb-4">
      {stats.map(stat => (
        <div
          key={stat.label}
          className={`bg-white border border-gray-100 rounded-xl p-4 border-l-4 ${stat.colorClass} shadow-sm`}
        >
          <p className="text-xs text-gray-500 mb-1">
            {stat.label}
          </p>
          <p className={`text-2xl font-semibold ${stat.textClass}`}>
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
