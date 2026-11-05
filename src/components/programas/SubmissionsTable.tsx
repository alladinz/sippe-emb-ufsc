"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText, Search, X } from "lucide-react";
import ReviewProgramaModal from "./ReviewProgramaModal";
import Link from "next/link";
import { toastSuccess } from "@/lib/swal";
import { Button } from "@/components/ui/button";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function SubmissionsTable({ initialData }: { initialData: any[] }) {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedProg, setSelectedProg] = useState<any>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filteredData = data.filter((item: any) => 
    item.nomeDisciplina?.toLowerCase().includes(search.toLowerCase()) ||
    item.codigoDisciplina?.toLowerCase().includes(search.toLowerCase()) ||
    item.cursoAprovacao?.toLowerCase().includes(search.toLowerCase())
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleReview = (prog: any) => {
    setSelectedProg(prog);
    setModalOpen(true);
  };

  const handleStatusChange = (id: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setData(prev => prev.filter((item: any) => item.id !== id));
    toastSuccess("O programa foi avaliado com sucesso.");
  };

  if (data.length === 0) {
    return (
      <div className="bg-white border border-dashed border-slate-200/90 rounded-xl p-8 text-center shadow-2xs">
        <div className="flex flex-col items-center justify-center">
          <FileText className="h-8 w-8 text-slate-300 mb-2.5" />
          <p className="text-base font-bold text-slate-800">Nenhum programa aguardando sua revisão no momento</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Todas as submissões de programas de ensino foram homologadas ou ainda não há novos envios para homologação.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-white">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por disciplina ou código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#023E8A] focus:border-transparent transition-all outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                title="Limpar busca"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs font-bold text-slate-600 uppercase tracking-wider bg-slate-50/75 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3.5">Disciplina</th>
              <th className="px-6 py-3.5">Curso Aprovador</th>
              <th className="px-6 py-3.5">Submetido em</th>
              <th className="px-6 py-3.5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <Search className="h-6 w-6 text-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-800">Nenhum programa encontrado para &quot;{search}&quot;</p>
                    <p className="text-xs text-slate-400 mt-0.5">Verifique o termo digitado ou limpe a busca.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{item.nomeDisciplina}</div>
                    <div className="text-xs font-mono font-bold text-slate-400 mt-0.5">{item.codigoDisciplina}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-sm">
                    {item.cursoAprovacao || "-"}
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-sm">
                    {item.submetidoEm ? format(new Date(item.submetidoEm), "dd 'de' MMM, yyyy", { locale: ptBR }) : "-"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/dashboard/programas-ensino/${item.id}/visualizar`}
                        className="p-1.5 text-slate-400 hover:text-[#023E8A] hover:bg-slate-100 rounded-lg transition-colors"
                        title="Visualizar documento"
                        target="_blank"
                      >
                        <FileText className="h-4 w-4" />
                        <span className="sr-only">Visualizar</span>
                      </Link>
                      <Button
                        onClick={() => handleReview(item)}
                        size="sm"
                        className="bg-[#023E8A] hover:bg-[#023E8A]/90 text-white font-bold h-8 text-xs"
                      >
                        Avaliar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && selectedProg && (
        <ReviewProgramaModal 
          isOpen={modalOpen} 
          onClose={() => setModalOpen(false)} 
          programa={selectedProg}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
