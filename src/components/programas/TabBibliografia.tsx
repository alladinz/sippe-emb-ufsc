"use client";

import { Plus, BookOpen } from "lucide-react";
import type { EditorTabProps } from "./editorTypes";
import type { BibliografiaItem } from "../../types/programaEnsino";
import { BibliografiaItemEditor } from "./BibliografiaItemEditor";

export function TabBibliografia({ formState, updateField, isReadOnly }: EditorTabProps) {
  
  const addBibliografia = (tipo: 'basica' | 'complementar') => {
    if (isReadOnly) return;
    const newItem: BibliografiaItem = {
      id: crypto.randomUUID(),
      tipo,
      referencia: '',
      ordem: formState.bibliografia.filter(b => b.tipo === tipo).length,
    };
    updateField('bibliografia', [...formState.bibliografia, newItem]);
  };

  const updateBibliografia = (id: string, text: string) => {
    if (isReadOnly) return;
    updateField(
      'bibliografia',
      formState.bibliografia.map(b => b.id === id ? { ...b, referencia: text } : b)
    );
  };

  const removeBibliografia = (id: string) => {
    if (isReadOnly) return;
    updateField('bibliografia', formState.bibliografia.filter(b => b.id !== id));
  };

  const renderSection = (tipo: 'basica' | 'complementar', title: string, subtitle: string) => {
    const items = formState.bibliografia.filter(b => b.tipo === tipo).sort((a, b) => a.ordem - b.ordem);

    return (
      <div className="mb-8 last:mb-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800">{title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          </div>
          {!isReadOnly && (
            <button 
              onClick={() => addBibliografia(tipo)}
              className="flex items-center gap-1.5 text-xs text-[#023E8A] hover:text-[#023E8A] font-bold border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-6 text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/40">
            <BookOpen className="w-7 h-7 mx-auto mb-1.5 opacity-40 text-slate-400" />
            <p className="text-xs font-medium">Nenhuma referência {tipo === 'basica' ? 'básica' : 'complementar'} adicionada.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <BibliografiaItemEditor
                key={item.id}
                item={item}
                isReadOnly={isReadOnly}
                onChange={updateBibliografia}
                onRemove={removeBibliografia}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-[#102E52]">Referências Bibliográficas</h2>
        <p className="text-xs text-slate-500 mt-0.5">Bibliografias básicas e complementares da disciplina.</p>
      </div>

      {renderSection(
        'basica', 
        'Bibliografia Básica', 
        'Mínimo 3 obras. Devem estar disponíveis na biblioteca da instituição.'
      )}
      
      {renderSection(
        'complementar', 
        'Bibliografia Complementar', 
        'Obras de aprofundamento. Não obrigatórias na biblioteca.'
      )}
    </div>
  );
}
