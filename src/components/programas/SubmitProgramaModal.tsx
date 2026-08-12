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
        await onConfirm(selected);
        setIsSubmitting(false);
    };

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] text-slate-900">
                <DialogHeader>
                    <DialogTitle>Encaminhar para aprovação</DialogTitle>
                    <DialogDescription>
                        Selecione a coordenação de curso para encaminhar este programa.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {cursos.length === 0 ? (
                        <p className="text-sm text-slate-500">Nenhum curso vinculado a esta disciplina.</p>
                    ) : (
                        <div className="space-y-2">
                            {cursos.map(c => (
                                <label key={c} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                                    <input 
                                        type="radio" 
                                        name="curso" 
                                        value={c} 
                                        checked={selected === c} 
                                        onChange={() => setSelected(c)}
                                        className="w-4 h-4 text-brand-blue"
                                    />
                                    <span className="text-sm font-medium">{c}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button onClick={handleConfirm} disabled={!selected || isSubmitting} className="bg-brand-blue hover:bg-brand-blue/90">
                        {isSubmitting ? "Encaminhando..." : "Encaminhar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
