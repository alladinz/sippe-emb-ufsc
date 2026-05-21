"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Save, Loader2, Plus, Trash2, Pencil, X } from "lucide-react";
import { upsertSemesterAction, deleteSemesterAction, toggleActiveSemesterAction, updateSemesterAction } from "../actions";
import { confirmDialog, toastError, toastSuccess, toastWarning } from "@/lib/swal";

interface Semester {
    id: string;
    name: string;
    startDate: string | Date;
    endDate: string | Date;
    ativo: boolean | null;
}

interface SemesterManagementProps {
    semesters: Semester[];
}

export function SemesterManagement({ semesters }: SemesterManagementProps) {
    const [isPending, startTransition] = useTransition();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const handleSave = () => {
        if (!name || !startDate || !endDate) {
            toastWarning("Preencha todos os campos");
            return;
        }

        startTransition(async () => {
            try {
                if (editingId) {
                    await updateSemesterAction(editingId, name, startDate, endDate);
                    toastSuccess("Semestre atualizado com sucesso");
                } else {
                    await upsertSemesterAction(name, startDate, endDate);
                    toastSuccess("Semestre salvo com sucesso");
                }
                resetForm();
            } catch (error: unknown) {
                toastError(error instanceof Error ? error.message : "Erro ao salvar semestre");
            }
        });
    };

    const resetForm = () => {
        setEditingId(null);
        setName("");
        setStartDate("");
        setEndDate("");
    };

    const handleEdit = (s: Semester) => {
        setEditingId(s.id);
        setName(s.name);
        setStartDate(new Date(s.startDate).toISOString().split('T')[0]);
        setEndDate(new Date(s.endDate).toISOString().split('T')[0]);
    };

    const handleDelete = async (id: string) => {
        const confirmed = await confirmDialog(
            "Excluir semestre?",
            "Esta ação removerá a configuração do semestre. Deseja continuar?",
            "Excluir",
            "Cancelar",
            true
        );

        if (!confirmed) return;

        startTransition(async () => {
            try {
                await deleteSemesterAction(id);
                toastSuccess("Semestre excluído");
            } catch (error: unknown) {
                toastError(error instanceof Error ? error.message : "Erro ao excluir semestre");
            }
        });
    };

    const handleToggleActive = (id: string) => {
        startTransition(async () => {
            try {
                await toggleActiveSemesterAction(id);
                toastSuccess("Semestre ativo atualizado");
            } catch (error: unknown) {
                toastError(error instanceof Error ? error.message : "Erro ao alterar status do semestre");
            }
        });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="md:col-span-1 rounded-lg">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        {editingId ? <Pencil className="w-4 h-4 text-brand-blue" /> : <Plus className="w-4 h-4 text-brand-blue" />}
                        {editingId ? "Editar Semestre" : "Novo Semestre"}
                    </CardTitle>
                    <CardDescription>Defina os prazos para automação do cronograma.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="sem-name">Identificação (ex: 2026.1)</Label>
                        <Input id="sem-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="2026.1" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sem-start">Início das Aulas</Label>
                        <Input id="sem-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sem-end">Término das Aulas</Label>
                        <Input id="sem-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                    <div className="flex gap-2">
                        {editingId && (
                            <Button variant="outline" className="flex-1 gap-2 rounded-sm" onClick={resetForm} disabled={isPending}>
                                <X className="w-4 h-4" />
                                Cancelar
                            </Button>
                        )}
                        <Button className="flex-1 gap-2 rounded-sm" onClick={handleSave} disabled={isPending}>
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {editingId ? "Atualizar" : "Salvar"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="md:col-span-2 rounded-lg">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-brand-blue" />
                        Semestres Configurados
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {semesters.length === 0 ? (
                            <p className="text-sm text-slate-500 italic py-4 text-center">Nenhum semestre configurado.</p>
                        ) : (
                            semesters.map((s) => (
                                <div key={s.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-6">
                                        <div>
                                            <span className="text-sm font-bold text-slate-900">{s.name}</span>
                                        </div>
                                        <div className="text-xs text-slate-500 flex items-center gap-4">
                                            <span><strong>Início:</strong> {new Date(s.startDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                                            <span><strong>Fim:</strong> {new Date(s.endDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                                            {s.ativo && <span className="text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full font-bold">Ativo</span>}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {!s.ativo && (
                                            <Button variant="outline" size="sm" onClick={() => handleToggleActive(s.id)}>Definir Ativo</Button>
                                        )}
                                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-brand-blue" onClick={() => handleEdit(s)}>
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-600" onClick={() => handleDelete(s.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
