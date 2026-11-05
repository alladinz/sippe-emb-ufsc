"use client";

import { useState } from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogHeader, 
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubmitProgramaModalProps {
    cursos: string[];
    onClose: () => void;
    onConfirm: (curso: string) => Promise<void>;
}

export function SubmitProgramaModal({ cursos, onClose, onConfirm }: SubmitProgramaModalProps) {
    const [selected, setSelected] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleConfirm = async () => {
        if (!selected) return;
        setIsSubmitting(true);
        try {
            await onConfirm(selected);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md p-6 rounded-xl border border-slate-200/80 shadow-xl">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold text-[#102E52] flex items-center gap-2">
                        <Send className="w-5 h-5 text-[#023E8A]" />
                        Encaminhar para Homologação
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 mt-1">
                        Selecione a coordenação de curso para a qual este programa será encaminhado.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-3">
                    {cursos.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            Nenhum curso vinculado a esta disciplina.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {cursos.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setSelected(c)}
                                    className={cn(
                                        "w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-all duration-150 cursor-pointer shadow-xs",
                                        selected === c
                                            ? "border-[#023E8A] bg-[#023E8A]/5 ring-1 ring-[#023E8A]"
                                            : "border-slate-200/80 bg-white hover:bg-slate-50/60"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                                            selected === c
                                                ? "border-[#023E8A] bg-[#023E8A]"
                                                : "border-slate-300 bg-white"
                                        )}
                                    >
                                        {selected === c && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </div>
                                    <span className="text-xs font-semibold text-slate-900 leading-snug">{c}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-2">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="h-9 px-4 text-xs font-semibold text-slate-600 border-slate-200 hover:bg-slate-50 rounded-lg"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!selected || isSubmitting}
                        className="h-9 bg-[#023E8A] hover:bg-[#023E8A]/90 text-white font-bold px-4 text-xs rounded-lg"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                                Encaminhando...
                            </>
                        ) : (
                            "Encaminhar"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
