"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    CheckCircle,
    XCircle,
    Loader2
} from "lucide-react";
import {
    approveStudyPlanAction,
    rejectStudyPlanAction,
    startReviewAction
} from "../../../coordinator/actions";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { StudyPlanStatus } from "@/lib/schemas/study-plan";
import { Badge } from "@/components/ui/badge";
import { confirmDialog, toastError, toastSuccess, toastInfo } from "@/lib/swal";

interface ReviewActionsProps {
    studyPlanId: string;
    status: StudyPlanStatus;
}

export function ReviewActions({ studyPlanId, status }: ReviewActionsProps) {
    const [isAppproving, setIsApproving] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const [feedback, setFeedback] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const router = useRouter();

    const handleStartReview = async () => {
        setIsStarting(true);
        try {
            await startReviewAction(studyPlanId);
            toastInfo("Revisão iniciada");
            router.refresh();
        } catch (error: unknown) {
            toastError(error instanceof Error ? error.message : "Erro ao iniciar revisão");
        } finally {
            setIsStarting(false);
        }
    };

    const handleApprove = async () => {
        const confirmed = await confirmDialog(
            "Aprovar plano?",
            "Tem certeza que deseja aprovar este plano de ensino?",
            "Aprovar",
            "Cancelar",
            false
        );

        if (!confirmed) return;

        setIsApproving(true);
        try {
            await approveStudyPlanAction(studyPlanId);
            toastSuccess("Plano aprovado com sucesso");
            router.refresh();
        } catch (error: unknown) {
            toastError(error instanceof Error ? error.message : "Erro ao aprovar plano");
        } finally {
            setIsApproving(false);
        }
    };

    const handleReject = async () => {
        if (!feedback.trim()) return;

        setIsRejecting(true);
        try {
            await rejectStudyPlanAction(studyPlanId, feedback);
            setIsDialogOpen(false);
            toastInfo("Plano devolvido para revisão");
            router.refresh();
        } catch (error: unknown) {
            toastError(error instanceof Error ? error.message : "Erro ao rejeitar plano");
        } finally {
            setIsRejecting(false);
        }
    };

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 bg-white border border-slate-200/90 rounded-xl shadow-xs animate-in fade-in slide-in-from-bottom-4">
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                    <p className="text-sm font-bold text-[#102E52]">Revisão da Coordenação</p>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                    {status === "submitted"
                        ? "Esta submissão está aguardando o início da sua revisão."
                        : "Analise o plano de ensino e registre sua aprovação ou devolução com apontamentos."}
                </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {status === "submitted" ? (
                    <Button
                        size="sm"
                        className="gap-2 bg-[#023E8A] hover:bg-[#023E8A]/90 text-white font-bold rounded-lg h-9 px-4 text-xs"
                        onClick={handleStartReview}
                        disabled={isStarting}
                    >
                        {isStarting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                Iniciando...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-4 h-4" />
                                Iniciar Revisão
                            </>
                        )}
                    </Button>
                ) : status === "pending_review" ? (
                    <>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold rounded-lg h-9 px-3.5 text-xs">
                                    <XCircle className="w-4 h-4" />
                                    Devolver com Apontamentos
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md p-6 rounded-xl border border-slate-200/80 shadow-xl">
                                <DialogHeader>
                                    <DialogTitle className="text-lg font-bold text-[#102E52] flex items-center gap-2">
                                        <XCircle className="w-5 h-5 text-red-600" />
                                        Devolver Plano de Ensino
                                    </DialogTitle>
                                    <DialogDescription className="text-xs text-slate-500 mt-1">
                                        Informe o motivo da devolução e os apontamentos necessários.
                                        O professor receberá este parecer para realizar os ajustes.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-3 py-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="feedback" className="text-xs font-semibold text-slate-700">Apontamentos para o Professor <span className="text-red-500">*</span></Label>
                                        <Textarea
                                            id="feedback"
                                            placeholder="Ex: A bibliografia complementar precisa ser atualizada conforme o PPC do curso..."
                                            value={feedback}
                                            onChange={(e) => setFeedback(e.target.value)}
                                            className="min-h-[120px] rounded-lg border-slate-200 text-xs focus:ring-2 focus:ring-[#023E8A] resize-none"
                                        />
                                        <p className="text-[11px] text-slate-400">Mínimo de 5 caracteres.</p>
                                    </div>
                                </div>
                                <DialogFooter className="gap-2 sm:gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsDialogOpen(false)}
                                        className="h-9 px-4 text-xs font-semibold text-slate-600 border-slate-200 hover:bg-slate-50 rounded-lg"
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={handleReject}
                                        disabled={isRejecting || feedback.trim().length < 5}
                                        className="h-9 font-bold text-xs px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white"
                                    >
                                        {isRejecting ? (
                                            <>
                                                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                                Devolvendo...
                                            </>
                                        ) : (
                                            "Confirmar Devolução"
                                        )}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <Button
                            size="sm"
                            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg h-9 px-4 text-xs"
                            onClick={handleApprove}
                            disabled={isAppproving}
                        >
                            {isAppproving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                    Aprovando...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-4 h-4" />
                                    Aprovar Plano
                                </>
                            )}
                        </Button>
                    </>
                ) : (
                    <Badge className="bg-slate-100 text-slate-700 border-slate-200">
                        Processo Finalizado
                    </Badge>
                )}
            </div>
        </div>
    );
}
