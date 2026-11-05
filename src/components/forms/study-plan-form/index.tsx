"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { useDebounce } from "use-debounce";
import { studyPlanSchema, type StudyPlanFormValues } from "@/lib/schemas/study-plan";
import { type ZodIssue } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Check, CloudUpload, Plus, Trash2, Eye, Send, BookOpen, AlertCircle, ArrowLeft, RefreshCcw, Info, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DeletePlanButton } from "@/app/dashboard/study-plans/_components/delete-plan-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { toastError, toastWarning, confirmDialog, toastSuccess } from "@/lib/swal";
import { CopiarPlanoModal } from "@/components/planos/CopiarPlanoModal";

interface StudyPlanFormProps {
  initialData: StudyPlanFormValues;
  studyPlanId: string;
  onSave: (data: StudyPlanFormValues) => Promise<void>;
  onSubmit: () => Promise<void>;
  semesterDates?: {
      startDate: Date;
      endDate: Date;
  };
  holidays?: { date: string, description: string }[];
  globalEvaluationRules?: string;
}

const DAYS_OF_WEEK = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo",
];

const DEFAULT_FINAL_EVALUATION = "O(a) aluno(a) com frequência suficiente e média das notas entre três (3,0) e cinco vírgula cinco (5,5) terá direito a uma nova avaliação no final do semestre que versará sobre todo o conteúdo da disciplina, conforme o que dispõe o § 2º do Art. 70 e § 3º do Art. 71 da Resolução nº 17/Cun/97. Neste caso, a média final será calculada através da média aritmética simples entre a média das notas das avaliações feitas durante o semestre e a nota obtida na nova avaliação. A nota mínima de aprovação é seis (6,0).\n\nCaso o(a) aluno(a) não compareça a 75% da carga horária da disciplina estará automaticamente reprovado com nota 0,0(zero), independentemente da sua média nas avaliações individuais, conforme dispõem no Art. 69 § 2º da Resolução 017/CUn/97.\n\nOs(as) alunos(as) que eventualmente faltarem em alguma avaliação que foram perdidas por motivos extremos, mediante justificativa; dentro do prazo de 3 (três) dias úteis após a avaliação conforme o que dispõe o Art. 74, da Resolução 017/CUn/97, poderão solicitar na secretaria acadêmica do Centro de Engenharias da Mobilidade o pedido de segunda chamada. Após a análise do pedido e seu deferimento, os(as) alunos(as) poderão realizar a avaliação de segunda chamada na data, no local e horário definido no cronograma.";

const TABS = [
  { id: "identificacao", label: "Identificação" },
  { id: "conteudo", label: "Conteúdo" },
  { id: "pedagogia", label: "Metodologia" },
  { id: "avaliacao", label: "Avaliação" },
  { id: "cronograma", label: "Cronograma" },
  { id: "bibliografia", label: "Bibliografia" },
];

