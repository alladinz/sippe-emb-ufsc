"use client";

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, RefreshCcw, ClipboardCopy, AlertTriangle } from "lucide-react";
import { confirmDialog, toastError } from "@/lib/swal";
import { cn } from "@/lib/utils";
import { formatPlanScheduleSummary, type ScheduleDayInput } from "@/lib/schedule/ufsc-schedule";

interface PlanCopiable {
  id: string;
  status: string;
  updatedAt: string;
  semester: string;
  disciplina_nome: string;
  disciplina_codigo: string;
  turma?: string | null;
  contact?: string | null;
  officeHours?: string | null;
  schedule?: ScheduleDayInput[] | string | null;
  objectives?: string;
  programContent?: string;
  methodology?: string;
  evaluation?: string;
  evaluationFormula?: string;
}

export interface CamposCopiaveis {
  contact?: string;
  officeHours?: string;
  schedule?: ScheduleDayInput[];
  objectives?: string;
  programContent?: string;
  methodology?: string;
  evaluation?: string;
  evaluationFormula?: string;
}

type CopyFieldKey = keyof CamposCopiaveis;

interface CopiarPlanoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (campos: CamposCopiaveis) => void;
  planoAtualId: string;
  disciplinaId?: string;
  currentValues: CamposCopiaveis;
}

