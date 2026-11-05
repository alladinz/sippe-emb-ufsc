"use client";

import { AlertTriangle } from "lucide-react";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import type { EditorTabProps } from "./editorTypes";

export function TabAvaliacao({ formState, updateField, isReadOnly }: EditorTabProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-[#102E52]">Critérios Institucionais de Avaliação</h2>
        <p className="text-xs text-slate-500 mt-0.5">Métodos e critérios de avaliação definidos pela instituição.</p>
      </div>

      <div className="flex items-start gap-2 p-3 bg-amber-50/80 border border-amber-200/70 rounded-xl mb-6 text-xs text-amber-800">
        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
        Os critérios de avaliação devem estar em conformidade com o Regulamento dos Cursos de Graduação da UFSC. Consulte a norma vigente antes de preencher este campo.
      </div>

      <div className="min-h-[250px]">
        <TiptapEditor
          value={formState.criterios_avaliacao || ''}
          onChange={(val) => updateField('criterios_avaliacao', val)}
          disabled={isReadOnly}
          placeholder="Descreva a forma de avaliação..."
        />
      </div>

      <div className="mt-2">
        <p className="text-xs text-gray-500">
          Descreva os instrumentos de avaliação, pesos, frequência mínima e critérios de recuperação conforme normas institucionais.
        </p>
      </div>
    </div>
  );
}
