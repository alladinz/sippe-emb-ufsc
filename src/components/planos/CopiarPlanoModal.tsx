"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCcw, ClipboardCopy, AlertTriangle } from "lucide-react";
import { confirmDialog, toastError } from "@/lib/swal";
import { cn } from "@/lib/utils";

interface PlanCopiable {
  id: string;
  status: string;
  updatedAt: string;
  semester: string;
  disciplina_nome: string;
  disciplina_codigo: string;
  objectives?: string;
  programContent?: string;
  methodology?: string;
  evaluation?: string;
  evaluationFormula?: string;
}

interface CamposCopiaveis {
  objectives?: string;
  programContent?: string;
  methodology?: string;
  evaluation?: string;
  evaluationFormula?: string;
}

interface CopiarPlanoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (campos: CamposCopiaveis) => void;
  planoAtualId: string;
  disciplinaId?: string; // this is the code
  currentValues: CamposCopiaveis;
}

export function CopiarPlanoModal({
  isOpen,
  onClose,
  onConfirm,
  planoAtualId,
  disciplinaId,
  currentValues
}: CopiarPlanoModalProps) {
  const [plans, setPlans] = useState<PlanCopiable[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchPlans();
    } else {
      setSelectedPlanId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/planos/copiavel?planoAtualId=${planoAtualId}&disciplinaId=${disciplinaId || ''}`);
      if (!response.ok) throw new Error("Erro ao carregar planos");
      const data = await response.json();
      setPlans(data);
    } catch (error) {
      console.error("Fetch plans failed:", error);
      toastError("Não foi possível carregar seus planos anteriores.");
    } finally {
      setLoading(false);
    }
  };

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  const handleConfirm = async () => {
    if (!selectedPlan) return;

    // Store fields before closing modal
    const fieldsToCopy = {
      objectives: selectedPlan.objectives || undefined,
      programContent: selectedPlan.programContent || undefined,
      methodology: selectedPlan.methodology || undefined,
      evaluation: selectedPlan.evaluation || undefined,
      evaluationFormula: selectedPlan.evaluationFormula || undefined,
    };

    // Close the selection modal first to avoid focus trap/z-index conflicts with SweetAlert2
    onClose();

    const confirmed = await confirmDialog(
      'Confirmar cópia?',
      'Os campos selecionados do plano anterior serão copiados para este rascunho. Esta ação pode sobrescrever o conteúdo atual.',
      'Copiar campos',
      'Cancelar',
      false
    );

    if (confirmed) {
      onConfirm(fieldsToCopy);
    }
  };

  const statusLabels: Record<string, { label: string, variant: "default" | "secondary" | "destructive" | "outline" }> = {
    draft: { label: "Rascunho", variant: "secondary" },
    submitted: { label: "Enviado", variant: "default" },
    pending_review: { label: "Em Revisão", variant: "default" },
    approved: { label: "Aprovado", variant: "outline" },
    rejected: { label: "Rejeitado", variant: "destructive" },
    archived: { label: "Arquivado", variant: "secondary" },
  };

  const hasCurrentContent = !!(
    (currentValues.objectives && currentValues.objectives.trim().replace(/<[^>]*>?/gm, '')) ||
    (currentValues.programContent && currentValues.programContent.trim()) ||
    (currentValues.methodology && currentValues.methodology.trim().replace(/<[^>]*>?/gm, '')) ||
    (currentValues.evaluation && currentValues.evaluation.trim()) ||
    (currentValues.evaluationFormula && currentValues.evaluationFormula.trim())
  );

  const allEmptyInSource = selectedPlan && !(
    selectedPlan.objectives ||
    selectedPlan.programContent ||
    selectedPlan.methodology ||
    selectedPlan.evaluation ||
    selectedPlan.evaluationFormula
  );

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>?/gm, '');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden rounded-xl border-none shadow-2xl">
        <DialogHeader className="p-6 border-b bg-white sticky top-0 z-10">
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-900">
            <RefreshCcw className="w-5 h-5 text-brand-blue" />
            Copiar de plano anterior
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
              <p className="text-sm text-slate-500 font-medium">Buscando seus planos anteriores...</p>
            </div>
          ) : plans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
              <div className="bg-slate-100 p-4 rounded-full">
                <ClipboardCopy className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Nenhum plano anterior disponível</h3>
              <p className="text-sm text-slate-500 max-w-xs mx-auto">
                Você ainda não possui planos submetidos ou aprovados para copiar. Preencha este plano manualmente.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Selecione o plano de origem</p>
                <div className="grid gap-3">
                  {plans.map(plan => (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={cn(
                        "w-full text-left p-4 rounded-xl border transition-all duration-200 shadow-sm",
                        selectedPlanId === plan.id
                          ? "border-brand-blue bg-blue-50/50 ring-1 ring-brand-blue"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-slate-900 leading-tight">
                            {plan.disciplina_nome}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                            <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{plan.disciplina_codigo}</span>
                            <span>•</span>
                            <span>{plan.semester}</span>
                          </div>
                        </div>
                        <Badge variant={statusLabels[plan.status]?.variant || "outline"} className="text-[10px] px-2 py-0">
                          {statusLabels[plan.status]?.label || plan.status}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-3 font-medium italic">
                        Atualizado em {new Date(plan.updatedAt).toLocaleDateString('pt-BR')}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {selectedPlan && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="border border-brand-light/30 rounded-xl bg-white p-5 shadow-sm">
                    <p className="text-[10px] font-bold text-brand-blue mb-4 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-brand-blue rounded-full" />
                      Campos que serão copiados
                    </p>
                    <div className="space-y-4">
                      {[
                        { label: 'Objetivos', value: selectedPlan.objectives },
                        { label: 'Conteúdo Programático', value: selectedPlan.programContent },
                        { label: 'Metodologia', value: selectedPlan.methodology },
                        { label: 'Critérios de Avaliação', value: selectedPlan.evaluation },
                        { label: 'Fórmula de Cálculo', value: selectedPlan.evaluationFormula },
                      ].map(field => (
                        <div key={field.label} className="space-y-1">
                          <p className="text-[11px] font-bold text-slate-700">{field.label}</p>
                          <div className="text-xs text-slate-500 line-clamp-2 bg-slate-50/50 p-2 rounded-lg border border-slate-100 italic">
                            {field.value ? (
                                stripHtml(field.value).substring(0, 150) + (stripHtml(field.value).length > 150 ? '...' : '')
                            ) : (
                              <span className="text-slate-300">Vazio neste plano</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {allEmptyInSource && (
                    <div className="flex items-start gap-3 text-red-700 bg-red-50 border border-red-100 rounded-xl p-4">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <p className="text-xs font-medium leading-relaxed">
                        Este plano não possui conteúdo nos campos selecionados.
                      </p>
                    </div>
                  )}

                  {hasCurrentContent && !allEmptyInSource && (
                    <div className="flex items-start gap-3 text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-4">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <p className="text-xs font-medium leading-relaxed">
                        Atenção: os campos preenchidos neste rascunho serão substituídos pelo conteúdo do plano selecionado.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="p-4 bg-white border-t sticky bottom-0 z-10 gap-3">
          <Button variant="ghost" onClick={onClose} className="text-xs font-bold text-slate-500">
            {plans.length === 0 ? "Fechar" : "Cancelar"}
          </Button>
          {plans.length > 0 && (
            <Button
              onClick={handleConfirm}
              disabled={!selectedPlan || allEmptyInSource}
              className="bg-brand-blue hover:bg-brand-blue/90 text-xs font-bold px-8"
            >
              Confirmar cópia
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
