"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, XCircle, FileCheck, Loader2 } from "lucide-react";
import { programasEnsinoApi } from "@/services/programasEnsinoApi";
import type { ProgramaAprovacao } from "@/types/programaEnsino";
import { toastError } from "@/lib/swal";
import { cn } from "@/lib/utils";

interface ReviewProgramaModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  programa: any;
  onStatusChange: (id: string, status: string) => void;
}

export default function ReviewProgramaModal({
  isOpen,
  onClose,
  programa,
  onStatusChange,
}: ReviewProgramaModalProps) {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [pendingAprovacoes, setPendingAprovacoes] = useState<ProgramaAprovacao[]>([]);
  const [selectedCurso, setSelectedCurso] = useState("");

  useEffect(() => {
    if (isOpen && programa?.id) {
      programasEnsinoApi
        .getAprovacoes(programa.id)
        .then((rows) => {
          const pending = rows.filter((r) => r.status === "pending");
          setPendingAprovacoes(pending);
          if (pending.length === 1) {
            setSelectedCurso(pending[0].curso);
          }
        })
        .catch(console.error);
    } else {
      setAction(null);
      setFeedback("");
      setSelectedCurso("");
    }
  }, [isOpen, programa]);

  const handleSubmit = async () => {
    if (!selectedCurso) {
      toastError("Por favor, selecione o curso para o qual você está avaliando.");
      return;
    }

    if (!action) {
      toastError("Por favor, selecione uma decisão (Homologar ou Devolver).");
      return;
    }

    if (action === "reject" && !feedback.trim()) {
      toastError("Por favor, forneça os apontamentos para a devolução.");
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
      toastError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg p-6 rounded-xl border border-slate-200/80 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-[#102E52] flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-[#023E8A]" />
            Avaliar Programa de Ensino
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 mt-1">
            Analise o programa de ensino para homologação no curso sob sua coordenação.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {programa && (
            <div className="p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Disciplina
              </span>
              <p className="text-sm font-bold text-slate-900 leading-snug">
                {programa.nomeDisciplina}
              </p>
              <span className="inline-block font-mono text-[11px] font-semibold text-[#023E8A] bg-blue-50/80 px-1.5 py-0.5 rounded border border-blue-100">
                {programa.codigoDisciplina}
              </span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">
              Você está avaliando como coordenador de: <span className="text-red-500">*</span>
            </Label>
            <Select value={selectedCurso} onValueChange={setSelectedCurso}>
              <SelectTrigger className="w-full h-9 rounded-lg border-slate-200 text-xs focus:ring-[#023E8A]">
                <SelectValue placeholder="Selecione o curso..." />
              </SelectTrigger>
              <SelectContent>
                {pendingAprovacoes.map((ap) => (
                  <SelectItem key={ap.curso} value={ap.curso} className="text-xs">
                    {ap.curso}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2.5 pt-1">
            <Label className="text-xs font-semibold text-slate-700">
              Decisão da Coordenação <span className="text-red-500">*</span>
            </Label>

            <div className="grid gap-2.5">
              <button
                type="button"
                onClick={() => setAction("approve")}
                className={cn(
                  "w-full text-left flex items-start gap-3 p-3.5 border rounded-xl transition-all duration-150 cursor-pointer shadow-xs",
                  action === "approve"
                    ? "border-[#023E8A] bg-[#023E8A]/5 ring-1 ring-[#023E8A]"
                    : "border-slate-200/80 bg-white hover:bg-slate-50/60"
                )}
              >
                <div className="pt-0.5">
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                      action === "approve"
                        ? "border-[#023E8A] bg-[#023E8A]"
                        : "border-slate-300 bg-white"
                    )}
                  >
                    {action === "approve" && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    Homologar / Aprovar Programa
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    O programa atende aos requisitos do PPC do curso e está homologado para utilização.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAction("reject")}
                className={cn(
                  "w-full text-left flex items-start gap-3 p-3.5 border rounded-xl transition-all duration-150 cursor-pointer shadow-xs",
                  action === "reject"
                    ? "border-red-300 bg-red-50/40 ring-1 ring-red-400"
                    : "border-slate-200/80 bg-white hover:bg-slate-50/60"
                )}
              >
                <div className="pt-0.5">
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                      action === "reject"
                        ? "border-red-600 bg-red-600"
                        : "border-slate-300 bg-white"
                    )}
                  >
                    {action === "reject" && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                    Devolver com Apontamentos
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    O documento precisa de ajustes antes de ser homologado. A comissão receberá seus apontamentos.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {action === "reject" && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150 pt-1">
              <Label htmlFor="review-feedback" className="text-xs font-semibold text-slate-700">
                Parecer / Motivo da devolução <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="review-feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                className="text-xs rounded-lg border-slate-200 focus:ring-2 focus:ring-[#023E8A] resize-none"
                placeholder="Descreva detalhadamente o que precisa ser ajustado..."
                autoFocus
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="h-9 px-4 text-xs font-semibold text-slate-600 border-slate-200 hover:bg-slate-50"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedCurso || !action || loading || (action === "reject" && !feedback.trim())}
            className={cn(
              "h-9 font-bold px-4 text-xs text-white transition-colors",
              action === "reject"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-[#023E8A] hover:bg-[#023E8A]/90"
            )}
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                Processando...
              </>
            ) : action === "reject" ? (
              "Confirmar Devolução"
            ) : (
              "Confirmar Homologação"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
