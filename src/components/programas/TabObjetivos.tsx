"use client";

import { TiptapEditor } from "@/components/ui/tiptap-editor";
import type { EditorTabProps } from "./editorTypes";

export function TabObjetivos({ formState, updateField, isReadOnly }: EditorTabProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Objetivos</h2>
        <p className="text-sm text-gray-500">O que o aluno será capaz de fazer ao concluir a disciplina.</p>
      </div>

      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-700">Objetivo Geral e Específicos</label>
        <p className="text-xs text-gray-500 mt-1 mb-4">
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
