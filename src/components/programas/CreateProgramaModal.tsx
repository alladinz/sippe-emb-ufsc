"use client";

import { useState, useEffect } from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogHeader, 
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, BookOpen, Loader2 } from "lucide-react";
import { programasEnsinoApi } from "../../services/programasEnsinoApi";
import { toastError, toastSuccess } from "@/lib/swal";
import type { ProgramaEnsino } from "../../types/programaEnsino";
import axios from "axios";

interface Disciplina {
    id: string;
    codigo: string;
    nome: string;
    curso: string | null;
}

interface CreateProgramaModalProps {
    onClose: () => void;
    onCreated: (programa: ProgramaEnsino) => void;
}

export function CreateProgramaModal({ onClose, onCreated }: CreateProgramaModalProps) {
    const [search, setSearch] = useState("");
    const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        const fetchDisciplinas = async () => {
            setIsLoading(true);
            try {
                const res = await axios.get('/api/disciplinas', { params: { search } });
                setDisciplinas(res.data.data);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        const timer = setTimeout(() => {
            fetchDisciplinas();
        }, 300);

        return () => clearTimeout(timer);
    }, [search]);

    const handleCreate = async () => {
        if (!selectedId) return;
        setIsCreating(true);
        try {
            const result = await programasEnsinoApi.create({ disciplina_id: selectedId });
            toastSuccess("Programa criado com sucesso!");
            onCreated(result);
        } catch (err: unknown) {
            const errorMsg = (err as { response?: { data?: { error?: string } } }).response?.data?.error || "Erro ao criar programa";
            toastError(errorMsg);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] p-6 rounded-xl border border-slate-200/80 shadow-xl">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold text-[#102E52] flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-[#023E8A]" />
                        Novo Programa de Ensino
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 mt-1">
                        Selecione a disciplina para criar o programa de ensino correspondente.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-3 py-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            type="text"
                            placeholder="Buscar disciplina por nome ou código..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9 h-9 rounded-lg border-slate-200 text-xs focus-visible:ring-[#023E8A]"
                            autoFocus
                        />
                    </div>

                    <div className="max-h-64 overflow-y-auto border border-slate-200/80 rounded-lg divide-y divide-slate-100 bg-white">
                        {isLoading ? (
                            <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-[#023E8A]" />
                                <span>Buscando disciplinas...</span>
                            </div>
                        ) : disciplinas.length === 0 ? (
                            <div className="py-8 text-center text-xs text-slate-400 italic">Nenhuma disciplina encontrada.</div>
                        ) : (
                            disciplinas.map(disc => (
                                <div 
                                    key={disc.id}
                                    onClick={() => setSelectedId(disc.id)}
                                    className={`p-3 cursor-pointer hover:bg-slate-50 transition-colors flex flex-col gap-0.5 ${
                                        selectedId === disc.id ? 'bg-[#023E8A]/5 border-l-4 border-l-[#023E8A]' : ''
                                    }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <span className="font-mono text-xs font-bold text-[#023E8A] bg-blue-50/60 px-1.5 py-0.5 rounded border border-blue-100/60">{disc.codigo}</span>
                                    </div>
                                    <p className="font-bold text-xs text-slate-900 mt-1">{disc.nome}</p>
                                    {disc.curso && (
                                        <div className="mt-1">
                                            <span className="text-[10px] bg-slate-100 font-medium text-slate-600 px-2 py-0.5 rounded-full">
                                                {disc.curso}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-2">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isCreating}
                        className="h-9 px-4 text-xs font-semibold text-slate-600 border-slate-200 hover:bg-slate-50"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={!selectedId || isCreating}
                        className="h-9 bg-[#023E8A] hover:bg-[#023E8A]/90 text-white font-bold px-4 text-xs"
                    >
                        {isCreating ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                                Criando...
                            </>
                        ) : (
                            "Criar Programa"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
