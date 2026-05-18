"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { deleteStudyPlanAction } from "../actions";
import { cn } from "@/lib/utils";
import { confirmDialog, toastError, toastSuccess } from "@/lib/swal";

interface DeletePlanButtonProps {
    id: string;
    variant?: "icon" | "full";
    shouldRedirect?: boolean;
    className?: string;
}

export function DeletePlanButton({ id, variant = "icon", shouldRedirect = false, className }: DeletePlanButtonProps) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = async () => {
        const confirmed = await confirmDialog(
            "Excluir rascunho?",
            "Esta ação é permanente e não pode ser desfeita. O plano de ensino será removido do sistema.",
            "Excluir",
            "Cancelar",
            true
        );

        if (!confirmed) return;

        startTransition(async () => {
            try {
                await deleteStudyPlanAction(id, shouldRedirect);
                toastSuccess("Rascunho excluído com sucesso");
            } catch (error: any) {
                // Ignore Next.js redirect errors
                if (error.message === 'NEXT_REDIRECT') return;
                
                toastError(error instanceof Error ? error.message : "Erro ao excluir o plano");
            }
        });
    };

    if (variant === "icon") {
        return (
            <Button 
                variant="ghost" 
                size="sm" 
                title="Excluir Rascunho"
                onClick={handleDelete}
                disabled={isPending}
                className={cn("text-slate-400 hover:text-red-600 hover:bg-red-50", className)}
            >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </Button>
        );
    }

    return (
        <Button 
            variant="outline" 
            size="sm" 
            className={cn("gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700", className)}
            onClick={handleDelete}
            disabled={isPending}
        >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Excluir Rascunho
        </Button>
    );
}
