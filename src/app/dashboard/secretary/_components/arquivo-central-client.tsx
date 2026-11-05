'use client';

import { useState, useEffect } from "react";
import { CentralArchiveTable } from "./central-archive-table";
import { programasEnsinoApi } from "@/services/programasEnsinoApi";
import type { ProgramaListItem } from "@/types/programaEnsino";
import Link from "next/link";
import { Eye, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableShell, TableContainer } from "@/components/table";
import { formatCursosVinculados } from "@/utils/courseUtils";
import { cn } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ArquivoCentralClient({ plans, query }: { plans: any[], query: string }) {
  const [docType, setDocType] = useState<'planos' | 'programas'>('planos');
  const [programas, setProgramas] = useState<ProgramaListItem[]>([]);
  const [searchProgramas, setSearchProgramas] = useState('');
  const [loadingProgramas, setLoadingProgramas] = useState(false);

  useEffect(() => {
    if (docType === 'programas') {
      setLoadingProgramas(true);
      programasEnsinoApi.list({ status: 'archived' })
        .then(res => setProgramas(res.data))
        .catch(console.error)
        .finally(() => setLoadingProgramas(false));
    }
  }, [docType]);

  const filteredProgramas = programas.filter(p => {
    if (!searchProgramas) return true;
    const term = searchProgramas.toLowerCase();
    return (
      p.nome_disciplina?.toLowerCase().includes(term) ||
      p.codigo_disciplina?.toLowerCase().includes(term) ||
      (p.cursos_vinculados && JSON.stringify(p.cursos_vinculados).toLowerCase().includes(term))
    );
  });

  return (
    <>
      <div className="flex gap-1 p-1 bg-slate-100 rounded-lg mb-4 w-fit border border-slate-200/60">
        <button
          onClick={() => setDocType('planos')}
          className={cn(
            "px-4 py-1.5 text-xs sm:text-sm font-bold rounded-md transition-all duration-150",
            docType === 'planos'
              ? 'bg-white shadow-xs text-[#023E8A]'
              : 'text-slate-600 hover:text-slate-900'
          )}
        >
          Planos de Ensino
        </button>
        <button
          onClick={() => setDocType('programas')}
          className={cn(
            "px-4 py-1.5 text-xs sm:text-sm font-bold rounded-md transition-all duration-150",
            docType === 'programas'
              ? 'bg-white shadow-xs text-[#023E8A]'
              : 'text-slate-600 hover:text-slate-900'
          )}
        >
          Programas de Ensino
        </button>
      </div>

      {docType === 'planos' && (
        <CentralArchiveTable plans={plans} initialQuery={query} />
      )}

      {docType === 'programas' && (
        <TableShell>
          <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <span className="text-xs sm:text-sm text-slate-500 font-bold">
              {loadingProgramas ? "Carregando programas..." : `${filteredProgramas.length} programas arquivados`}
            </span>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar programa arquivado..."
                value={searchProgramas}
                onChange={(e) => setSearchProgramas(e.target.value)}
                className="w-full pl-8 pr-8 py-1.5 bg-slate-50/50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#023E8A] focus:border-transparent transition-all"
              />
              {searchProgramas && (
                <button
                  onClick={() => setSearchProgramas("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          <TableContainer>
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Disciplina</th>
                  <th className="py-3 px-4">Cursos Vinculados</th>
                  <th className="py-3 px-4">Arquivado em</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProgramas.map(prog => (
                  <tr key={prog.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{prog.nome_disciplina}</div>
                      <div className="text-xs font-mono font-bold text-slate-400 mt-0.5">{prog.codigo_disciplina}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-xs sm:text-sm">
                      {formatCursosVinculados(prog.cursos_vinculados)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-sm">
                      {prog.arquivadoEm ? new Date(prog.arquivadoEm).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/dashboard/programas-ensino/${prog.id}/visualizar`}>
                          <Button variant="outline" size="sm" className="gap-1.5 font-bold text-xs h-8">
                            <Eye className="w-3.5 h-3.5" /> Visualizar
                          </Button>
                        </Link>
                        <Link href={`/api/programas/${prog.id}/pdf`} target="_blank">
                          <Button variant="outline" size="sm" className="gap-1.5 font-bold text-xs h-8">
                            <Download className="w-3.5 h-3.5" /> Baixar PDF
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProgramas.length === 0 && !loadingProgramas && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-500 text-sm font-normal">
                      Nenhum programa arquivado encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </TableContainer>
        </TableShell>
      )}
    </>
  );
}
