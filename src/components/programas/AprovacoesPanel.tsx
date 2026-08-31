'use client';

import React, { useEffect, useState } from 'react';
import { programasEnsinoApi } from '@/services/programasEnsinoApi';
import type { ProgramaAprovacao } from '@/types/programaEnsino';
import { Loader2 } from 'lucide-react';

interface AprovacoesPanelProps {
  programaId: string;
  status: string;
}

export function AprovacoesPanel({ programaId, status }: AprovacoesPanelProps) {
  const [aprovacoes, setAprovacoes] = useState<ProgramaAprovacao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (['submitted', 'approved', 'rejected', 'archived'].includes(status)) {
      setLoading(true);
      programasEnsinoApi.getAprovacoes(programaId)
        .then((data) => setAprovacoes(data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [programaId, status]);

  if (!['submitted', 'approved', 'rejected', 'archived'].includes(status) || (aprovacoes.length === 0 && !loading)) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      <span className="text-xs text-gray-500 font-medium self-center">
        Aprovações:
      </span>
      
      {loading ? (
        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
          <Loader2 className="w-3 h-3 animate-spin" /> Carregando...
        </span>
      ) : (
        aprovacoes.map(ap => {
          const colors =
            ap.status === 'approved'
              ? 'bg-green-50 text-green-700 border-green-200'
            : ap.status === 'rejected'
              ? 'bg-red-50 text-red-700 border-red-200'
            : 'bg-yellow-50 text-yellow-700 border-yellow-200';

          const icon =
            ap.status === 'approved' ? '✓'
            : ap.status === 'rejected' ? '✗'
            : '…';

          return (
            <span
              key={ap.curso}
              className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${colors}`}
              title={ap.feedback ?? ap.curso}
            >
              {icon} {ap.curso.replace('Engenharia ', 'Eng. ')}
            </span>
          );
        })
      )}
    </div>
  );
}
