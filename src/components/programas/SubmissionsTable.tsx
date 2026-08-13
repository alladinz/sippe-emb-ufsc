"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText, Search } from "lucide-react";
import ReviewProgramaModal from "./ReviewProgramaModal";
import Link from "next/link";
import Swal from "sweetalert2";

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
    Swal.fire({
      icon: 'success',
      title: 'Sucesso!',
      text: 'O programa foi avaliado com sucesso.',
      confirmButtonColor: '#3b82f6',
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-slate-200 bg-white">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar disciplinas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-medium">Disciplina</th>
              <th className="px-6 py-4 font-medium">Curso Aprovador</th>
              <th className="px-6 py-4 font-medium">Submetido em</th>
              <th className="px-6 py-4 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <FileText className="h-10 w-10 text-slate-300 mb-3" />
                    <p className="text-base font-medium text-slate-900">Nenhuma submissão encontrada</p>
                    <p className="text-sm mt-1">Não há programas de ensino pendentes de revisão.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{item.nomeDisciplina}</div>
                    <div className="text-xs text-slate-500">{item.codigoDisciplina}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {item.cursoAprovacao || "-"}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {item.submetidoEm ? format(new Date(item.submetidoEm), "dd 'de' MMM, yyyy", { locale: ptBR }) : "-"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/programas-ensino/${item.id}/visualizar`}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Visualizar"
                        target="_blank"
                      >
                        <FileText className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleReview(item)}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                      >
                        Avaliar
                      </button>
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
