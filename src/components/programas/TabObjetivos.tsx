"use client";

import { TiptapEditor } from "@/components/ui/tiptap-editor";
import type { EditorTabProps } from "./editorTypes";

export function TabObjetivos({ formState, updateField, isReadOnly }: EditorTabProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-[#102E52]">Objetivos</h2>
        <p className="text-xs text-slate-500 mt-0.5">O que o aluno será capaz de fazer ao concluir a disciplina.</p>
      </div>

      <div className="mb-2">
        <label className="block text-xs font-bold text-slate-700">Objetivo Geral e Específicos</label>
        <p className="text-xs text-slate-500 mt-0.5 mb-3">
          Descreva em uma frase o propósito central da disciplina. Inclua o objetivo geral e os específicos, separando com tópicos ou numeração.
        </p>
      </div>

      <div className="min-h-[300px]">
        <TiptapEditor
          value={formState.objetivos || ''}
          onChange={(val) => updateField('objetivos', val)}
          disabled={isReadOnly}
          placeholder="Escreva os objetivos aqui..."
        />
      </div>
    </div>
  );
}
