"use client";

import { useState, useTransition } from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogFooter, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { UserPlus, Loader2, CheckCircle2 } from "lucide-react";
import { assignTeacherToCourseAction } from "../actions";
import { toastError, toastSuccess, toastWarning } from "@/lib/swal";

interface AssignmentDialogProps {
    course: { id: string, code: string, name: string };
    teachers: { id: string, name: string | null }[];
    organizations: { id: string, name: string }[];
}

export function AssignmentDialog({ course, teachers, organizations }: AssignmentDialogProps) {
    const [open, setOpen] = useState(false);
    const [isAssigning, startTransition] = useTransition();
    const [teacherId, setTeacherId] = useState("");
    const [organizationIds, setOrganizationIds] = useState<string[]>([]);
    const [semester, setSemester] = useState("2026.1");
    const [success, setSuccess] = useState(false);

    const toggleOrganization = (id: string) => {
        setOrganizationIds(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleAssign = () => {
        if (!teacherId || organizationIds.length === 0 || !semester) {
            toastWarning("Por favor, preencha todos os campos e selecione ao menos um curso");
            return;
        }

        startTransition(async () => {
            try {
                await assignTeacherToCourseAction(teacherId, course.id, semester, organizationIds);
                setSuccess(true);
                toastSuccess("Plano atribuído com sucesso");
                setTimeout(() => {
                    setOpen(false);
                    setSuccess(false);
                    setOrganizationIds([]);
                }, 2000);
            } catch (error: unknown) {
                toastError(error instanceof Error ? error.message : "Erro ao atribuir professor");
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="ghost" className="gap-2 text-brand-blue hover:text-brand-blue hover:bg-brand-light/10">
                    <UserPlus className="w-4 h-4" />
                    Atribuir Professor
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                {success ? (
                    <div className="py-10 text-center space-y-4">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Atribuição Concluída!</h3>
                            <p className="text-sm text-slate-500">O rascunho foi criado para o professor.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>Atribuir Professor</DialogTitle>
                            <DialogDescription>
                                Crie um rascunho de plano de ensino para <strong>{course.code} - {course.name}</strong>.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="teacher">Professor(a)</Label>
                                <Select value={teacherId} onValueChange={setTeacherId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione um professor..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {teachers.map(t => (
                                            <SelectItem key={t.id} value={t.id}>{t.name || "Sem nome"}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-3">
                                <Label className="text-sm font-bold text-slate-700">Cursos / Graduações</Label>
                                <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto p-3 border rounded-md bg-slate-50/50">
                                    {organizations.map(o => (
                                        <div key={o.id} className="flex items-center gap-2">
                                            <Checkbox 
                                                id={`org-${o.id}`} 
                                                checked={organizationIds.includes(o.id)}
                                                onCheckedChange={() => toggleOrganization(o.id)}
                                            />
                                            <Label 
                                                htmlFor={`org-${o.id}`}
                                                className="text-xs font-normal cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                {o.name}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] text-slate-500 italic">* Os campos TURMA e CURSO serão automatizados com base nesta seleção.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="semester">Semestre</Label>
                                <Input 
                                    id="semester" 
                                    value={semester} 
                                    onChange={(e) => setSemester(e.target.value)} 
                                    placeholder="Ex: 2026.1"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                            <Button onClick={handleAssign} disabled={isAssigning || !teacherId || organizationIds.length === 0}>
                                {isAssigning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                                Criar Rascunho
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
