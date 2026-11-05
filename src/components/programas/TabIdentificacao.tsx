"use client";

import { Info } from "lucide-react";
import type { EditorTabProps } from "./editorTypes";

const AVAILABLE_COURSES = [
  'Ciência e Tecnologia',
  'Engenharia Aeroespacial',
  'Engenharia Automotiva',
  'Engenharia Civil de Infraestrutura',
  'Engenharia Ferroviária e Metroviária',
  'Engenharia Mecatrônica',
  'Engenharia Naval',
  'Engenharia de Transportes e Logística',
  'Geral'
];

export function TabIdentificacao({ formState, updateField, isReadOnly }: EditorTabProps) {
  const toggleCourse = (course: string) => {
    if (isReadOnly) return;
    const isSelected = formState.cursos_vinculados.includes(course);
    if (isSelected) {
      updateField('cursos_vinculados', formState.cursos_vinculados.filter(c => c !== course));
    } else {
      updateField('cursos_vinculados', [...formState.cursos_vinculados, course]);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-[#102E52]">Informações da Disciplina</h2>
        <p className="text-xs text-slate-500 mt-0.5">Dados institucionais da disciplina. Pré-preenchidos automaticamente — edite se necessário.</p>
      </div>

      <div className="flex items-start gap-2 p-3 bg-blue-50/70 border border-blue-100 rounded-xl mb-6 text-xs text-[#023E8A]">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#023E8A]" />
        Estes campos foram pré-preenchidos com os dados da disciplina cadastrada no sistema. Edite apenas se houver divergência.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Código da Disciplina</label>
          <input
            type="text"
            value={formState.codigo_disciplina}
            readOnly
            disabled
            className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 font-mono text-xs text-slate-500 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Nome da Disciplina</label>
          <input
            type="text"
            value={formState.nome_disciplina}
            onChange={(e) => updateField('nome_disciplina', e.target.value)}
            disabled={isReadOnly}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-[#023E8A] focus:border-transparent outline-none disabled:bg-slate-50 disabled:text-slate-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-2">Cursos Vinculados (Graduações / PPC)</label>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_COURSES.map(course => {
            const isSelected = formState.cursos_vinculados.includes(course);
            return (
              <button
                key={course}
                onClick={() => toggleCourse(course)}
                disabled={isReadOnly}
                className={`px-3 py-1.5 text-xs rounded-full transition-all border font-bold ${
                  isSelected
                    ? 'bg-[#023E8A] text-white border-[#023E8A]'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                } ${isReadOnly ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {course}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
