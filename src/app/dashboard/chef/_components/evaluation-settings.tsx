"use client";

import { useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toastSuccess, toastError, toastInfo } from "@/lib/swal";
import { updateSystemSettingAction } from "../actions";
import { parseBoldMarkers } from "@/utils/bibliografiaUtils";
import { Sliders, Bold, Sparkles } from "lucide-react";

interface EvaluationSettingsProps {
    initialValue: string;
    initialProgramaValue: string;
}

export function EvaluationSettings({ initialValue, initialProgramaValue }: EvaluationSettingsProps) {
    const [value, setValue] = useState(initialValue);
    const [programaValue, setProgramaValue] = useState(initialProgramaValue);
    const [isSavingPlanos, setIsSavingPlanos] = useState(false);
    const [isSavingProgramas, setIsSavingProgramas] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const textareaProgramaRef = useRef<HTMLTextAreaElement>(null);

    const handleBoldToggle = (
        ref: React.RefObject<HTMLTextAreaElement | null>,
        currentValue: string,
        setter: (v: string) => void
    ) => {
        const textarea = ref.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        if (start !== end) {
            const before = currentValue.substring(0, start);
            const selected = currentValue.substring(start, end);
            const after = currentValue.substring(end);

            if (selected.startsWith('**') && selected.endsWith('**')) {
                const unwrapped = selected.slice(2, -2);
                setter(before + unwrapped + after);
            } else {
                const clean = selected.replace(/\*\*/g, '');
                setter(before + `**${clean}**` + after);
            }
        } else {
            toastInfo("Selecione um trecho do texto para aplicar o negrito.");
        }
    };

    const handleSave = async (key: string, val: string, type: 'planos' | 'programas') => {
        try {
            if (type === 'planos') setIsSavingPlanos(true);
            else setIsSavingProgramas(true);

            await updateSystemSettingAction(key, val);
            toastSuccess("Configuração salva com sucesso!");
        } catch (error: unknown) {
            toastError((error as Error).message || "Erro ao salvar a configuração.");
        } finally {
            if (type === 'planos') setIsSavingPlanos(false);
            else setIsSavingProgramas(false);
        }
    };

    return (
        <Card className="border border-slate-200/80 shadow-xs rounded-xl overflow-hidden bg-white">
            <CardHeader className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#023E8A] flex items-center justify-center shrink-0">
                        <Sliders className="w-5 h-5 text-[#023E8A]" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                        <CardTitle className="text-base sm:text-lg font-bold text-[#102E52] leading-snug">
                            Configuração de Avaliação Padrão
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500 leading-normal">
                            Textos institucionais pré-definidos para preenchimento automático de novos planos e programas.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
                {/* Seção 1: Planos de Ensino */}
                <div className="space-y-4">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">
                            Avaliação Final (Recuperação) — Planos de Ensino
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Este texto será utilizado como padrão para o campo de &quot;Avaliação Final&quot; na criação de novos Planos de Ensino.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => handleBoldToggle(textareaRef, value, setValue)}
                            title="Negrito — selecione o texto e clique para aplicar negrito"
                            className="inline-flex items-center justify-center w-8 h-8 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-[#023E8A] hover:border-slate-300 transition-colors select-none"
                        >
                            <Bold className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs text-slate-400">
                            Selecione o texto e clique no botão para aplicar formatação em negrito.
                        </span>
                    </div>

                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        rows={8}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-sans leading-relaxed text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#023E8A] focus:border-transparent transition-all"
                        placeholder="Digite o texto padrão de avaliação final..."
                    />

                    {value.includes('**') && (
                        <div className="p-4 border border-slate-200/80 rounded-xl bg-slate-50/70">
                            <div className="flex items-center gap-1.5 mb-2">
                                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                                <p className="text-xs text-slate-600 font-bold uppercase tracking-wider">Pré-visualização formatada:</p>
                            </div>
                            <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                                {parseBoldMarkers(value).map((seg, i) =>
                                    seg.isBold ? <strong key={i} className="font-bold text-slate-900">{seg.text}</strong> : <span key={i}>{seg.text}</span>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end pt-2">
                        <Button
                            className="bg-[#023E8A] hover:bg-[#023E8A]/90 text-white font-bold h-9 px-4 rounded-lg shadow-xs"
                            onClick={() => handleSave("DEFAULT_FINAL_EVALUATION", value, 'planos')}
                            disabled={isSavingPlanos}
                        >
                            {isSavingPlanos ? "Salvando..." : "Salvar Configuração (Planos)"}
                        </Button>
                    </div>
                </div>

                <div className="h-px bg-slate-100" />

                {/* Seção 2: Programas de Ensino */}
                <div className="space-y-4">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">
                            Critérios Institucionais de Avaliação — Programas de Ensino
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Este texto será pré-preenchido no campo de &quot;Critérios de Avaliação&quot; na criação ou edição de Programas de Ensino.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => handleBoldToggle(textareaProgramaRef, programaValue, setProgramaValue)}
                            title="Negrito — selecione o texto e clique para aplicar negrito"
                            className="inline-flex items-center justify-center w-8 h-8 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-[#023E8A] hover:border-slate-300 transition-colors select-none"
                        >
                            <Bold className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs text-slate-400">
                            Selecione o texto e clique no botão para aplicar formatação em negrito.
                        </span>
                    </div>

                    <textarea
                        ref={textareaProgramaRef}
                        value={programaValue}
                        onChange={(e) => setProgramaValue(e.target.value)}
                        rows={8}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-sans leading-relaxed text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#023E8A] focus:border-transparent transition-all"
                        placeholder="Digite os critérios institucionais padrão..."
                    />

                    {programaValue.includes('**') && (
                        <div className="p-4 border border-slate-200/80 rounded-xl bg-slate-50/70">
                            <div className="flex items-center gap-1.5 mb-2">
                                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                                <p className="text-xs text-slate-600 font-bold uppercase tracking-wider">Pré-visualização formatada:</p>
                            </div>
                            <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                                {parseBoldMarkers(programaValue).map((seg, i) =>
                                    seg.isBold ? <strong key={i} className="font-bold text-slate-900">{seg.text}</strong> : <span key={i}>{seg.text}</span>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end pt-2">
                        <Button
                            className="bg-[#023E8A] hover:bg-[#023E8A]/90 text-white font-bold h-9 px-4 rounded-lg shadow-xs"
                            onClick={() => handleSave("DEFAULT_CRITERIOS_AVALIACAO_PROGRAMA", programaValue, 'programas')}
                            disabled={isSavingProgramas}
                        >
                            {isSavingProgramas ? "Salvando..." : "Salvar Configuração (Programas)"}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
