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
        <div className="flex items-center gap-3 p-4 bg-slate-900 text-white rounded-lg shadow-lg border-slate-700 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex-1">
                <p className="text-sm font-medium">Revisão do Coordenador</p>
                <p className="text-xs text-slate-400">
                    {status === "submitted" 
                        ? "Esta submissão ainda não foi iniciada." 
                        : "Analise o plano e tome uma decisão."}
                </p>
            </div>
            
            <div className="flex items-center gap-2">
                {status === "submitted" ? (
                    <Button 
                        variant="default" 
                        size="sm" 
                        className="gap-2 bg-brand-blue hover:bg-brand-blue text-white"
                        onClick={handleStartReview}
                        disabled={isStarting}
                    >
                        {isStarting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
                                <Button variant="destructive" size="sm" className="gap-2">
                                    <XCircle className="w-4 h-4" />
                                    Rejeitar
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="text-slate-900">
                                <DialogHeader>
                                    <DialogTitle>Rejeitar Plano de Ensino</DialogTitle>
                                    <DialogDescription>
                                        Informe o motivo da rejeição ou quais alterações são necessárias.
                                        O professor receberá este feedback para realizar os ajustes.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="feedback">Feedback para o Professor</Label>
                                        <Textarea 
                                            id="feedback" 
                                            placeholder="Ex: A bibliografia complementar está desatualizada..." 
                                            value={feedback}
                                            onChange={(e) => setFeedback(e.target.value)}
                                            className="min-h-[120px]"
                                        />
                                        <p className="text-xs text-slate-500">Mínimo 5 caracteres.</p>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                        Cancelar
                                    </Button>
                                    <Button 
                                        variant="destructive" 
                                        onClick={handleReject}
                                        disabled={isRejecting || feedback.trim().length < 5}
                                    >
                                        {isRejecting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Rejeitando...
                                            </>
                                        ) : (
                                            "Confirmar Rejeição"
                                        )}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <Button 
                            variant="default" 
                            size="sm" 
                            className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                            onClick={handleApprove}
                            disabled={isAppproving}
                        >
                            {isAppproving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
                    <Badge className="bg-slate-700 text-slate-300 border-slate-600">
                        Processo Finalizado
                    </Badge>
                )}
            </div>
        </div>
    );
}
