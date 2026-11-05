"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, AlertCircle, Clock, Trash2, Send, Eye, CloudUpload } from "lucide-react";
import Link from "next/link";
import { getProgramaStatusBadge, isProgramaEditable } from "../../utils/programaStatus";
import type { ProgramaEnsino } from "../../types/programaEnsino";
import { useSession } from "@/lib/auth/client";
import { AprovacoesPanel } from "./AprovacoesPanel";

interface ProgramaActionBarProps {
    programa: ProgramaEnsino;
    saveStatus: 'saved' | 'saving' | 'error';
    onDelete: () => void;
    onSubmit: () => void;
    onHistory: () => void;
    onVisualizar: () => void;
}

export function ProgramaActionBar({
    programa,
    saveStatus,
    onDelete,
    onSubmit,
    onHistory,
    onVisualizar
}: ProgramaActionBarProps) {
    const { data: session } = useSession();
    const userPapel = session?.user?.papel as string | undefined;

    const statusInfo = getProgramaStatusBadge(programa.status);
    const isDraft = programa.status === 'draft';
    const isPendingChefe = programa.status === 'pending_chefe';
    const isSubmitted = programa.status === 'submitted';
    const isRejected = programa.status === 'rejected';

    const submitLabel = userPapel === 'comissao'
        ? 'Encaminhar para Chefia'
        : 'Encaminhar para Coordenações';

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-4 border border-slate-200/80 rounded-xl shadow-xs gap-4">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3.5 flex-wrap">
                    <Link href="/dashboard/programas-ensino">
                        <Button variant="ghost" size="sm" className="gap-1.5 text-slate-600 font-bold text-xs h-8">
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Voltar
                        </Button>
                    </Link>
                    <div className="h-5 w-px bg-slate-200 hidden md:block" />

                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${statusInfo.colors.bg} ${statusInfo.colors.text} ${statusInfo.colors.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.colors.dot}`} />
                        {statusInfo.label}
                    </span>

                    {isProgramaEditable(programa.status, userPapel) && (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                            {saveStatus === 'saving' ? (
                                <>
                                    <CloudUpload className="w-3.5 h-3.5 animate-pulse text-[#023E8A]" />
                                    <span className="text-[#023E8A] font-bold">Salvando...</span>
                                </>
                            ) : saveStatus === 'saved' ? (
                                <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Todas as alterações salvas</span>
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                                    <span className="text-red-600 font-bold">Erro ao salvar</span>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {isRejected && programa.feedback_aprovacao && (
                    <p className="text-xs text-red-600 mt-1 border border-red-100 bg-red-50 p-2 rounded-lg w-fit">
                        Motivo: {programa.feedback_aprovacao}
                    </p>
                )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={onHistory} className="gap-1.5 text-slate-700 border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold h-8">
                    <Clock className="w-3.5 h-3.5" />
                    Histórico
                </Button>

                {isDraft && userPapel !== 'comissao' && (
                    <Button variant="outline" size="sm" onClick={onDelete} className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 rounded-lg text-xs font-bold h-8">
                        <Trash2 className="w-3.5 h-3.5" />
                        Excluir Rascunho
                    </Button>
                )}

                <Button variant="outline" size="sm" onClick={onVisualizar} className="gap-1.5 text-slate-700 border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold h-8">
                    <Eye className="w-3.5 h-3.5" />
                    Visualizar
                </Button>

                {isDraft && (
                    <Button size="sm" onClick={onSubmit} className="gap-1.5 bg-[#023E8A] hover:bg-[#023E8A]/90 text-white font-bold rounded-lg text-xs h-8 px-3.5 shadow-xs">
                        <Send className="w-3.5 h-3.5" />
                        {submitLabel}
                    </Button>
                )}

                {isPendingChefe && userPapel === 'comissao' && (
                    <span className="text-xs text-slate-500 flex items-center gap-1.5 ml-1 border border-slate-200 px-3 py-1.5 rounded-lg bg-slate-50 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        Aguardando revisão da chefia
                    </span>
                )}

                {isPendingChefe && userPapel === 'chefe' && (
                    <>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => (window as unknown as { rejectChefe?: () => void }).rejectChefe?.()}
                            className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold h-8"
                        >
                            Devolver à Comissão
                        </Button>
                        <Button size="sm" onClick={onSubmit} className="gap-1.5 bg-[#023E8A] hover:bg-[#023E8A]/90 text-white font-bold rounded-lg text-xs h-8 px-3.5 shadow-xs">
                            <Send className="w-3.5 h-3.5" />
                            {submitLabel}
                        </Button>
                    </>
                )}

                {isSubmitted && userPapel === 'coordenador' && (
                    <Button
                        size="sm"
                        onClick={() => (window as unknown as { openReviewModal?: () => void }).openReviewModal?.()}
                        className="gap-1.5 bg-[#023E8A] hover:bg-[#023E8A]/90 text-white font-bold rounded-lg text-xs h-8 px-3.5 shadow-xs"
                    >
                        Iniciar Revisão
                    </Button>
                )}

                {isSubmitted && userPapel !== 'coordenador' && (
                    <span className="text-xs text-slate-500 flex items-center gap-1.5 ml-1 border border-slate-200 px-3 py-1.5 rounded-lg bg-slate-50 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        Aguardando aprovação
                    </span>
                )}
            </div>

            <div className="w-full">
                <AprovacoesPanel programaId={programa.id} status={programa.status} />
            </div>
        </div>
    );
}