export function StudyPlanForm({ initialData, studyPlanId, onSave, onSubmit, semesterDates, holidays, globalEvaluationRules }: StudyPlanFormProps) {
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [modalCopiaAberto, setModalCopiaAberto] = useState(false);
  const [activeTab, setActiveTab] = useState("identificacao");
  const [mounted, setMounted] = useState(false);

  const pendingDataRef = useRef<{ data: StudyPlanFormValues; force: boolean } | null>(null);
  const isSavingRef = useRef(false);
  const saveSeqRef = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const initialSchedule = useMemo(() =>
    Array.isArray(initialData.schedule) && initialData.schedule.length > 0
    ? initialData.schedule
    : DAYS_OF_WEEK.map(day => ({ day, enabled: false, startTime: "08:00", endTime: "10:00" })),
    [initialData.schedule]
  );

  const initialWeeklySchedule = useMemo(() =>
    initialData.weeklySchedule || Array.from({ length: 18 }, (_, i) => ({
    week: (i + 1).toString(),
    class1: { number: "-", content: "" },
    class2: { number: "-", content: "" }
  })), [initialData.weeklySchedule]);

  const isDraftOrRejected = !initialData.status || initialData.status === 'draft' || initialData.status === 'rejected';

  const fullDefaultValues = useMemo(() => ({
    ...initialData,
    universityAcronym: initialData.universityAcronym || "UFSC",
    campus: initialData.campus || "Campus de Joinville",
    center: initialData.center || "Centro Tecnológico de Joinville",
    finalEvaluationRules: isDraftOrRejected
      ? (globalEvaluationRules || DEFAULT_FINAL_EVALUATION)
      : (initialData.finalEvaluationRules || globalEvaluationRules || DEFAULT_FINAL_EVALUATION),
    courses: initialData.courses || [],
    bibliography: initialData.bibliography || [],
    schedule: initialSchedule,
    weeklySchedule: initialWeeklySchedule
  }), [initialData, initialSchedule, initialWeeklySchedule, globalEvaluationRules, isDraftOrRejected]);

  const lastSavedDataRef = useRef<StudyPlanFormValues>(fullDefaultValues);

  const {
    register,
    control,
    watch,
    setValue,
    getValues,
    formState: { errors },
    } = useForm<StudyPlanFormValues>({
    defaultValues: fullDefaultValues,
    mode: "onChange"
  });

  const scheduleVal = watch("schedule");
  const selectedDays = Array.isArray(scheduleVal) ? scheduleVal : [];
  const numSelectedDays = selectedDays.filter(s => s.enabled).length;
  const hasMoreThanOneDay = numSelectedDays > 1;

  const { fields: weeklyScheduleFields } = useFieldArray({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    control: control as any,
    name: "weeklySchedule",
  });

  const { fields: bibFields, append: appendBib, remove: removeBib } = useFieldArray({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    control: control as any,
    name: "bibliography",
  });

  const { fields: courseFields } = useFieldArray({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    control: control as any,
    name: "courses",
  });

  const formData = watch();
  const [debouncedData] = useDebounce(formData, 1000);
  const router = useRouter();

  const executeSave = useCallback(async (data: StudyPlanFormValues, force: boolean = false) => {
    const dataStr = JSON.stringify(data);
    if (!force && dataStr === JSON.stringify(lastSavedDataRef.current)) {
      return;
    }

    if (isSavingRef.current) {
      pendingDataRef.current = { data, force };
      return;
    }

    const currentSeq = ++saveSeqRef.current;
    isSavingRef.current = true;
    setSaveStatus('saving');
    setSaveError(null);

    try {
      await onSave(data);

      if (currentSeq === saveSeqRef.current) {
        lastSavedDataRef.current = data;
        setLastSaved(new Date());
        setSaveStatus('saved');
      }
    } catch (err: unknown) {
      console.error("Auto-save failed:", err);
      if (currentSeq === saveSeqRef.current) {
        setSaveStatus('error');
        setSaveError(err instanceof Error ? err.message : "Erro ao salvar alterações");
      }
    } finally {
      isSavingRef.current = false;

      if (pendingDataRef.current) {
        const next = pendingDataRef.current;
        pendingDataRef.current = null;
        executeSave(next.data, next.force);
      }
    }
  }, [onSave]);

  // Protect against accidental navigation/tab closing with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const isDirty = JSON.stringify(getValues()) !== JSON.stringify(lastSavedDataRef.current);
      if (saveStatus === 'saving' || pendingDataRef.current !== null || isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    // Save immediately if navigating internally via links
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (!anchor) return;
      if (anchor.target === '_blank' || anchor.getAttribute('href')?.startsWith('#')) return;

      const currentData = getValues();
      const isUnsaved = JSON.stringify(currentData) !== JSON.stringify(lastSavedDataRef.current);
      if (isUnsaved) {
        executeSave(currentData, true);
      }
    };

    // Save on mobile backgrounding / tab switching
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const currentData = getValues();
        const isUnsaved = JSON.stringify(currentData) !== JSON.stringify(lastSavedDataRef.current);
        if (isUnsaved) {
          executeSave(currentData, true);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('click', handleAnchorClick, { capture: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('click', handleAnchorClick, { capture: true });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [saveStatus, getValues, executeSave]);

  const flushSave = useCallback(async (): Promise<boolean> => {
    const currentData = getValues();

    // Wait for in-flight save to finish if running
    while (isSavingRef.current) {
      pendingDataRef.current = { data: currentData, force: true };
      await new Promise(r => setTimeout(r, 60));
    }

    // If data is still different from lastSavedDataRef, execute save and wait for it
    if (JSON.stringify(getValues()) !== JSON.stringify(lastSavedDataRef.current) || pendingDataRef.current !== null) {
      pendingDataRef.current = null;
      await executeSave(getValues(), true);
    }

    return saveStatus !== 'error';
  }, [executeSave, getValues, saveStatus]);

  useEffect(() => {
    if (!mounted) return;
    formData.courses?.forEach((course, index) => {
        if (course.workload) {
            const calculatedCredits = Math.floor(course.workload / 18);
            if (course.credits !== calculatedCredits) {
                setValue(`courses.${index}.credits`, calculatedCredits, { shouldDirty: true });
            }
        }
    });
  }, [formData.courses, setValue, mounted]);

  useEffect(() => {
    if (!mounted) return;
    executeSave(debouncedData);
  }, [debouncedData, mounted, executeSave]);

  const handleTabChange = async (value: string) => {
    setActiveTab(value);
    await executeSave(getValues(), true);
  };

  const handlePreviewClick = async () => {
    const saved = await flushSave();
    if (!saved) {
      toastWarning("Aguarde a conclusão do salvamento antes de pré-visualizar.");
      return;
    }
    router.push(`/dashboard/study-plans/${studyPlanId}/preview`);
  };

  const getTabStatus = useCallback((tabId: string): 'complete' | 'partial' | 'empty' => {
    const vals = getValues();
    switch (tabId) {
      case 'identificacao': {
        const hasCourses = (vals.courses || []).some(c => c.code?.trim() || c.name?.trim());
        const hasSemester = !!vals.semester?.trim();
        if (hasCourses && hasSemester) return 'complete';
        if (hasCourses || hasSemester) return 'partial';
        return 'empty';
      }
      case 'conteudo': {
        const hasSyllabus = !!vals.syllabus?.trim();
        const hasObjectives = !!vals.objectives?.trim();
        const hasContent = !!vals.programContent?.trim();
        if (hasSyllabus && hasObjectives && hasContent) return 'complete';
        if (hasSyllabus || hasObjectives || hasContent) return 'partial';
        return 'empty';
      }
      case 'pedagogia': {
        return vals.methodology?.trim() ? 'complete' : 'empty';
      }
      case 'avaliacao': {
        const hasEval = !!vals.evaluation?.trim();
        const hasRules = !!vals.finalEvaluationRules?.trim();
        if (hasEval && hasRules) return 'complete';
        if (hasEval || hasRules) return 'partial';
        return 'empty';
      }
      case 'cronograma': {
        const hasSchedule = (vals.weeklySchedule || []).some(w => w.class1?.content?.trim());
        const hasDays = Array.isArray(vals.schedule) && vals.schedule.some(s => s.enabled);
        if (hasSchedule && hasDays) return 'complete';
        if (hasSchedule || hasDays) return 'partial';
        return 'empty';
      }
      case 'bibliografia': {
        const hasBib = (vals.bibliography || []).some(b => b.title?.trim());
        return hasBib ? 'complete' : 'empty';
      }
      default:
        return 'empty';
    }
  }, [getValues]);

  const onFinalSubmit = async () => {
      // Ensure all pending changes are persisted prior to submission
      const saved = await flushSave();
      if (!saved) {
          toastError("Não foi possível salvar as alterações mais recentes. Verifique sua conexão antes de submeter.");
          return;
      }

      const filteredCourses = (formData.courses || []).filter(c => c.code?.trim() || c.name?.trim());
      const filteredBib = (formData.bibliography || []).filter(b => b.author?.trim() || b.title?.trim());
      const dataToValidate = { ...formData, courses: filteredCourses, bibliography: filteredBib };
      const result = studyPlanSchema.safeParse(dataToValidate);
      if (!result.success) {
          const errorMsg = result.error.issues.map((e: ZodIssue) => `${e.path.join('.')}: ${e.message}`).join('\n');
          console.log("SUBMISSION VALIDATION FAILED:", errorMsg);
          toastError(`Erro de validação: ${result.error.issues[0].message}`);
          return;
      }
      setValue("courses", filteredCourses);
      setValue("bibliography", filteredBib);

      const confirmed = await confirmDialog(
          initialData.status === 'rejected' ? 'Re-submeter Plano?' : 'Submeter para Revisão?',
          'Após o envio, o plano entrará em modo de apenas leitura até que seja revisado pela coordenação.',
          'Confirmar Envio',
          'Cancelar'
      );

      if (!confirmed) return;

      try {
          await onSubmit();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
          if (error.message === 'NEXT_REDIRECT') return;
          toastError(error instanceof Error ? error.message : "Erro ao submeter o plano");
      }
  };

  const handleGenerateSchedule = async () => {
    if (!semesterDates) {
        toastError("As datas do semestre não foram configuradas.");
        return;
    }
    const selectedDaysList = Array.isArray(formData.schedule)
      ? formData.schedule.filter(s => s.enabled).map(s => s.day)
      : [];
    if (selectedDaysList.length === 0) {
        toastWarning("Por favor, selecione os dias da semana antes de gerar o cronograma.");
        return;
    }

    const confirmed = await confirmDialog(
        'Gerar cronograma?',
        'Este procedimento irá sobrescrever o cronograma atual. Deseja prosseguir?',
        'Confirmar',
        'Cancelar',
        false
    );

    if (!confirmed) return;

    const dayMap: Record<string, number> = { "Domingo": 0, "Segunda-feira": 1, "Terça-feira": 2, "Quarta-feira": 3, "Quinta-feira": 4, "Sexta-feira": 5, "Sábado": 6 };
    const targetDays = selectedDaysList.map(d => dayMap[d]);
    const start = new Date(semesterDates.startDate);
    const end = new Date(semesterDates.endDate);

    const weeks: StudyPlanFormValues["weeklySchedule"] = [];

    // Helper to get the Monday of the week for a given date
    const getMonday = (d: Date) => {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(date.setDate(diff));
    };

    const currentWeekMonday = getMonday(start);
    let weekNum = 1;

    while (currentWeekMonday <= end) {
        const weekClasses: Date[] = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(currentWeekMonday);
            day.setDate(day.getDate() + i);
            // Only count classes that fall within the semester range and match selected days
            if (day >= start && day <= end && targetDays.includes(day.getDay())) {
                weekClasses.push(day);
            }
        }

        const formatDate = (d: Date) => `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;

        // Helper to check if a date is a holiday
        const getHoliday = (d: Date) => {
            if (!holidays) return null;
            // Use local date components to avoid UTC timezone shifts
            const year = d.getFullYear();
            const month = (d.getMonth() + 1).toString().padStart(2, '0');
            const day = d.getDate().toString().padStart(2, '0');
            const dStr = `${year}-${month}-${day}`;
            return holidays.find((h: { date: string, description: string }) => h.date === dStr);
        };

        const weekEntry = {
            week: weekNum.toString(),
            class1: { number: "-", content: "" },
            class2: { number: "-", content: "" }
        };

        if (weekClasses[0]) {
            weekEntry.class1.number = formatDate(weekClasses[0]);
            const h = getHoliday(weekClasses[0]);
            if (h) {
                weekEntry.class1.content = `[DIA NÃO LETIVO] ${h.description.toUpperCase()}`;
            }
        }

        if (weekClasses[1]) {
            weekEntry.class2.number = formatDate(weekClasses[1]);
            const h = getHoliday(weekClasses[1]);
            if (h) {
                weekEntry.class2.content = `[DIA NÃO LETIVO] ${h.description.toUpperCase()}`;
            }
        }

        weeks.push(weekEntry);

        currentWeekMonday.setDate(currentWeekMonday.getDate() + 7);
        weekNum++;

        // Safety break
        if (weekNum > 25) break;
    }

    setValue("weeklySchedule", weeks, { shouldDirty: true });
    toastSuccess("Cronograma gerado com sucesso.");
  };

  const handleCopiarCampos = (campos: {
    objectives?: string;
    programContent?: string;
    methodology?: string;
    evaluation?: string;
    evaluationFormula?: string;
  }) => {
    if (campos.objectives) setValue("objectives", campos.objectives, { shouldDirty: true });
    if (campos.programContent) setValue("programContent", campos.programContent, { shouldDirty: true });
    if (campos.methodology) setValue("methodology", campos.methodology, { shouldDirty: true });
    if (campos.evaluation) setValue("evaluation", campos.evaluation, { shouldDirty: true });
    if (campos.evaluationFormula) setValue("evaluationFormula", campos.evaluationFormula, { shouldDirty: true });

    setModalCopiaAberto(false);
    toastSuccess("Campos copiados com sucesso. Revise o conteúdo antes de submeter.");

    // Switch to relevant tab
    if (campos.objectives || campos.programContent) {
      setActiveTab("conteudo");
    } else if (campos.methodology) {
      setActiveTab("pedagogia");
    } else if (campos.evaluation || campos.evaluationFormula) {
      setActiveTab("avaliacao");
    }
  };

  const isReadOnly = initialData.status !== 'draft' && initialData.status !== 'rejected';

  const currentValuesForCopy = useMemo(() => ({
    objectives: formData.objectives || undefined,
    programContent: formData.programContent || undefined,
    methodology: formData.methodology || undefined,
    evaluation: formData.evaluation || undefined,
    evaluationFormula: formData.evaluationFormula || undefined,
  }), [formData.objectives, formData.programContent, formData.methodology, formData.evaluation, formData.evaluationFormula]);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-4 border border-slate-200/80 rounded-xl shadow-xs gap-4">
        <div className="flex items-center gap-3.5 flex-wrap">
          <Link href="/dashboard/study-plans">
            <Button variant="ghost" size="sm" className="gap-1.5 text-slate-600 font-bold text-xs h-8">
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar
            </Button>
          </Link>
          <div className="h-5 w-px bg-slate-200 hidden md:block" />
          <StatusBadge status={initialData.status} />
          {isReadOnly && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60 text-[11px] font-bold">
                  <BookOpen className="w-3 h-3" />
                  Modo Somente Leitura
              </div>
          )}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            {saveStatus === 'saving' ? (
              <>
                <CloudUpload className="w-3.5 h-3.5 text-[#023E8A] animate-pulse" />
                <span className="text-[#023E8A] font-bold">Salvando...</span>
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span id="save-status">
                  {lastSaved ? `Salvo às ${lastSaved.toLocaleTimeString('pt-BR')}` : "Todas as alterações salvas"}
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                <span className="text-red-600 font-bold">{saveError || "Erro ao salvar"}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => executeSave(getValues(), true)}
                  className="h-6 px-1.5 text-[11px] text-[#023E8A] underline hover:bg-blue-50 font-bold"
                >
                  Tentar novamente
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!isReadOnly && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalCopiaAberto(true)}
                className="gap-1.5 text-slate-700 border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold h-8"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                Copiar de anterior
              </Button>
          )}
          {!isReadOnly && initialData.status !== 'submitted' && (
              <DeletePlanButton className="rounded-lg text-xs h-8" id={studyPlanId} variant="full" shouldRedirect={true} />
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-slate-700 border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold h-8"
            onClick={handlePreviewClick}
            disabled={saveStatus === 'saving'}
          >
            <Eye className="w-3.5 h-3.5" />
            Visualizar
          </Button>
          {!isReadOnly && (
              <Button
                size="sm"
                className="gap-1.5 bg-[#023E8A] hover:bg-[#023E8A]/90 text-white font-bold rounded-lg text-xs h-8 px-3.5 shadow-xs"
                onClick={onFinalSubmit}
                disabled={saveStatus === 'saving'}
              >
                <Send className="w-3.5 h-3.5" />
                {initialData.status === 'rejected' ? 'Re-submeter para Revisão' : 'Submeter para Revisão'}
              </Button>
          )}
        </div>
      </div>

      {initialData.status === 'rejected' && initialData.feedback && (
          <div className="bg-red-50 border border-red-200 p-5 rounded-xl flex gap-4 animate-in fade-in slide-in-from-top-2 shadow-xs">
              <div className="bg-red-100 p-2 rounded-full h-fit">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              </div>
              <div>
                  <h4 className="text-sm font-bold text-red-900">Feedback de Rejeição</h4>
                  <p className="text-sm text-red-800 mt-1 leading-relaxed italic">&quot;{initialData.feedback}&quot;</p>
                  <div className="mt-3 flex items-center gap-2 text-xs font-medium text-red-600 bg-white/50 w-fit px-2 py-1 rounded border border-red-100">
                    <Check className="w-3 h-3" />
                    Realize os ajustes e re-submeta para uma nova revisão.
                  </div>
              </div>
          </div>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full flex flex-col space-y-6">
        <div className="w-full overflow-x-auto py-1 flex sm:justify-center justify-start">
            <TabsList className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-100/90 p-1 text-slate-500 gap-1 border border-slate-200/70 shadow-2xs min-w-max">
                {TABS.map(tab => {
                    const status = getTabStatus(tab.id);
                    const dotColor = status === 'complete' ? 'bg-emerald-500' :
                                     status === 'partial'  ? 'bg-amber-400' : 'bg-slate-300';
                    return (
                        <TabsTrigger
                            key={tab.id}
                            value={tab.id}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-[#023E8A] data-[state=active]:shadow-xs rounded-lg focus-visible:ring-2 focus-visible:ring-[#023E8A]"
                        >
                            <span>{tab.label}</span>
                            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColor)} />
                        </TabsTrigger>
                    );
                })}
            </TabsList>
        </div>

        <TabsContent value="identificacao" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <fieldset disabled={isReadOnly} className="contents">
          <Card className="border border-slate-200/80 shadow-xs rounded-xl overflow-hidden bg-white">
            <CardHeader className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base sm:text-lg font-bold text-[#102E52] leading-snug">Identificação da Disciplina</CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">Informações institucionais e dados da disciplina.</CardDescription>
                </div>
                {!isReadOnly && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 text-[11px] font-bold self-start sm:self-auto">
                        <Info className="w-3.5 h-3.5" />
                        Campos Gerenciados pelo Departamento
                    </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
              {/* Institucional Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1 h-4 bg-[#023E8A] rounded-full" />
                  Institucional
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="universityAcronym">Sigla da Universidade</Label>
                    <Input id="universityAcronym" {...register("universityAcronym")} className="bg-slate-50/50 cursor-not-allowed opacity-80" readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="campus">Campus</Label>
                    <Input id="campus" {...register("campus")} className="bg-slate-50/50 cursor-not-allowed opacity-80" readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="center">Centro</Label>
                    <Input id="center" {...register("center")} className="bg-slate-50/50 cursor-not-allowed opacity-80" readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="courseName">Curso</Label>
                    <Input id="courseName" {...register("courseName")} className="bg-slate-50/50 cursor-not-allowed opacity-80" readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="semester">Semestre Letivo</Label>
                    <Input id="semester" {...register("semester")} className="bg-slate-50/50 cursor-not-allowed opacity-80" readOnly />
                    {errors.semester && <p className="text-sm text-destructive">{errors.semester.message}</p>}
                  </div>
                </div>
              </div>

              {/* Disciplina Section */}
              {courseFields.length > 0 && (
                <div className="space-y-4 pt-6 border-t">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1 h-4 bg-[#023E8A] rounded-full" />
                    Disciplina
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label>Código da Disciplina</Label>
                      <Input {...register(`courses.0.code`)} className="bg-slate-50/50 cursor-not-allowed opacity-80" readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label>Nome da Disciplina</Label>
                      <Input {...register(`courses.0.name`)} className="bg-slate-50/50 cursor-not-allowed opacity-80" readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label>Carga Horária</Label>
                      <Input type="number" {...register(`courses.0.workload`, { valueAsNumber: true })} className="bg-slate-50/50 cursor-not-allowed opacity-80" readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label>Créditos</Label>
                      <Input type="number" {...register(`courses.0.credits`, { valueAsNumber: true })} className="bg-slate-50/50 cursor-not-allowed opacity-80" readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label>Turma</Label>
                      <Input {...register(`courses.0.classIdentifier`)} className="bg-slate-50/50 cursor-not-allowed opacity-80" readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Input {...register(`courses.0.classType`)} className="bg-slate-50/50 cursor-not-allowed opacity-80" readOnly />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          </fieldset>
        </TabsContent>

        <TabsContent value="conteudo" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <fieldset disabled={isReadOnly} className="contents">
          <Card className="border border-slate-200/80 shadow-xs rounded-xl overflow-hidden bg-white">
            <CardHeader className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base sm:text-lg font-bold text-[#102E52] leading-snug">Conteúdo Acadêmico</CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">Ementa, objetivos e conteúdo programático da disciplina.</CardDescription>
                </div>
                {!isReadOnly && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 text-[11px] font-bold self-start sm:self-auto">
                        <Info className="w-3.5 h-3.5" />
                        Campos Gerenciados pelo Departamento
                    </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="prerequisites">Pré-requisitos</Label>
                <Input
                  id="prerequisites"
                  {...register("prerequisites")}
                  placeholder="Não há pré-requisitos cadastrados."
                  className="bg-slate-50/50 cursor-not-allowed opacity-80"
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="syllabus">Ementa (Syllabus)</Label>
                <Controller
                  name="syllabus"
                  control={control}
                  render={({ field }) => (
                    <TiptapEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                      disabled={true}
                      className="bg-slate-50/50 cursor-not-allowed opacity-80"
                    />
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="objectives">Objetivos</Label>
                <Controller
                  name="objectives"
                  control={control}
                  render={({ field }) => (
                    <TiptapEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Objetivos gerais e específicos..."
                    />
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="programContent">Conteúdo Programático</Label>
                <Controller
                  name="programContent"
                  control={control}
                  render={({ field }) => (
                    <TiptapEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Lista detalhada de tópicos (1., 1.1., etc)..."
                      className="min-h-[300px]"
                    />
                  )}
                />
              </div>            </CardContent>
          </Card>
          </fieldset>
        </TabsContent>

        <TabsContent value="pedagogia" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <fieldset disabled={isReadOnly} className="contents">
          <Card className="border border-slate-200/80 shadow-xs rounded-xl overflow-hidden bg-white">
            <CardHeader className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base sm:text-lg font-bold text-[#102E52] leading-snug">Metodologia de Ensino</CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">Descreva como as aulas serão conduzidas e quais recursos serão utilizados.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label htmlFor="methodology" className="text-slate-600">Descrição da Metodologia</Label>
                <Controller
                  name="methodology"
                  control={control}
                  render={({ field }) => (
                    <TiptapEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Descreva as técnicas e métodos que serão utilizados..."
                      className="min-h-[300px]"
                    />
                  )}
                />
              </div>
            </CardContent>
          </Card>
          </fieldset>
        </TabsContent>

        <TabsContent value="cronograma" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <fieldset disabled={isReadOnly} className="contents">
          <Card className="border border-slate-200/80 shadow-xs rounded-xl overflow-hidden bg-white">
            <CardHeader className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <CardTitle className="text-base sm:text-lg font-bold text-[#102E52] leading-snug">Cronograma de Aulas</CardTitle>
                    <CardDescription className="text-xs text-slate-500 mt-0.5">
                        Planejamento semanal das aulas e conteúdos ao longo do semestre.
                    </CardDescription>
                </div>
                {!isReadOnly && (
                    <Button
                        type="button"
                        size="sm"
                        className="gap-2 bg-[#023E8A] hover:bg-[#023E8A]/90 text-white font-bold h-9 px-3.5 shadow-xs self-start sm:self-auto"
                        onClick={handleGenerateSchedule}
                    >
                        <Sparkles className="w-4 h-4" />
                        Gerar Cronograma
                    </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-6">
              {!isReadOnly && (
                  <>
                  <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200/80 flex gap-3">
                      <Info className="w-5 h-5 text-[#023E8A] shrink-0 mt-0.5" />
                      <div className="text-xs text-blue-900 leading-relaxed">
                          <strong className="font-bold">Instruções para geração do cronograma:</strong>
                          <p className="mt-1">
                              Para organizar o cronograma de aulas em conformidade com o calendário acadêmico, siga estas etapas:
                          </p>
                          <ol className="list-decimal ml-5 mt-1.5 space-y-1 text-slate-700">
                              <li>Selecione abaixo os dias da semana em que as aulas da disciplina ocorrerão.</li>
                              <li>Clique no botão <strong>&quot;Gerar Cronograma&quot;</strong> localizado no cabeçalho desta seção.</li>
                              <li>O sistema distribuirá automaticamente as datas das aulas ao longo de todas as semanas do semestre letivo.</li>
                          </ol>
                      </div>
                  </div>

                  <div className="bg-slate-50/80 p-5 rounded-xl border border-slate-200/80 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <Label className="text-sm font-bold text-slate-900">Selecione os dias da semana com aula:</Label>
                          {numSelectedDays > 0 && (
                              <span className="text-xs font-bold text-[#023E8A] bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 rounded-full w-fit">
                                  {numSelectedDays} {numSelectedDays === 1 ? 'dia selecionado' : 'dias selecionados'}
                              </span>
                          )}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
                          {DAYS_OF_WEEK.map((day, index) => {
                              const isChecked = !!watch(`schedule.${index}.enabled`);
                              return (
                                  <label
                                      key={day}
                                      htmlFor={`day-select-${index}`}
                                      className={cn(
                                          "flex items-center gap-2.5 p-3 rounded-xl border transition-all cursor-pointer select-none",
                                          isChecked
                                              ? "border-[#023E8A] bg-blue-50/90 text-[#023E8A] font-bold shadow-2xs ring-1 ring-[#023E8A]/50"
                                              : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium"
                                      )}
                                  >
                                      <Checkbox
                                          id={`day-select-${index}`}
                                          checked={isChecked}
                                          onCheckedChange={(checked) => {
                                              setValue(`schedule.${index}.enabled`, !!checked, { shouldDirty: true });
                                          }}
                                          className="data-[state=checked]:bg-[#023E8A] data-[state=checked]:border-[#023E8A]"
                                      />
                                      <span className="text-xs truncate">{day}</span>
                                  </label>
                              );
                          })}
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                          <p className="text-[11px] italic">
                              * As datas serão geradas automaticamente entre o início e fim do semestre configurado.
                          </p>
                          {numSelectedDays > 0 && (
                              <span className="text-[11px] text-slate-600 font-medium hidden sm:inline">
                                  Dias ativos: <strong>{selectedDays.filter(s => s.enabled).map(s => s.day).join(", ")}</strong>
                              </span>
                          )}
                      </div>
                  </div>
                  </>
              )}

              {numSelectedDays > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-[80px] text-center">Semana</TableHead>
                    <TableHead className="w-[80px] text-center border-l">Aula</TableHead>
                    <TableHead className="min-w-[200px] border-l">Conteúdo</TableHead>
                    {hasMoreThanOneDay && (
                      <>
                        <TableHead className="w-[80px] text-center border-l">Aula</TableHead>
                        <TableHead className="min-w-[200px] border-l">Conteúdo</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {weeklyScheduleFields.map((field, index) => (
                    <TableRow key={field.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="text-center font-medium bg-slate-50/30">
                        {index + 1}
                      </TableCell>
                      <TableCell className="border-l">
                        <Input
                          {...register(`weeklySchedule.${index}.class1.number`)}
                          onBlur={async (e) => {
                            await register(`weeklySchedule.${index}.class1.number`).onBlur(e);
                            executeSave(getValues());
                          }}
                          className="h-8 text-center border-transparent focus:border-brand-blue bg-transparent"
                        />
                      </TableCell>
                      <TableCell className="border-l">
                        <Input
                          {...register(`weeklySchedule.${index}.class1.content`)}
                          onBlur={async (e) => {
                            await register(`weeklySchedule.${index}.class1.content`).onBlur(e);
                            executeSave(getValues());
                          }}
                          placeholder="..."
                          className="h-8 border-transparent focus:border-brand-blue bg-transparent"
                        />
                      </TableCell>
                      {hasMoreThanOneDay && (
                        <>
                          <TableCell className="border-l">
                            <Input
                              {...register(`weeklySchedule.${index}.class2.number`)}
                              onBlur={async (e) => {
                                await register(`weeklySchedule.${index}.class2.number`).onBlur(e);
                                executeSave(getValues());
                              }}
                              className="h-8 text-center border-transparent focus:border-brand-blue bg-transparent"
                            />
                          </TableCell>
                          <TableCell className="border-l">
                            <Input
                              {...register(`weeklySchedule.${index}.class2.content`)}
                              onBlur={async (e) => {
                                await register(`weeklySchedule.${index}.class2.content`).onBlur(e);
                                executeSave(getValues());
                              }}
                              placeholder="..."
                              className="h-8 border-transparent focus:border-brand-blue bg-transparent"
                            />
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
              ) : (
                <div className="py-12 text-center bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                    <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">Selecione os dias da semana para visualizar o cronograma.</p>
                </div>
              )}
              <div className="mt-4 flex justify-between items-center px-2">
                <p className="text-xs text-slate-500 italic">* O cronograma está sujeito a alterações conforme o andamento da disciplina.</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1"
                  onClick={() => {
                    // For now, 18 weeks is standard.
                  }}
                  disabled={true}
                >
                  <Plus className="w-3 h-3" /> Adicionar Semana
                </Button>
              </div>
            </CardContent>
          </Card>
          </fieldset>
        </TabsContent>

        <TabsContent value="avaliacao" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <fieldset disabled={isReadOnly} className="contents">
          <Card className="border border-slate-200/80 shadow-xs rounded-xl overflow-hidden bg-white">
            <CardHeader className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base sm:text-lg font-bold text-[#102E52] leading-snug">Avaliação da Aprendizagem</CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">Critérios, fórmula de cálculo e regras de recuperação final.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="evaluation">Critérios de Avaliação</Label>
                <Textarea
                  id="evaluation"
                  {...register("evaluation")}
                  placeholder="Descreva como os alunos serão avaliados..."
                  className="min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="evaluationFormula">Fórmula de Cálculo da Média</Label>
                <Input id="evaluationFormula" {...register("evaluationFormula")} placeholder="Ex: MF = 0,5*P1 + 0,5*P2" />
                <p className="text-[10px] text-slate-500 italic">Dica: Use notação matemática simples.</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="finalEvaluationRules">Avaliação Final (Recuperação)</Label>
                    {!isReadOnly && (
                        <span className="text-[10px] text-brand-blue bg-brand-light/10 px-2 py-0.5 rounded border border-brand-light/20 font-medium">
                            Conteúdo Informativo
                        </span>
                    )}
                </div>
                <div className="flex gap-3 p-4 bg-blue-50/50 border border-blue-100 rounded-lg text-slate-700 shadow-sm">
                    <Info className="w-5 h-5 text-brand-blue shrink-0 mt-0.5" />
                    <div className="text-xs leading-relaxed text-justify whitespace-pre-wrap font-medium opacity-90">
                        {(() => {
                            const val = watch("finalEvaluationRules") || "";
                            if (!val.includes("**")) return val;
                            return (
                                <span className="block">
                                    {val.split(/\*\*(.*?)\*\*/g).map((part, i) =>
                                        i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
                                    )}
                                </span>
                            );
                        })()}
                    </div>
                </div>
                {/* Keep field in form state but hidden since it's standard text */}
                <input type="hidden" {...register("finalEvaluationRules")} />
              </div>
            </CardContent>
          </Card>
          </fieldset>
        </TabsContent>

        <TabsContent value="bibliografia" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <fieldset disabled={isReadOnly} className="contents">
          <Card className="border border-slate-200/80 shadow-xs rounded-xl overflow-hidden bg-white">
            <CardHeader className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base sm:text-lg font-bold text-[#102E52] leading-snug">Referências Bibliográficas</CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">Adicione as obras básicas e complementares para a disciplina.</CardDescription>
              </div>
              <div className="flex gap-2 self-start sm:self-auto">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 border-slate-200 text-[#023E8A] hover:bg-blue-50 font-bold text-xs h-8"
                    onClick={() => appendBib({ type: "basic", author: "Referência", title: "" })}
                >
                    <Plus className="w-3.5 h-3.5" />
                    Básica
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-50 font-bold text-xs h-8"
                    onClick={() => appendBib({ type: "complementary", author: "Referência", title: "" })}
                >
                    <Plus className="w-3.5 h-3.5" />
                    Complementar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {bibFields.map((field, index) => (
                <div key={field.id} className="space-y-4 p-4 border rounded-lg bg-slate-50/50 relative group">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 text-slate-400 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeBib(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>

                  <div className="flex items-center gap-2 mb-2">
                      <span className={cn(
                          "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full",
                          watch(`bibliography.${index}.type`) === 'basic' ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                      )}>
                          {watch(`bibliography.${index}.type`) === 'basic' ? 'Básica' : 'Complementar'}
                      </span>
                  </div>

                  <div className="space-y-2">
                    <Label>Referência Completa</Label>
                    <Textarea
                      {...register(`bibliography.${index}.title`)}
                      placeholder="Ex: FLEMMING, D. M.; GONÇALVES, M. B. Cálculo A. 6. ed. São Paulo..."
                      className="min-h-[80px] bg-white"
                    />
                    {/* Hidden author field to satisfy schema */}
                    <input type="hidden" {...register(`bibliography.${index}.author`)} />
                  </div>
                </div>
              ))}

              {bibFields.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed rounded-lg text-slate-400">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma referência adicionada.</p>
                </div>
              )}
            </CardContent>
          </Card>
          </fieldset>
        </TabsContent>
      </Tabs>

      <CopiarPlanoModal
        isOpen={modalCopiaAberto}
        onClose={() => setModalCopiaAberto(false)}
        onConfirm={handleCopiarCampos}
        planoAtualId={studyPlanId}
        disciplinaId={formData.courses?.[0]?.code}
        currentValues={currentValuesForCopy}
      />
    </div>
  );
}