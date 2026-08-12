"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { programasEnsinoApi } from "@/services/programasEnsinoApi";
import { toastError, toastSuccess, confirmDialog } from "@/lib/swal";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ProgramaActionBar } from "@/components/programas/ProgramaActionBar";
import { SubmitProgramaModal } from "@/components/programas/SubmitProgramaModal";
import { HistoricoDrawer } from "@/components/programas/HistoricoDrawer";
import { TabIdentificacao } from "@/components/programas/TabIdentificacao";
import { TabCargaHoraria } from "@/components/programas/TabCargaHoraria";
import { TabEmenta } from "@/components/programas/TabEmenta";
import { TabObjetivos } from "@/components/programas/TabObjetivos";
import { TabConteudo } from "@/components/programas/TabConteudo";
import { TabAvaliacao } from "@/components/programas/TabAvaliacao";
import { TabBibliografia } from "@/components/programas/TabBibliografia";
import type { ProgramaEnsino } from "@/types/programaEnsino";
import type { ProgramaFormState } from "@/components/programas/editorTypes";
import { isProgramaEditable } from "@/utils/programaStatus";

const TABS = [
  { id: 'identificacao', label: 'Identificação' },
  { id: 'carga-horaria', label: 'Carga Horária' },
  { id: 'ementa',        label: 'Ementa' },
  { id: 'objetivos',     label: 'Objetivos' },
  { id: 'conteudo',      label: 'Conteúdo' },
  { id: 'avaliacao',     label: 'Avaliação' },
  { id: 'bibliografia',  label: 'Bibliografia' },
] as const;

type TabId = typeof TABS[number]['id'];

interface Props {
  id: string;
}

