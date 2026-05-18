"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Archive, Loader2 } from "lucide-react";
import { archiveStudyPlanAction } from "../../coordinator/actions";
import { confirmDialog, toastError, toastSuccess } from "@/lib/swal";

interface ArchiveButtonProps {
    id: string;
}

export function ArchiveButton({ id }: ArchiveButtonProps) {
    const [isPending, startTransition] = useTransition();

    const handleArchive = async () => {
        const confirmed = await confirmDialog(
            'Arquivar plano de ensino?',
            'Deseja arquivar este plano de ensino? Ele ficará disponível apenas para consulta no arquivo central.',
            'Arquivar',
            'Cancelar',
            false
        );

        if (!confirmed) return;

        startTransition(async () => {
            try {
                await archiveStudyPlanAction(id);
                toastSuccess('Plano arquivado com sucesso.');
            } catch (error: unknown) {
                toastError(error instanceof Error ? error.message : "Erro ao arquivar o plano");
            }
        });
    };

    return (
        <Button 
            size="sm" 
            variant="outline" 
            className="gap-2 text-brand-blue border-brand-light hover:bg-brand-light/10"
            onClick={handleArchive}
            disabled={isPending}
        >
            {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <Archive className="w-4 h-4" />
            )}
            Arquivar
        </Button>
    );
}
