"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle2, XCircle } from "lucide-react";
import { programasEnsinoApi } from "@/services/programasEnsinoApi";
import type { ProgramaAprovacao } from "@/types/programaEnsino";

interface ReviewProgramaModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  programa: any;
  onStatusChange: (id: string, status: string) => void;
}

export default function ReviewProgramaModal({ isOpen, onClose, programa, onStatusChange }: ReviewProgramaModalProps) {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [pendingAprovacoes, setPendingAprovacoes] = useState<ProgramaAprovacao[]>([]);
  const [selectedCurso, setSelectedCurso] = useState("");

  useEffect(() => {
    if (isOpen && programa?.id) {
      programasEnsinoApi.getAprovacoes(programa.id).then(rows => {
        setPendingAprovacoes(rows.filter(r => r.status === 'pending'));
      }).catch(console.error);
    }
  }, [isOpen, programa]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedCurso) {
      alert("Por favor, selecione o curso para o qual está aprovando.");
      return;
    }

    if (action === "reject" && !feedback.trim()) {
      alert("Por favor, forneça um feedback para a rejeição.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/programas/${programa.id}/revisar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          feedback: action === "reject" ? feedback : undefined,
          curso: selectedCurso,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao avaliar programa");
      }

      onStatusChange(programa.id, action === "approve" ? "approved" : "draft");
      onClose();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Avaliar Programa de Ensino</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-sm font-medium text-slate-500 mb-1">Disciplina</h3>
            <p className="text-base text-slate-900">{programa.nomeDisciplina} ({programa.codigoDisciplina})</p>
          </div>

          <div className="mb-6">
            <label className="text-sm font-medium text-slate-700">
              Você está aprovando como coordenador de:
            </label>
            <select
              value={selectedCurso}
              onChange={e => setSelectedCurso(e.target.value)}
              className="mt-1 w-full text-sm border border-slate-200 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">Selecione o curso</option>
              {pendingAprovacoes.map(ap => (
                <option key={ap.curso} value={ap.curso}>
                  {ap.curso}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors hover:bg-slate-50 data-[selected=true]:border-blue-500 data-[selected=true]:bg-blue-50" data-selected={action === "approve"}>
              <div className="pt-0.5">
                <input type="radio" name="action" className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-600" checked={action === "approve"} onChange={() => setAction("approve")} />
              </div>
              <div>
                <div className="font-medium text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Aprovar Programa
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  O programa atende a todos os requisitos e está pronto para ser arquivado ou utilizado.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors hover:bg-slate-50 data-[selected=true]:border-red-500 data-[selected=true]:bg-red-50" data-selected={action === "reject"}>
              <div className="pt-0.5">
                <input type="radio" name="action" className="w-4 h-4 text-red-600 border-slate-300 focus:ring-red-600" checked={action === "reject"} onChange={() => setAction("reject")} />
              </div>
              <div>
                <div className="font-medium text-slate-900 flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  Devolver para Ajustes
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  O programa precisa de correções antes de ser aprovado.
                </p>
              </div>
            </label>
          </div>

          {action === "reject" && (
            <div className="mt-4 animate-in fade-in slide-in-from-top-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Motivo da devolução <span className="text-red-500">*</span>
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
                placeholder="Descreva o que precisa ser ajustado..."
              />
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedCurso || !action || loading || (action === "reject" && !feedback.trim())}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {loading ? "Processando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
