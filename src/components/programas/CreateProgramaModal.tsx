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
import { Search } from "lucide-react";
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
            <DialogContent className="sm:max-w-[500px] text-slate-900">
                <DialogHeader>
                    <DialogTitle>Novo Programa de Ensino</DialogTitle>
                    <DialogDescription>
                        Selecione a disciplina para criar o programa de ensino.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar disciplina por nome ou código..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                        />
                    </div>

                    <div className="max-h-64 overflow-y-auto border rounded-md divide-y">
                        {isLoading ? (
                            <div className="p-4 text-center text-sm text-slate-500">Buscando...</div>
                        ) : disciplinas.length === 0 ? (
                            <div className="p-4 text-center text-sm text-slate-500">Nenhuma disciplina encontrada.</div>
                        ) : (
                            disciplinas.map(disc => (
                                <div 
                                    key={disc.id}
                                    onClick={() => setSelectedId(disc.id)}
                                    className={`p-3 cursor-pointer hover:bg-slate-50 transition-colors flex flex-col gap-1 ${
                                        selectedId === disc.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                                    }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <span className="font-mono text-sm text-blue-600">{disc.codigo}</span>
                                        {/* TODO: check if already has program */}
                                    </div>
                                    <p className="font-medium text-sm text-slate-900">{disc.nome}</p>
                                    {disc.curso && (
                                        <div className="mt-1">
                                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                                {disc.curso}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isCreating}>
                        Cancelar
                    </Button>
                    <Button onClick={handleCreate} disabled={!selectedId || isCreating} className="bg-brand-blue hover:bg-brand-blue/90">
                        {isCreating ? "Criando..." : "Criar Programa"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
