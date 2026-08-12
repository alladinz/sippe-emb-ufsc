"use client";

import { Plus, Trash2, BookOpen } from "lucide-react";
import type { EditorTabProps } from "./editorTypes";
import type { BibliografiaItem } from "../../types/programaEnsino";

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
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-500">{subtitle}</p>
          </div>
          {!isReadOnly && (
            <button 
              onClick={() => addBibliografia(tipo)}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-6 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">Nenhuma referência {tipo === 'basica' ? 'básica' : 'complementar'} adicionada.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex-1">
                  <span className={`text-xs font-semibold uppercase tracking-wide ${item.tipo === 'basica' ? 'text-blue-600' : 'text-gray-500'}`}>
                    {item.tipo === 'basica' ? 'Básica' : 'Complementar'}
                  </span>
                  <textarea
                    value={item.referencia}
                    onChange={e => updateBibliografia(item.id, e.target.value)}
                    disabled={isReadOnly}
                    rows={2}
                    placeholder="SOBRENOME, Nome. Título da obra. Edição. Local: Editora, Ano."
                    className="mt-1 w-full text-sm text-gray-800 bg-transparent border-none resize-none focus:outline-none focus:ring-0 p-0 placeholder:text-gray-400 disabled:text-gray-500"
                  />
                </div>
                {!isReadOnly && (
                  <button 
                    onClick={() => removeBibliografia(item.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 mt-0.5"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Referências Bibliográficas</h2>
        <p className="text-sm text-gray-500">Bibliografias básicas e complementares da disciplina.</p>
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