export function ProgramaEnsinoEditorClient({ id }: Props) {
  const router = useRouter();
  
  const [programa, setPrograma] = useState<ProgramaEnsino | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [formState, setFormState] = useState<ProgramaFormState>({
    codigo_disciplina: '',
    nome_disciplina: '',
    cursos_vinculados: [],
    carga_horaria_teorica: 0,
    carga_horaria_pratica: 0,
    carga_horaria_total: 0,
    creditos_teoricos: 0,
    creditos_praticos: 0,
    ementa: '',
    objetivos: '',
    conteudo_programatico: '',
    criterios_avaliacao: '',
    bibliografia: []
  });

  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [isDirty, setIsDirty] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>(undefined);

  const [activeTab, setActiveTab] = useState<TabId>('identificacao');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showHistorico, setShowHistorico] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);

    programasEnsinoApi.getById(id)
      .then(data => {
        setPrograma(data);
        initFormState(data);
      })
      .catch(err => {
        if (err.response?.status === 404) {
          setNotFound(true);
        } else {
          setHasError(true);
        }
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  function initFormState(p: ProgramaEnsino) {
    setFormState({
      codigo_disciplina:     p.codigo_disciplina ?? p.disciplina?.codigo ?? '',
      nome_disciplina:       p.nome_disciplina ?? p.disciplina?.nome ?? '',
      cursos_vinculados:     p.cursos_vinculados ?? p.disciplina?.graduacoes ?? [],
      carga_horaria_teorica: p.carga_horaria_teorica ?? 0,
      carga_horaria_pratica: p.carga_horaria_pratica ?? 0,
      carga_horaria_total:   p.carga_horaria_total ?? p.disciplina?.carga_horaria_total ?? 0,
      creditos_teoricos:     p.creditos_teoricos ?? p.disciplina?.creditos_teorico ?? 0,
      creditos_praticos:     p.creditos_praticos ?? p.disciplina?.creditos_pratico ?? 0,
      ementa:                p.ementa ?? '',
      objetivos:             p.objetivos ?? '',
      conteudo_programatico: p.conteudo_programatico ?? '',
      criterios_avaliacao:   p.criterios_avaliacao ?? '',
      bibliografia:          p.bibliografia ?? [],
    });
    // Reset dirty state when initializing
    setIsDirty(false);
  }

  // Watch formState changes and trigger autosave
  useEffect(() => {
    if (!programa || !isDirty || !isProgramaEditable(programa.status)) return;

    setSaveStatus('saving');
    clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const updateData = {
          codigo_disciplina:     formState.codigo_disciplina,
          nome_disciplina:       formState.nome_disciplina,
          cursos_vinculados:     formState.cursos_vinculados,
          carga_horaria_teorica: formState.carga_horaria_teorica,
          carga_horaria_pratica: formState.carga_horaria_pratica,
          carga_horaria_total:   formState.carga_horaria_total,
          creditos_teoricos:     formState.creditos_teoricos,
          creditos_praticos:     formState.creditos_praticos,
          ementa:                formState.ementa,
          objetivos:             formState.objetivos,
          conteudo_programatico: formState.conteudo_programatico,
          criterios_avaliacao:   formState.criterios_avaliacao,
          bibliografia:          formState.bibliografia,
        };
        await programasEnsinoApi.update(programa.id, updateData);
        setSaveStatus('saved');
        setIsDirty(false);
      } catch {
        setSaveStatus('error');
      }
    }, 1500);

    return () => clearTimeout(debounceRef.current);
  }, [formState, isDirty, programa]);

  function updateField<K extends keyof ProgramaFormState>(field: K, value: ProgramaFormState[K]) {
    setFormState(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }

  const handleDelete = async () => {
    if (!programa) return;
    const confirmed = await confirmDialog(
      'Excluir rascunho?',
      'Esta ação é permanente e não pode ser desfeita. O programa de ensino será removido do sistema.',
      'Excluir',
      'Cancelar',
      true
    );
    if (confirmed) {
      try {
        await programasEnsinoApi.delete(programa.id);
        router.push('/dashboard/programas-ensino');
        toastSuccess('Programa excluído.');
      } catch {
        toastError('Erro ao excluir o programa.');
      }
    }
  };

  const handleArchive = async () => {
    if (!programa) return;
    const confirmed = await confirmDialog(
      'Arquivar programa?',
      'O programa será arquivado e ficará disponível para consulta. Esta ação não pode ser desfeita.',
      'Arquivar',
      'Cancelar',
      false
    );
    if (confirmed) {
      try {
        const updated = await programasEnsinoApi.archive(programa.id);
        setPrograma(updated);
        toastSuccess('Programa arquivado com sucesso.');
      } catch {
        toastError('Erro ao arquivar o programa.');
      }
    }
  };

  const handleVisualizar = () => {
    if (!programa) return;
    router.push(`/dashboard/programas-ensino/${programa.id}/visualizar`);
  };

  const handlePreSubmit = () => {
    if (!formState.ementa?.trim()) {
      toastError('Preencha a Ementa antes de submeter.');
      setActiveTab('ementa');
      return;
    }
    if (!formState.objetivos?.trim()) {
      toastError('Preencha os Objetivos antes de submeter.');
      setActiveTab('objetivos');
      return;
    }
    if (!formState.conteudo_programatico?.trim()) {
      toastError('Preencha o Conteúdo Programático.');
      setActiveTab('conteudo');
      return;
    }
    
    setShowSubmitModal(true);
  };

  const handleSubmitConfirm = async (cursoAprovacao: string) => {
    if (!programa) return;
    try {
      const updated = await programasEnsinoApi.submit(programa.id, { curso_aprovacao: cursoAprovacao });
      setPrograma(updated);
      toastSuccess('Programa submetido para aprovação.');
    } catch {
      toastError('Erro ao submeter o programa.');
    }
  };

  function getTabStatus(tab: TabId): 'complete' | 'partial' | 'empty' {
    switch (tab) {
      case 'identificacao':
        const idFields = [
          formState.codigo_disciplina,
          formState.nome_disciplina,
          formState.cursos_vinculados.length > 0 ? 'filled' : '',
        ];
        const idFilled = idFields.filter(Boolean).length;
        return idFilled === 3 ? 'complete' : idFilled > 0 ? 'partial' : 'empty';

      case 'carga-horaria':
        const chFilled = [
          formState.carga_horaria_total > 0,
          formState.creditos_teoricos > 0 || formState.creditos_praticos > 0,
        ].filter(Boolean).length;
        return chFilled === 2 ? 'complete' : chFilled > 0 ? 'partial' : 'empty';

      case 'ementa':
        return formState.ementa?.trim().length > 20 ? 'complete' : formState.ementa?.trim().length > 0 ? 'partial' : 'empty';

      case 'objetivos':
        return formState.objetivos?.trim().length > 20 ? 'complete' : formState.objetivos?.trim().length > 0 ? 'partial' : 'empty';

      case 'conteudo':
        return formState.conteudo_programatico?.trim().length > 50 ? 'complete' : formState.conteudo_programatico?.trim().length > 0 ? 'partial' : 'empty';

      case 'avaliacao':
        return formState.criterios_avaliacao?.trim().length > 20 ? 'complete' : formState.criterios_avaliacao?.trim().length > 0 ? 'partial' : 'empty';

      case 'bibliografia':
        const basicas = formState.bibliografia.filter(b => b.tipo === 'basica').length;
        const comp = formState.bibliografia.filter(b => b.tipo === 'complementar').length;
        return basicas > 0 && comp > 0 ? 'complete' : basicas > 0 || comp > 0 ? 'partial' : 'empty';

      default: return 'empty';
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
        <div className="h-24 w-full bg-slate-200 rounded animate-pulse" />
        <div className="flex gap-4 border-b pb-2">
          {[1,2,3,4,5,6,7].map(i => <div key={i} className="h-8 w-24 bg-slate-200 rounded animate-pulse" />)}
        </div>
        <div className="h-96 w-full bg-slate-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="text-center py-16 px-4">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Programa não encontrado</h2>
        <p className="text-slate-500 mb-6">O programa de ensino que você tentou acessar não existe ou foi excluído.</p>
        <button onClick={() => router.push('/dashboard/programas-ensino')} className="bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-blue/90 font-medium">
          Voltar para lista
        </button>
      </div>
    );
  }

  if (hasError || !programa) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-slate-800">Erro ao carregar programa</h2>
        <button onClick={() => window.location.reload()} className="mt-4 text-brand-blue hover:underline">
          Tentar novamente
        </button>
      </div>
    );
  }

  const readOnly = !isProgramaEditable(programa.status);

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/programas-ensino">Programas de Ensino</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{programa.nome_disciplina || 'Editor'}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Programa de Ensino</h1>
        <p className="text-sm text-gray-500 mt-1">
          {readOnly 
            ? 'Este programa não pode ser editado no momento.'
            : 'As alterações são salvas automaticamente enquanto você edita.'}
        </p>
      </div>

      <ProgramaActionBar
        programa={programa}
        saveStatus={saveStatus}
        onDelete={handleDelete}
        onSubmit={handlePreSubmit}
        onArchive={handleArchive}
        onHistory={() => setShowHistorico(true)}
        onVisualizar={handleVisualizar}
      />

      <div className="mt-6 border-b border-gray-200 overflow-x-auto">
        <div className="flex space-x-1 min-w-max pb-px">
          {TABS.map(tab => {
            const tabStatus = getTabStatus(tab.id);
            const dotColor = tabStatus === 'complete' ? 'bg-green-500' :
                             tabStatus === 'partial'  ? 'bg-yellow-400' : 'bg-gray-200';
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                  isActive 
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 border-b-2 border-transparent'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`block w-1.5 h-1.5 rounded-full mx-auto mt-1 transition-colors duration-300 ${dotColor}`} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        {activeTab === 'identificacao' && <TabIdentificacao formState={formState} updateField={updateField} isReadOnly={readOnly} />}
        {activeTab === 'carga-horaria' && <TabCargaHoraria formState={formState} updateField={updateField} isReadOnly={readOnly} />}
        {activeTab === 'ementa'        && <TabEmenta formState={formState} updateField={updateField} isReadOnly={readOnly} />}
        {activeTab === 'objetivos'     && <TabObjetivos formState={formState} updateField={updateField} isReadOnly={readOnly} />}
        {activeTab === 'conteudo'      && <TabConteudo formState={formState} updateField={updateField} isReadOnly={readOnly} />}
        {activeTab === 'avaliacao'     && <TabAvaliacao formState={formState} updateField={updateField} isReadOnly={readOnly} />}
        {activeTab === 'bibliografia'  && <TabBibliografia formState={formState} updateField={updateField} isReadOnly={readOnly} />}
      </div>

      {showSubmitModal && (
        <SubmitProgramaModal
          cursos={programa.cursos_vinculados || []}
          onClose={() => setShowSubmitModal(false)}
          onConfirm={async (curso) => {
            await handleSubmitConfirm(curso);
            setShowSubmitModal(false);
          }}
        />
      )}

      {showHistorico && (
        <HistoricoDrawer
          programaId={programa.id}
          onClose={() => setShowHistorico(false)}
        />
      )}
    </div>
  );
}
