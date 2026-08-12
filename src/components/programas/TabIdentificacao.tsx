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
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Informações da Disciplina</h2>
        <p className="text-sm text-gray-500">Dados institucionais da disciplina. Pré-preenchidos automaticamente — edite se necessário.</p>
      </div>

      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg mb-6 text-xs text-blue-700">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        Estes campos foram pré-preenchidos com os dados da disciplina cadastrada no sistema. Edite apenas se houver divergência.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Código da Disciplina</label>
          <input
            type="text"
            value={formState.codigo_disciplina}
            readOnly
            disabled
            className="w-full px-3 py-2 border rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Disciplina</label>
          <input
            type="text"
            value={formState.nome_disciplina}
            onChange={(e) => updateField('nome_disciplina', e.target.value)}
            disabled={isReadOnly}
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Cursos Vinculados (Graduações / PPC)</label>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_COURSES.map(course => {
            const isSelected = formState.cursos_vinculados.includes(course);
            return (
              <button
                key={course}
                onClick={() => toggleCourse(course)}
                disabled={isReadOnly}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors border ${
                  isSelected 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
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
