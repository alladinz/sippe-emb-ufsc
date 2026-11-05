"use client";

import { TiptapEditor } from "@/components/ui/tiptap-editor";
import type { EditorTabProps } from "./editorTypes";

export function TabConteudo({ formState, updateField, isReadOnly }: EditorTabProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-[#102E52]">Conteúdo Programático</h2>
        <p className="text-xs text-slate-500 mt-0.5">Relação detalhada dos tópicos abordados na disciplina.</p>
      </div>

      <div className="min-h-[400px]">
        <TiptapEditor
          value={formState.conteudo_programatico || ''}
          onChange={(val) => updateField('conteudo_programatico', val)}
          disabled={isReadOnly}
          placeholder="1. Tópico principal&#10;1.1. Subtópico..."
        />
      </div>

      <div className="mt-2">
        <p className="text-xs text-gray-500">
          Liste os tópicos em ordem cronológica de abordagem. Use numeração hierárquica (1., 1.1., 1.1.1.) para organizar os conteúdos.
        </p>
      </div>
    </div>
  );
}
