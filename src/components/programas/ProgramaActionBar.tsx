"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, AlertCircle, Clock, Trash2, Send, Archive, Eye } from "lucide-react";
import Link from "next/link";
import { getProgramaStatusBadge, isProgramaEditable } from "../../utils/programaStatus";
import type { ProgramaEnsino } from "../../types/programaEnsino";

interface ProgramaActionBarProps {
    programa: ProgramaEnsino;
    saveStatus: 'saved' | 'saving' | 'error';
    onDelete: () => void;
    onSubmit: () => void;
    onArchive: () => void;
    onHistory: () => void;
    onVisualizar: () => void;
}

export function ProgramaActionBar({
    programa,
    saveStatus,
    onDelete,
    onSubmit,
    onArchive,
    onHistory,
    onVisualizar
}: ProgramaActionBarProps) {
    const statusInfo = getProgramaStatusBadge(programa.status);
    const isDraft = programa.status === 'draft';
    const isSubmitted = programa.status === 'submitted';
    const isApproved = programa.status === 'approved';
    const isRejected = programa.status === 'rejected';

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-4 border rounded-lg shadow-sm gap-4">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-4 flex-wrap">
                    <Link href="/dashboard/programas-ensino">
                        <Button variant="ghost" size="sm" className="gap-2 text-slate-600">
                            <ArrowLeft className="w-4 h-4" />
                            Voltar
                        </Button>
                    </Link>
                    <div className="h-6 w-px bg-slate-200 hidden md:block" />
                    
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${statusInfo.colors.bg} ${statusInfo.colors.text} ${statusInfo.colors.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.colors.dot}`} />
                        {statusInfo.label}
                    </span>

                    {isProgramaEditable(programa.status) && (
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            {saveStatus === 'saving' ? (
                                <>
                                    <Clock className="w-4 h-4 animate-spin text-slate-400" />
                                    <span>Salvando...</span>
                                </>
                            ) : saveStatus === 'saved' ? (
                                <>
                                    <Check className="w-4 h-4 text-green-500" />
                                    <span>Todas as alterações foram salvas</span>
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="w-4 h-4 text-red-500" />
                                    <span className="text-red-500">Erro ao salvar</span>
                                </>
                            )}
                        </div>
                    )}
                </div>

                
                {isRejected && programa.feedback_aprovacao && (
                    <p className="text-xs text-red-600 mt-1 border border-red-100 bg-red-50 p-2 rounded w-fit">
                        Motivo: {programa.feedback_aprovacao}
                    </p>
                )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={onHistory} className="gap-2">
                    <Clock className="w-4 h-4" />
                    Histórico
                </Button>

                {isDraft && (
                    <Button variant="outline" size="sm" onClick={onDelete} className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                        <Trash2 className="w-4 h-4" />
                        Excluir Rascunho
                    </Button>
                )}

                <Button variant="outline" size="sm" onClick={onVisualizar} className="gap-2">
                    <Eye className="w-4 h-4" />
                    Visualizar
                </Button>

                {isDraft && (
                    <Button size="sm" onClick={onSubmit} className="gap-2 bg-blue-600 hover:bg-blue-700">
                        <Send className="w-4 h-4" />
                        Submeter para Aprovação
                    </Button>
                )}

                {isSubmitted && (
                    <span className="text-xs text-slate-500 flex items-center gap-1.5 ml-2 border border-slate-200 px-3 py-1.5 rounded-lg bg-slate-50">
                        <Clock className="w-3.5 h-3.5" />
                        Aguardando aprovação
                    </span>
                )}

                {isApproved && (
                    <Button variant="outline" size="sm" onClick={onArchive} className="gap-2 border-blue-200 text-blue-600 hover:bg-blue-50">
                        <Archive className="w-4 h-4" />
                        Arquivar
                    </Button>
                )}
            </div>
        </div>
    );
}