function hasScheduleContent(schedule: PlanCopiable["schedule"]): boolean {
  if (!schedule) return false;
  if (typeof schedule === "string") return Boolean(schedule.trim());
  if (Array.isArray(schedule)) {
    return schedule.some((d) => d.enabled || (Array.isArray(d.slots) && d.slots.length > 0));
  }
  return false;
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
  const [selectedFields, setSelectedFields] = useState<Record<CopyFieldKey, boolean>>({
    objectives: true,
    programContent: true,
    methodology: true,
    evaluation: true,
    evaluationFormula: true,
    schedule: true,
    contact: true,
    officeHours: true,
  });

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

  const selectedPlan = useMemo(
    () => plans.find(p => p.id === selectedPlanId),
    [plans, selectedPlanId]
  );

  // When a source plan is chosen, auto-select fields that actually have content
  useEffect(() => {
    if (!selectedPlan) return;
    setSelectedFields({
      objectives: Boolean(selectedPlan.objectives?.trim()),
      programContent: Boolean(selectedPlan.programContent?.trim()),
      methodology: Boolean(selectedPlan.methodology?.trim()),
      evaluation: Boolean(selectedPlan.evaluation?.trim()),
      evaluationFormula: Boolean(selectedPlan.evaluationFormula?.trim()),
      schedule: hasScheduleContent(selectedPlan.schedule),
      contact: Boolean(selectedPlan.contact?.trim()),
      officeHours: Boolean(selectedPlan.officeHours?.trim()),
    });
  }, [selectedPlan]);

  const toggleField = (key: CopyFieldKey) => {
    setSelectedFields(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleConfirm = async () => {
    if (!selectedPlan) return;

    const fieldsToCopy: CamposCopiaveis = {
      objectives: selectedFields.objectives ? (selectedPlan.objectives || undefined) : undefined,
      programContent: selectedFields.programContent ? (selectedPlan.programContent || undefined) : undefined,
      methodology: selectedFields.methodology ? (selectedPlan.methodology || undefined) : undefined,
      evaluation: selectedFields.evaluation ? (selectedPlan.evaluation || undefined) : undefined,
      evaluationFormula: selectedFields.evaluationFormula ? (selectedPlan.evaluationFormula || undefined) : undefined,
      contact: selectedFields.contact ? (selectedPlan.contact || undefined) : undefined,
      officeHours: selectedFields.officeHours ? (selectedPlan.officeHours || undefined) : undefined,
      schedule:
        selectedFields.schedule && Array.isArray(selectedPlan.schedule)
          ? selectedPlan.schedule
          : undefined,
    };

    onClose();

    const confirmed = await confirmDialog(
      'Confirmar cópia?',
      'Os campos selecionados do plano escolhido serão copiados para este rascunho. Esta ação pode sobrescrever o conteúdo atual desses campos.',
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
    (currentValues.evaluation && currentValues.evaluation.trim().replace(/<[^>]*>?/gm, '')) ||
    (currentValues.evaluationFormula && currentValues.evaluationFormula.trim()) ||
    (currentValues.officeHours && currentValues.officeHours.trim()) ||
    hasScheduleContent(currentValues.schedule)
  );

  const allEmptyInSource = selectedPlan && !(
    selectedPlan.objectives ||
    selectedPlan.programContent ||
    selectedPlan.methodology ||
    selectedPlan.evaluation ||
    selectedPlan.evaluationFormula ||
    selectedPlan.contact ||
    selectedPlan.officeHours ||
    hasScheduleContent(selectedPlan.schedule)
  );

  const nothingChecked = !Object.values(selectedFields).some(Boolean);

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
  };

  const fieldDefinitions: { key: CopyFieldKey; label: string; preview: string | null }[] = selectedPlan
    ? [
        { key: 'objectives', label: 'Objetivos', preview: selectedPlan.objectives ? stripHtml(selectedPlan.objectives) : null },
        { key: 'programContent', label: 'Conteúdo Programático', preview: selectedPlan.programContent ? stripHtml(selectedPlan.programContent) : null },
        { key: 'methodology', label: 'Metodologia de Ensino', preview: selectedPlan.methodology ? stripHtml(selectedPlan.methodology) : null },
        { key: 'evaluation', label: 'Critérios de Avaliação', preview: selectedPlan.evaluation ? stripHtml(selectedPlan.evaluation) : null },
        { key: 'evaluationFormula', label: 'Fórmula de Cálculo', preview: selectedPlan.evaluationFormula || null },
        {
          key: 'schedule',
          label: 'Horário da Aula',
          preview: hasScheduleContent(selectedPlan.schedule)
            ? formatPlanScheduleSummary(selectedPlan.schedule)
            : null,
        },
        { key: 'contact', label: 'Contato', preview: selectedPlan.contact || null },
        { key: 'officeHours', label: 'Horário de Atendimento', preview: selectedPlan.officeHours || null },
      ]
    : [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          "flex flex-col p-0 gap-0 overflow-hidden rounded-xl border border-slate-200/80 shadow-xl transition-all duration-200",
          plans.length === 0 && !loading ? "sm:max-w-md" : "sm:max-w-xl max-h-[85vh]"
        )}
      >
        <DialogHeader className="p-5 border-b border-slate-200/80 bg-white sticky top-0 z-10">
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-[#102E52]">
            <RefreshCcw className="w-4 h-4 text-[#023E8A]" />
            Copiar de outro plano
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <Loader2 className="w-7 h-7 animate-spin text-[#023E8A]" />
              <p className="text-xs text-slate-500 font-medium">Buscando seus planos...</p>
            </div>
          ) : plans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                <ClipboardCopy className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#102E52]">Nenhum outro plano disponível</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Você ainda não possui outros planos (rascunhos ou anteriores) para copiar. Preencha este plano manualmente.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2.5">
                <p className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Selecione o plano de origem</p>
                <div className="grid gap-2.5">
                  {plans.map(plan => (
                    <button
                      type="button"
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={cn(
                        "w-full text-left p-3.5 rounded-xl border transition-all duration-150 shadow-xs",
                        selectedPlanId === plan.id
                          ? "border-[#023E8A] bg-[#023E8A]/5 ring-1 ring-[#023E8A]"
                          : "border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-xs"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 leading-snug truncate">
                            {plan.disciplina_nome}
                          </p>
                          <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500 font-medium">
                            <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-[11px]">{plan.disciplina_codigo}</span>
                            {plan.turma && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-slate-600 font-semibold">Turma {plan.turma}</span>
                              </>
                            )}
                            <span>•</span>
                            <span>{plan.semester}</span>
                          </div>
                        </div>
                        <Badge variant={statusLabels[plan.status]?.variant || "outline"} className="text-[10px] px-2 py-0 shrink-0 font-medium">
                          {statusLabels[plan.status]?.label || plan.status}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2 font-medium">
                        Atualizado em {new Date(plan.updatedAt).toLocaleDateString('pt-BR')}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {selectedPlan && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="border border-slate-200/80 rounded-xl bg-white p-4 shadow-xs">
                    <p className="text-[11px] font-bold text-[#102E52] mb-3 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-[#023E8A] rounded-full" />
                      Selecione os campos para copiar
                    </p>
                    <div className="space-y-3">
                      {fieldDefinitions.map(field => {
                        const isChecked = selectedFields[field.key];
                        const hasValue = Boolean(field.preview);
                        return (
                          <div key={field.key} className="space-y-1.5">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => toggleField(field.key)}
                                disabled={!hasValue}
                                className="data-[state=checked]:bg-[#023E8A] data-[state=checked]:border-[#023E8A]"
                              />
                              <span className={cn("text-[11px] font-semibold", hasValue ? "text-slate-700" : "text-slate-400")}>
                                {field.label}
                              </span>
                            </label>
                            <div className="text-xs text-slate-600 line-clamp-2 bg-slate-50/70 p-2 rounded-lg border border-slate-100 ml-6">
                              {field.preview ? (
                                field.preview.substring(0, 150) + (field.preview.length > 150 ? '...' : '')
                              ) : (
                                <span className="text-slate-300 italic">Vazio neste plano</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {allEmptyInSource && (
                    <div className="flex items-start gap-2.5 text-red-700 bg-red-50 border border-red-200/60 rounded-xl p-3.5">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
                      <p className="text-xs font-medium leading-relaxed">
                        Este plano não possui conteúdo nos campos selecionados.
                      </p>
                    </div>
                  )}

                  {hasCurrentContent && !allEmptyInSource && (
                    <div className="flex items-start gap-2.5 text-amber-700 bg-amber-50 border border-amber-200/60 rounded-xl p-3.5">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                      <p className="text-xs font-medium leading-relaxed">
                        Atenção: os campos marcados serão sobrescritos neste rascunho pelo conteúdo do plano selecionado.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="p-4 bg-white border-t border-slate-200/80 sticky bottom-0 z-10 gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose} className="h-9 px-4 text-xs font-semibold text-slate-600 border-slate-200 hover:bg-slate-50">
            {plans.length === 0 ? "Fechar" : "Cancelar"}
          </Button>
          {plans.length > 0 && (
            <Button
              onClick={handleConfirm}
              disabled={!selectedPlan || allEmptyInSource || nothingChecked}
              className="h-9 bg-[#023E8A] hover:bg-[#023E8A]/90 text-xs font-bold px-5 text-white"
            >
              Confirmar cópia
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
