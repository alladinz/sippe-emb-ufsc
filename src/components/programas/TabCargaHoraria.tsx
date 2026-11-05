"use client";

import { Info } from "lucide-react";
import { useEffect } from "react";
import type { EditorTabProps } from "./editorTypes";

export function TabCargaHoraria({ formState, updateField, isReadOnly }: EditorTabProps) {
  useEffect(() => {
    const total = Number(formState.carga_horaria_teorica || 0) + Number(formState.carga_horaria_pratica || 0) + Number(formState.carga_horaria_extensao || 0);
    if (total !== formState.carga_horaria_total) {
      updateField('carga_horaria_total', total);
    }
  }, [formState.carga_horaria_teorica, formState.carga_horaria_pratica, formState.carga_horaria_extensao, formState.carga_horaria_total, updateField]);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-[#102E52]">Carga Horária e Créditos</h2>
        <p className="text-xs text-slate-500 mt-0.5">Distribuição de horas e créditos da disciplina.</p>
      </div>

      <div className="flex items-start gap-2 p-3 bg-blue-50/70 border border-blue-100 rounded-xl mb-6 text-xs text-[#023E8A]">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#023E8A]" />
        Pré-preenchidos com base nos dados importados da planilha. Verifique e corrija se necessário.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Carga Horária Teórica (h)</label>
          <div className="relative">
            <input
              type="number"
              min={0}
              max={999}
              value={formState.carga_horaria_teorica}
              onChange={(e) => updateField('carga_horaria_teorica', parseInt(e.target.value) || 0)}
              disabled={isReadOnly}
              className="w-full pl-3 pr-8 py-2 border rounded-md text-center focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">h</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Carga Horária Prática (h)</label>
          <div className="relative">
            <input
              type="number"
              min={0}
              max={999}
              value={formState.carga_horaria_pratica}
              onChange={(e) => updateField('carga_horaria_pratica', parseInt(e.target.value) || 0)}
              disabled={isReadOnly}
              className="w-full pl-3 pr-8 py-2 border rounded-md text-center focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">h</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Carga Horária de Extensão (h)</label>
          <div className="relative">
            <input
              type="number"
              min={0}
              max={999}
              value={formState.carga_horaria_extensao}
              onChange={(e) => updateField('carga_horaria_extensao', parseInt(e.target.value) || 0)}
              disabled={isReadOnly}
              className="w-full pl-3 pr-8 py-2 border rounded-md text-center focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">h</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Carga Horária Total (h)</label>
          <div className="relative">
            <input
              type="number"
              value={formState.carga_horaria_total}
              readOnly
              className="w-full pl-3 pr-8 py-2 border rounded-md text-center bg-gray-100 text-gray-600 font-medium cursor-not-allowed"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">h</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Créditos Teóricos</label>
          <input
            type="number"
            min={0}
            max={20}
            value={formState.creditos_teoricos}
            onChange={(e) => updateField('creditos_teoricos', parseInt(e.target.value) || 0)}
            disabled={isReadOnly}
            className="w-full px-3 py-2 border rounded-md text-center focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Créditos Práticos</label>
          <input
            type="number"
            min={0}
            max={20}
            value={formState.creditos_praticos}
            onChange={(e) => updateField('creditos_praticos', parseInt(e.target.value) || 0)}
            disabled={isReadOnly}
            className="w-full px-3 py-2 border rounded-md text-center focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Créditos de Extensão</label>
          <input
            type="number"
            min={0}
            max={20}
            value={formState.creditos_extensao}
            onChange={(e) => updateField('creditos_extensao', parseInt(e.target.value) || 0)}
            disabled={isReadOnly}
            className="w-full px-3 py-2 border rounded-md text-center focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Total de Créditos</label>
          <input
            type="number"
            value={(Number(formState.creditos_teoricos) || 0) + (Number(formState.creditos_praticos) || 0) + (Number(formState.creditos_extensao) || 0)}
            readOnly
            className="w-full px-3 py-2 border rounded-md text-center bg-gray-100 text-gray-600 font-medium cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );
}
