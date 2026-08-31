'use client';

import { useState, useEffect } from "react";
import { CentralArchiveTable } from "./central-archive-table";
import { SearchFilter } from "./search-filter";
import { programasEnsinoApi } from "@/services/programasEnsinoApi";
import type { ProgramaListItem } from "@/types/programaEnsino";
import Link from "next/link";
import { Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ArquivoCentralClient({ plans, query }: { plans: any[], query: string }) {
  const [docType, setDocType] = useState<'planos' | 'programas'>('planos');
  const [programas, setProgramas] = useState<ProgramaListItem[]>([]);
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

  return (
    <>
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-4 w-fit">
        <button
          onClick={() => setDocType('planos')}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
            docType === 'planos' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Planos de Ensino
        </button>
        <button
          onClick={() => setDocType('programas')}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
            docType === 'programas' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Programas de Ensino
        </button>
      </div>

      {docType === 'planos' && (
        <>
          <div className="flex justify-between items-center bg-white p-4 border rounded-xl shadow-sm mb-4">
            <SearchFilter />
            <div className="text-sm text-slate-500 font-medium">
                {plans.length} planos no arquivo
            </div>
          </div>
          <CentralArchiveTable plans={plans} initialQuery={query} />
        </>
      )}

      {docType === 'programas' && (
        <div className="bg-white border rounded-xl shadow-sm p-4">
          <div className="text-sm text-slate-500 font-medium mb-4">
            {loadingProgramas ? "Carregando..." : `${programas.length} programas arquivados`}
          </div>
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-3 px-4 text-gray-500 font-medium">Disciplina</th>
                <th className="py-3 px-4 text-gray-500 font-medium">Cursos</th>
                <th className="py-3 px-4 text-gray-500 font-medium">Arquivado em</th>
                <th className="py-3 px-4 text-gray-500 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {programas.map(prog => (
                <tr key={prog.id} className="border-b border-gray-100 hover:bg-slate-50/50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-900">{prog.nome_disciplina}</div>
                    <div className="text-xs text-slate-500">{prog.codigo_disciplina}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {prog.cursos_vinculados?.join(', ') || '-'}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {prog.arquivadoEm ? new Date(prog.arquivadoEm).toLocaleDateString('pt-BR') : '-'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/dashboard/programas-ensino/${prog.id}/visualizar`}>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Eye className="w-4 h-4" /> Visualizar
                        </Button>
                      </Link>
                      <Link href={`/api/programas/${prog.id}/pdf`} target="_blank">
                        <Button variant="outline" size="sm" className="gap-2">
                          <Download className="w-4 h-4" /> Baixar PDF
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {programas.length === 0 && !loadingProgramas && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">
                    Nenhum programa arquivado encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
