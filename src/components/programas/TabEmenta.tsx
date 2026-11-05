"use client";

import { TiptapEditor } from "@/components/ui/tiptap-editor";
import type { EditorTabProps } from "./editorTypes";

function stripHtml(html: string) {
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

export function TabEmenta({ formState, updateField, isReadOnly }: EditorTabProps) {
  const ementaLength = stripHtml(formState.ementa || '').length;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-[#102E52]">Ementa</h2>
        <p className="text-xs text-slate-500 mt-0.5">Descrição resumida do conteúdo e abordagem da disciplina.</p>
      </div>

      <div className="mb-2">
        <label className="block text-xs font-bold text-slate-700">Ementa da Disciplina</label>
      </div>

      <div className="min-h-[200px]">
        <TiptapEditor
          value={formState.ementa || ''}
          onChange={(val) => updateField('ementa', val)}
          disabled={isReadOnly}
          placeholder="Digite a ementa aqui..."
        />
      </div>

      <div className="flex justify-between mt-2">
        <p className="text-xs text-gray-500">
          A ementa é uma síntese dos principais temas abordados. Deve ser concisa (3–8 linhas) e refletir o conteúdo oficial da disciplina no PPC.
        </p>
        <span className="text-xs text-gray-400 text-right whitespace-nowrap ml-4">
          {ementaLength} caracteres
        </span>
      </div>
    </div>
  );
}
