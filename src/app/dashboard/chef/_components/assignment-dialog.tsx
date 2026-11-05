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
                <Button size="sm" variant="ghost" className="gap-2 text-[#023E8A] hover:text-[#023E8A] hover:bg-blue-50/80 rounded-lg h-8 px-2.5 text-xs font-semibold">
                    <UserPlus className="w-3.5 h-3.5" />
                    Atribuir Professor
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[460px] p-6 rounded-xl border border-slate-200/80 shadow-xl">
                {success ? (
                    <div className="py-8 text-center space-y-3">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mx-auto border border-emerald-100">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-[#102E52]">Atribuição Concluída!</h3>
                            <p className="text-xs text-slate-500 mt-1">O rascunho de plano de ensino foi criado com sucesso.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-lg font-bold text-[#102E52] flex items-center gap-2">
                                <UserPlus className="w-5 h-5 text-[#023E8A]" />
                                Atribuir Professor
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-500 mt-1">
                                Crie um rascunho de plano para <strong className="font-mono text-slate-700">{course.code}</strong> — {course.name}.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-3.5 py-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="teacher" className="text-xs font-semibold text-slate-700">Professor(a) <span className="text-red-500">*</span></Label>
                                <Select value={teacherId} onValueChange={setTeacherId}>
                                    <SelectTrigger className="h-9 rounded-lg border-slate-200 text-xs focus:ring-[#023E8A]">
                                        <SelectValue placeholder="Selecione um professor..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {teachers.map(t => (
                                            <SelectItem key={t.id} value={t.id} className="text-xs">{t.name || "Sem nome"}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-700">Cursos / Graduações <span className="text-red-500">*</span></Label>
                                <div className="grid grid-cols-1 gap-1 max-h-[160px] overflow-y-auto p-2 border border-slate-200/80 rounded-lg bg-slate-50/50">
                                    {organizations.map(o => (
                                        <div key={o.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100/60 transition-colors">
                                            <Checkbox 
                                                id={`org-${o.id}`} 
                                                checked={organizationIds.includes(o.id)}
                                                onCheckedChange={() => toggleOrganization(o.id)}
                                                className="data-[state=checked]:bg-[#023E8A] data-[state=checked]:border-[#023E8A]"
                                            />
                                            <Label 
                                                htmlFor={`org-${o.id}`}
                                                className="text-xs font-medium cursor-pointer leading-none text-slate-700"
                                            >
                                                {o.name}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] text-slate-400 italic">Os campos TURMA e CURSO serão configurados com base nesta seleção.</p>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="semester" className="text-xs font-semibold text-slate-700">Semestre Letivo <span className="text-red-500">*</span></Label>
                                <Input 
                                    id="semester" 
                                    value={semester} 
                                    onChange={(e) => setSemester(e.target.value)} 
                                    placeholder="Ex: 2026.1"
                                    className="h-9 rounded-lg border-slate-200 text-xs focus-visible:ring-[#023E8A]"
                                />
                            </div>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setOpen(false)}
                                className="h-9 px-4 text-xs font-semibold text-slate-600 border-slate-200 hover:bg-slate-50 rounded-lg"
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleAssign}
                                disabled={isAssigning || !teacherId || organizationIds.length === 0}
                                className="h-9 bg-[#023E8A] hover:bg-[#023E8A]/90 text-white font-bold px-4 text-xs rounded-lg"
                            >
                                {isAssigning ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <UserPlus className="w-3.5 h-3.5 mr-1.5" />}
                                Criar Rascunho
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
