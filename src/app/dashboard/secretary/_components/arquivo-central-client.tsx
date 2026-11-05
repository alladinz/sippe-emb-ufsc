'use client';

import { useState, useEffect, useMemo } from "react";
import { CentralArchiveTable } from "./central-archive-table";
import { programasEnsinoApi } from "@/services/programasEnsinoApi";
import type { ProgramaListItem } from "@/types/programaEnsino";
import Link from "next/link";
import { Eye, Download, FilterX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  TableShell,
  TableContainer,
  TableToolbar,
  TableFilters,
  TablePagination,
  TableEmptyState
} from "@/components/table";
import { formatCursoVinculado, formatCursosVinculados } from "@/utils/courseUtils";
import { cn } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ArquivoCentralClient({ plans, query }: { plans: any[], query: string }) {
  const [docType, setDocType] = useState<'planos' | 'programas'>('planos');
  const [programas, setProgramas] = useState<ProgramaListItem[]>([]);
  const [searchProgramas, setSearchProgramas] = useState('');
  const [selectedCurso, setSelectedCurso] = useState<string | null>(null);
  const [showProgramFilters, setShowProgramFilters] = useState(false);
  const [loadingProgramas, setLoadingProgramas] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  useEffect(() => {
    if (docType === 'programas') {
      setLoadingProgramas(true);
      programasEnsinoApi.list({ status: 'archived' })
        .then(res => setProgramas(res.data))
        .catch(console.error)
        .finally(() => setLoadingProgramas(false));
    }
  }, [docType]);

  const uniqueCursos = useMemo(() => {
    const set = new Set<string>();
    programas.forEach(p => {
      if (Array.isArray(p.cursos_vinculados)) {
        p.cursos_vinculados.forEach(c => {
          if (c && typeof c === 'string') {
            set.add(c.trim());
          }
        });
      }
    });
    return Array.from(set).sort();
  }, [programas]);

  const filteredProgramas = useMemo(() => {
    return programas.filter(p => {
      if (selectedCurso) {
        const matchesCurso = Array.isArray(p.cursos_vinculados) && p.cursos_vinculados.some(c =>
          c.toLowerCase() === selectedCurso.toLowerCase() ||
          formatCursoVinculado(c).toLowerCase() === formatCursoVinculado(selectedCurso).toLowerCase()
        );
        if (!matchesCurso) return false;
      }

      if (searchProgramas) {
        const term = searchProgramas.toLowerCase();
        const matchName = p.nome_disciplina?.toLowerCase().includes(term);
        const matchCode = p.codigo_disciplina?.toLowerCase().includes(term);
        const matchCursos = p.cursos_vinculados && JSON.stringify(p.cursos_vinculados).toLowerCase().includes(term);
        if (!matchName && !matchCode && !matchCursos) return false;
      }

      return true;
    });
  }, [programas, searchProgramas, selectedCurso]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchProgramas, selectedCurso]);

  const paginatedProgramas = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredProgramas.slice(start, start + limit);
  }, [filteredProgramas, page, limit]);

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
          <TableToolbar
            title="Arquivo Central"
            count={filteredProgramas.length}
            isLoading={loadingProgramas}
            searchValue={searchProgramas}
            onSearchChange={setSearchProgramas}
            onClearSearch={() => setSearchProgramas("")}
            searchPlaceholder="Buscar por disciplina, código ou curso vinculado..."
            showFilters={showProgramFilters}
            onToggleFilters={() => setShowProgramFilters(!showProgramFilters)}
            activeFiltersCount={selectedCurso ? 1 : 0}
          />

          <TableFilters isOpen={showProgramFilters} containerClassName="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
              <span className="text-xs text-slate-500 font-bold w-28 shrink-0 sm:pt-1.5">Curso Vinculado:</span>
              <div className="flex gap-2 flex-wrap items-center flex-1 max-h-28 overflow-y-auto pr-1">
                <button
                  type="button"
                  onClick={() => setSelectedCurso(null)}
                  className={cn(
                    "inline-flex items-center text-xs px-3 py-1 rounded-full border transition-all duration-150 cursor-pointer font-bold",
                    !selectedCurso
                      ? "bg-[#023E8A] text-white border-[#023E8A]"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  Todos os Cursos
                </button>
                {uniqueCursos.map(c => {
                  const isSelected = selectedCurso === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedCurso(isSelected ? null : c)}
                      className={cn(
                        "inline-flex items-center text-xs px-3 py-1 rounded-full border transition-all duration-150 cursor-pointer font-bold",
                        isSelected
                          ? "bg-[#023E8A] text-white border-[#023E8A]"
                          : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      )}
                    >
                      {formatCursoVinculado(c)}
                    </button>
                  );
                })}
              </div>
            </div>

            {(selectedCurso || searchProgramas) && (
              <div className="flex justify-end pt-1 border-t border-slate-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedCurso(null);
                    setSearchProgramas("");
                  }}
                  className="h-8 text-xs font-bold text-slate-500 hover:text-slate-900 gap-1.5"
                >
                  <FilterX className="w-3.5 h-3.5" />
                  Limpar Filtros
                </Button>
              </div>
            )}
          </TableFilters>

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
                {paginatedProgramas.map(prog => (
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
                    <td colSpan={4} className="p-0">
                      <TableEmptyState
                        title="Nenhum programa arquivado encontrado"
                        description="Tente ajustar a busca ou os filtros aplicados."
                        actionLabel={selectedCurso || searchProgramas ? "Limpar filtros" : undefined}
                        onAction={selectedCurso || searchProgramas ? () => { setSelectedCurso(null); setSearchProgramas(""); } : undefined}
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </TableContainer>

          {filteredProgramas.length > 0 && (
            <TablePagination
              page={page}
              limit={limit}
              total={filteredProgramas.length}
              onPageChange={setPage}
              onLimitChange={setLimit}
            />
          )}
        </TableShell>
      )}
    </>
  );
}
