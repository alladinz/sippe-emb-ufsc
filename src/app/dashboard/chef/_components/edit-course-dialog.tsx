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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Loader2, Save } from "lucide-react";
import { updateUniversityCourseAction } from "../actions";
import { toastError, toastSuccess } from "@/lib/swal";

interface UniversityCourse {
    id: string;
    code: string;
    name: string;
    curriculum?: string | null;
    workloadHours?: number | null;
    phase?: number | null;
    syllabus?: string | null;
}

interface EditCourseDialogProps {
    course: UniversityCourse;
}

export function EditCourseDialog({ course }: EditCourseDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSaving, startTransition] = useTransition();
    const [formData, setFormData] = useState({
        name: course.name,
        curriculum: course.curriculum || "",
        workloadHours: course.workloadHours || 0,
        phase: course.phase || 0,
        syllabus: course.syllabus || "",
    });

    const handleSave = () => {
        startTransition(async () => {
            try {
                await updateUniversityCourseAction(course.id, formData);
                setOpen(false);
                toastSuccess("Alterações salvas com sucesso");
            } catch (error: unknown) {
                toastError(error instanceof Error ? error.message : "Erro ao salvar alterações");
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-[#023E8A] hover:bg-slate-100 rounded-lg">
                    <Edit className="w-4 h-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto p-6 rounded-xl border border-slate-200/80 shadow-xl">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold text-[#102E52] flex items-center gap-2">
                        <Edit className="w-5 h-5 text-[#023E8A]" />
                        Editar Disciplina Mestre
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 mt-1">
                        Ajuste os dados base para <strong className="font-mono text-slate-700 font-bold">{course.code}</strong>. Estas alterações afetarão novas atribuições.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3.5 py-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-xs font-semibold text-slate-700">Nome da Disciplina</Label>
                            <Input 
                                id="name" 
                                value={formData.name} 
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className="h-9 rounded-lg border-slate-200 text-xs focus-visible:ring-[#023E8A]"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="curriculum" className="text-xs font-semibold text-slate-700">Currículo (PPC)</Label>
                            <Input 
                                id="curriculum" 
                                value={formData.curriculum} 
                                onChange={(e) => setFormData(prev => ({ ...prev, curriculum: e.target.value }))} 
                                placeholder="ex: 2016, 2025"
                                className="h-9 rounded-lg border-slate-200 text-xs focus-visible:ring-[#023E8A]"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="workload" className="text-xs font-semibold text-slate-700">Carga Horária (h)</Label>
                            <Input 
                                id="workload" 
                                type="number"
                                value={formData.workloadHours} 
                                onChange={(e) => setFormData(prev => ({ ...prev, workloadHours: parseInt(e.target.value) }))}
                                className="h-9 rounded-lg border-slate-200 text-xs focus-visible:ring-[#023E8A]"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="phase" className="text-xs font-semibold text-slate-700">Fase Padrão</Label>
                            <Input 
                                id="phase" 
                                type="number"
                                value={formData.phase} 
                                onChange={(e) => setFormData(prev => ({ ...prev, phase: parseInt(e.target.value) }))}
                                className="h-9 rounded-lg border-slate-200 text-xs focus-visible:ring-[#023E8A]"
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="syllabus" className="text-xs font-semibold text-slate-700">Ementa (Syllabus)</Label>
                        <Textarea 
                            id="syllabus" 
                            value={formData.syllabus} 
                            onChange={(e) => setFormData(prev => ({ ...prev, syllabus: e.target.value }))} 
                            className="min-h-[160px] rounded-lg border-slate-200 text-xs focus-visible:ring-[#023E8A] resize-none"
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
                        onClick={handleSave}
                        disabled={isSaving}
                        className="h-9 bg-[#023E8A] hover:bg-[#023E8A]/90 text-white font-bold px-4 text-xs rounded-lg"
                    >
                        {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                        Salvar Alterações
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
