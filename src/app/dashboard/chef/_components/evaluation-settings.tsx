"use client";

import { useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toastSuccess, toastError, toastInfo } from "@/lib/swal";
import { updateSystemSettingAction } from "../actions";
import { parseBoldMarkers } from "@/utils/bibliografiaUtils";

interface EvaluationSettingsProps {
    initialValue: string;
    initialProgramaValue: string;
}

export function EvaluationSettings({ initialValue, initialProgramaValue }: EvaluationSettingsProps) {
    const [value, setValue] = useState(initialValue);
    const [programaValue, setProgramaValue] = useState(initialProgramaValue);
    const [isSaving, setIsSaving] = useState(false);
    
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

    const handleSave = async (key: string, val: string) => {
        try {
            setIsSaving(true);
            await updateSystemSettingAction(key, val);
            toastSuccess("Configuração salva com sucesso!");
        } catch (error: unknown) {
            toastError((error as Error).message || "Erro ao salvar a configuração.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card className="border-slate-200 shadow-sm rounded-md">
            <CardHeader className="border-b bg-slate-50/50">
                <CardTitle className="text-xl">Configuração de Avaliação Final (Recuperação)</CardTitle>
                <CardDescription>
                    Este texto será utilizado como padrão para o campo de &quot;Avaliação Final&quot; na criação de novos Planos de Ensino.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-1 mb-2">
                    <button
                        type="button"
                        onClick={() => handleBoldToggle(textareaRef, value, setValue)}
                        title="Negrito — selecione o texto e clique para aplicar negrito"
                        className="inline-flex items-center justify-center w-8 h-8 text-sm font-black text-gray-700 border border-gray-300 rounded hover:bg-gray-100 hover:border-gray-400 transition-colors select-none"
                    >
                        B
                    </button>
                    <span className="text-xs text-gray-500 ml-2">
                        Selecione o texto e clique B para adicionar negrito.
                    </span>
                </div>
                
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    rows={12}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent font-mono"
                    placeholder="Digite o texto padrão de avaliação final..."
                />

                {value.includes('**') && (
                    <div className="mt-4 p-4 border border-slate-200 rounded-md bg-slate-50">
                        <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wider">Pré-visualização:</p>
                        <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                            {parseBoldMarkers(value).map((seg, i) =>
                                seg.isBold ? <strong key={i}>{seg.text}</strong> : <span key={i}>{seg.text}</span>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex justify-end mt-6 pb-6 border-b border-slate-200">
                    <Button onClick={() => handleSave("DEFAULT_FINAL_EVALUATION", value)} disabled={isSaving}>
                        {isSaving ? "Salvando..." : "Salvar Configuração (Planos)"}
                    </Button>
                </div>

                <div className="pt-6">
                    <h3 className="text-lg font-semibold mb-2">Critérios Institucionais de Avaliação (Programas de Ensino)</h3>
                    <p className="text-sm text-slate-500 mb-4">
                        Este texto será pré-preenchido no campo de &quot;Critérios Avaliação&quot; na criação ou edição de Programas de Ensino.
                    </p>
                    
                    <div className="flex items-center gap-1 mb-2">
                        <button
                            type="button"
                            onClick={() => handleBoldToggle(textareaProgramaRef, programaValue, setProgramaValue)}
                            title="Negrito — selecione o texto e clique para aplicar negrito"
                            className="inline-flex items-center justify-center w-8 h-8 text-sm font-black text-gray-700 border border-gray-300 rounded hover:bg-gray-100 hover:border-gray-400 transition-colors select-none"
                        >
                            B
                        </button>
                        <span className="text-xs text-gray-500 ml-2">
                            Selecione o texto e clique B para adicionar negrito.
                        </span>
                    </div>
                    
                    <textarea
                        ref={textareaProgramaRef}
                        value={programaValue}
                        onChange={(e) => setProgramaValue(e.target.value)}
                        rows={12}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent font-mono"
                        placeholder="Digite os critérios institucionais padrão..."
                    />

                    {programaValue.includes('**') && (
                        <div className="mt-4 p-4 border border-slate-200 rounded-md bg-slate-50">
                            <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wider">Pré-visualização:</p>
                            <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                                {parseBoldMarkers(programaValue).map((seg, i) =>
                                    seg.isBold ? <strong key={i}>{seg.text}</strong> : <span key={i}>{seg.text}</span>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end mt-6">
                        <Button onClick={() => handleSave("DEFAULT_CRITERIOS_AVALIACAO_PROGRAMA", programaValue)} disabled={isSaving}>
                            {isSaving ? "Salvando..." : "Salvar Configuração (Programas)"}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
