"use client";

import { useState, useEffect, useTransition, useRef, useMemo, useCallback } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { useDebounce } from "use-debounce";
import { studyPlanSchema, type StudyPlanFormValues } from "@/lib/schemas/study-plan";
import { type ZodIssue } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Check, CloudUpload, Plus, Eye, Send, BookOpen, AlertCircle, Info, ArrowLeft, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
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

export function StudyPlanForm({ initialData, studyPlanId, onSave, onSubmit, semesterDates }: StudyPlanFormProps) {
  const [isPending, startTransition] = useTransition();
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [modalCopiaAberto, setModalCopiaAberto] = useState(false);
  const [activeTab, setActiveTab] = useState("identificacao");
  const [mounted, setMounted] = useState(false);

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

  const fullDefaultValues = useMemo(() => ({
    ...initialData,
    universityAcronym: initialData.universityAcronym || "UFSC",
    campus: initialData.campus || "Campus de Joinville",
    center: initialData.center || "Centro Tecnológico de Joinville",
    finalEvaluationRules: initialData.finalEvaluationRules || DEFAULT_FINAL_EVALUATION,
    courses: initialData.courses || [],
    bibliography: initialData.bibliography || [],
    schedule: initialSchedule,
    weeklySchedule: initialWeeklySchedule
  }), [initialData, initialSchedule, initialWeeklySchedule]);

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

  const selectedDays = watch("schedule") || [];
  const numSelectedDays = selectedDays.filter(s => s.enabled).length;
  const hasMoreThanOneDay = numSelectedDays > 1;

  const { fields: weeklyScheduleFields } = useFieldArray({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    control: control as any,
    name: "weeklySchedule",
  });

  const { fields: bibFields } = useFieldArray({
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

  const saveFormProgress = useCallback(async (data: StudyPlanFormValues) => {
    const dataStr = JSON.stringify(data);
    const lastStr = JSON.stringify(lastSavedDataRef.current);
    if (dataStr === lastStr) return;

    startTransition(async () => {
      try {
        await onSave(data);
        lastSavedDataRef.current = data;
        setLastSaved(new Date());
      } catch (error) {
        console.error("Auto-save failed:", error);
      }
    });
  }, [onSave]);

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
    saveFormProgress(debouncedData);
  }, [debouncedData, mounted, saveFormProgress]);

  const onFinalSubmit = async () => {
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
          'Cancelar',
          false
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
    const selectedDaysList = formData.schedule?.filter(s => s.enabled).map(s => s.day) || [];
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

        // Every week in the semester range gets a row
        weeks.push({
            week: weekNum.toString(),
            class1: { number: weekClasses[0] ? formatDate(weekClasses[0]) : "-", content: "" },
            class2: { number: weekClasses[1] ? formatDate(weekClasses[1]) : "-", content: "" }
        });
        
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
    
    toastSuccess("Campos copiados com sucesso!");
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    saveFormProgress(getValues());
  };

  const handlePreviewClick = () => {
    saveFormProgress(getValues());
  };

  const isReadOnly = initialData.status !== "draft" && initialData.status !== "rejected";

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <CopiarPlanoModal 
        isOpen={modalCopiaAberto} 
        onClose={() => setModalCopiaAberto(false)} 
        onConfirm={handleCopiarCampos}
        planoAtualId={studyPlanId}
        disciplinaId={formData.courses?.[0]?.code}
        currentValues={{
            objectives: formData.objectives || undefined,
            programContent: formData.programContent || undefined,
            methodology: formData.methodology || undefined,
            evaluation: formData.evaluation || undefined,
            evaluationFormula: formData.evaluationFormula || undefined,
        }}
      />

      {/* Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/study-plans">
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
                <Badge variant={isReadOnly ? "secondary" : "outline"} className="capitalize">
                    {initialData.status === 'draft' ? 'Rascunho' : 
                     initialData.status === 'submitted' ? 'Submetido' :
                     initialData.status === 'approved' ? 'Aprovado' :
                     initialData.status === 'rejected' ? 'Rejeitado' : initialData.status}
                </Badge>
                {lastSaved && (
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Salvo às {lastSaved.toLocaleTimeString()}
                    </span>
                )}
                {isPending && (
                    <span className="text-[10px] text-brand-blue animate-pulse flex items-center gap-1">
                        <CloudUpload className="w-3 h-3" />
                        Salvando...
                    </span>
                )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
            {!isReadOnly && (
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 h-9 border-slate-200"
                    onClick={() => setModalCopiaAberto(true)}
                >
                    <BookOpen className="w-4 h-4" />
                    Copiar de outro Plano
                </Button>
            )}
            
            <Link href={`/dashboard/study-plans/${studyPlanId}/preview`} target="_blank" onClick={handlePreviewClick}>
                <Button variant="outline" size="sm" className="gap-2 h-9 border-slate-200">
                    <Eye className="w-4 h-4" />
                    Visualizar PDF
                </Button>
            </Link>

            {!isReadOnly && (
                <Button 
                    size="sm" 
                    className="gap-2 h-9 bg-brand-blue hover:bg-brand-blue/90 text-white px-4"
                    onClick={onFinalSubmit}
                >
                    <Send className="w-4 h-4" />
                    Submeter para Revisão
                </Button>
            )}
            
            {!isReadOnly && (
                <DeletePlanButton id={studyPlanId} shouldRedirect={true} variant="full" className="h-9" />
            )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="bg-white border p-1 h-12 shadow-sm rounded-lg mb-8 flex justify-start w-fit">
                <TabsTrigger value="identificacao" className="px-6 py-2 text-sm font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-lg">Identificação</TabsTrigger>
                <TabsTrigger value="conteudo" className="px-6 py-2 text-sm font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-lg">Conteúdo</TabsTrigger>
                <TabsTrigger value="pedagogia" className="px-6 py-2 text-sm font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-lg">Metodologia</TabsTrigger>
                <TabsTrigger value="bibliografia" className="px-6 py-2 text-sm font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-lg">Bibliografia</TabsTrigger>
                <TabsTrigger value="cronograma" className="px-6 py-2 text-sm font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-lg">Cronograma</TabsTrigger>
                <TabsTrigger value="avaliacao" className="px-6 py-2 text-sm font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-lg">Avaliação</TabsTrigger>
        </TabsList>

        <TabsContent value="identificacao" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <fieldset disabled={isReadOnly} className="contents">
          <Card className="border-slate-200 shadow-sm rounded-md">
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="text-xl">Dados de Identificação</CardTitle>
              <CardDescription>Informações básicas da instituição e da disciplina.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
              {/* Institutional Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1 h-4 bg-brand-blue rounded-full" />
                    Instituição
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <span className="w-1 h-4 bg-brand-blue rounded-full" />
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
          <Card className="border-slate-200 shadow-sm rounded-md">
            <CardHeader className="border-b bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Conteúdo Acadêmico</CardTitle>
                  <CardDescription>Ementa, objetivos e conteúdo programático da disciplina.</CardDescription>
                </div>
                {!isReadOnly && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-bold uppercase tracking-wider">
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
                      disabled={isReadOnly}
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
                      disabled={isReadOnly}
                    />
                  )}
                />
              </div>
            </CardContent>
          </Card>
          </fieldset>
        </TabsContent>

        <TabsContent value="pedagogia" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <fieldset disabled={isReadOnly} className="contents">
          <Card className="border-slate-200 shadow-sm rounded-md">
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="text-xl">Metodologia e Avaliação</CardTitle>
              <CardDescription>Como a disciplina será ministrada e avaliada.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="methodology">Metodologia de Ensino</Label>
                <Controller
                  name="methodology"
                  control={control}
                  render={({ field }) => (
                    <TiptapEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                      disabled={isReadOnly}
                    />
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="evaluation">Processo de Avaliação</Label>
                <Controller
                  name="evaluation"
                  control={control}
                  render={({ field }) => (
                    <TiptapEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                      disabled={isReadOnly}
                    />
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="evaluationFormula">Fórmula de Cálculo da Média</Label>
                <Controller
                  name="evaluationFormula"
                  control={control}
                  render={({ field }) => (
                    <TiptapEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                      disabled={isReadOnly}
                      placeholder="Ex: MF = (P1 + P2) / 2"
                    />
                  )}
                />
              </div>
            </CardContent>
          </Card>
          </fieldset>
        </TabsContent>

        <TabsContent value="bibliografia" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <fieldset disabled={isReadOnly} className="contents">
          <Card className="border-slate-200 shadow-sm rounded-md">
            <CardHeader className="border-b bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div>
                    <CardTitle className="text-xl">Bibliografia</CardTitle>
                    <CardDescription>Referências básicas e complementares.</CardDescription>
                </div>
                {!isReadOnly && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-bold uppercase tracking-wider">
                        <Info className="w-3.5 h-3.5" />
                        Campos Gerenciados pelo Departamento
                    </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              {/* Basic Bib */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1 h-4 bg-brand-blue rounded-full" />
                    Básica
                </h3>
                <div className="space-y-3">
                  {bibFields.filter((f) => (f as unknown as { type: string }).type === "basic").map((field, index) => (
                    <div key={field.id} className="flex gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200 group">
                      <div className="flex-1 space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <Input 
                                {...register(`bibliography.${index}.author`)} 
                                placeholder="Autor" 
                                className="h-8 bg-transparent"
                                readOnly
                            />
                            <Input 
                                {...register(`bibliography.${index}.title`)} 
                                placeholder="Título" 
                                className="h-8 bg-transparent"
                                readOnly
                            />
                        </div>
                      </div>
                    </div>
                  ))}
                  {bibFields.filter((f) => (f as unknown as { type: string }).type === "basic").length === 0 && (
                      <p className="text-sm text-slate-400 italic">Nenhuma bibliografia básica cadastrada.</p>
                  )}
                </div>
              </div>

              {/* Complementary Bib */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1 h-4 bg-brand-blue rounded-full" />
                    Complementar
                </h3>
                <div className="space-y-3">
                  {bibFields.filter((f) => (f as unknown as { type: string }).type === "complementary").map((field, index) => (
                    <div key={field.id} className="flex gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200 group">
                      <div className="flex-1 space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <Input 
                                {...register(`bibliography.${index}.author`)} 
                                placeholder="Autor" 
                                className="h-8 bg-transparent"
                                readOnly
                            />
                            <Input 
                                {...register(`bibliography.${index}.title`)} 
                                placeholder="Título" 
                                className="h-8 bg-transparent"
                                readOnly
                            />
                        </div>
                      </div>
                    </div>
                  ))}
                  {bibFields.filter((f) => (f as unknown as { type: string }).type === "complementary").length === 0 && (
                      <p className="text-sm text-slate-400 italic">Nenhuma bibliografia complementar cadastrada.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          </fieldset>
        </TabsContent>

        <TabsContent value="cronograma" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <fieldset disabled={isReadOnly} className="contents">
          <Card className="border-slate-200 shadow-sm rounded-md">
            <CardHeader className="border-b bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div>
                    <CardTitle className="text-xl">Cronograma de Aulas</CardTitle>
                    <CardDescription>
                        Planejamento semanal das aulas e conteúdos.
                    </CardDescription>
                </div>
                {!isReadOnly && (
                    <Button 
                        type="button" 
                        variant="default" 
                        size="sm" 
                        className="gap-2 bg-brand-blue hover:bg-brand-blue"
                        onClick={handleGenerateSchedule}
                    >
                        <RefreshCcw className="w-4 h-4" />
                        Gerar Cronograma
                    </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {!isReadOnly && (
                  <>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6 flex gap-3">
                      <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-800 leading-relaxed">
                          <strong>Instruções para geração do cronograma:</strong>
                          <p className="mt-1">
                              Para organizar o cronograma de aulas em conformidade com o calendário acadêmico, siga estas etapas:
                          </p>
                          <ol className="list-decimal ml-5 mt-2 space-y-1">
                              <li>Selecione abaixo os dias da semana em que as aulas da disciplina ocorrerão.</li>
                              <li>Clique no botão <strong>&quot;Gerar Cronograma&quot;</strong> localizado no cabeçalho desta seção.</li>
                              <li>O sistema distribuirá automaticamente as datas das aulas ao longo de todas as semanas do semestre letivo.</li>
                          </ol>
                      </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <Label className="text-sm font-bold text-slate-700 block mb-3">Selecione os dias da semana com aula:</Label>
                      <div className="flex flex-wrap gap-4">
                          {DAYS_OF_WEEK.map((day, index) => (
                              <div key={day} className="flex items-center gap-2">
                                  <Checkbox 
                                      id={`day-select-${index}`}
                                      checked={watch(`schedule.${index}.enabled`)}
                                      onCheckedChange={(checked) => {
                                          setValue(`schedule.${index}.enabled`, !!checked, { shouldDirty: true });
                                      }}
                                  />
                                  <Label htmlFor={`day-select-${index}`} className="text-xs cursor-pointer">{day}</Label>
                              </div>
                          ))}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-3 italic">
                          * As datas serão geradas automaticamente entre o início e fim do semestre configurado.
                      </p>
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
                            saveFormProgress(getValues());
                          }}
                          className="h-8 text-center border-transparent focus:border-brand-blue bg-transparent"
                        />
                      </TableCell>
                      <TableCell className="border-l">
                        <Input 
                          {...register(`weeklySchedule.${index}.class1.content`)} 
                          onBlur={async (e) => {
                            await register(`weeklySchedule.${index}.class1.content`).onBlur(e);
                            saveFormProgress(getValues());
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
                                saveFormProgress(getValues());
                              }}
                              className="h-8 text-center border-transparent focus:border-brand-blue bg-transparent"
                            />
                          </TableCell>
                          <TableCell className="border-l">
                            <Input 
                              {...register(`weeklySchedule.${index}.class2.content`)} 
                              onBlur={async (e) => {
                                await register(`weeklySchedule.${index}.class2.content`).onBlur(e);
                                saveFormProgress(getValues());
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
          <Card className="border-slate-200 shadow-sm rounded-md">
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="text-xl">Informações de Reprovação e Segunda Chamada</CardTitle>
              <CardDescription>Regras e procedimentos padrão da universidade.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="finalEvaluationRules">Regras de Recuperação e Frequência</Label>
                <Controller
                  name="finalEvaluationRules"
                  control={control}
                  render={({ field }) => (
                    <TiptapEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                      disabled={isReadOnly}
                    />
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="finalConsiderations">Considerações Finais</Label>
                <Controller
                  name="finalConsiderations"
                  control={control}
                  render={({ field }) => (
                    <TiptapEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                      disabled={isReadOnly}
                    />
                  )}
                />
              </div>
            </CardContent>
          </Card>
          </fieldset>
        </TabsContent>
      </Tabs>
    </div>
  );
}
