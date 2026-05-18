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

interface EditCourseDialogProps {
    course: any;
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
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-brand-blue">
                    <Edit className="w-4 h-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Editar Disciplina Mestre</DialogTitle>
                    <DialogDescription>
                        Ajuste os dados base para <strong>{course.code}</strong>. Estas alterações afetarão novas atribuições.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome da Disciplina</Label>
                            <Input 
                                id="name" 
                                value={formData.name} 
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="curriculum">Currículo (PPC)</Label>
                            <Input 
                                id="curriculum" 
                                value={formData.curriculum} 
                                onChange={(e) => setFormData(prev => ({ ...prev, curriculum: e.target.value }))} 
                                placeholder="ex: 2016, 2025"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="workload">Carga Horária (h)</Label>
                            <Input 
                                id="workload" 
                                type="number"
                                value={formData.workloadHours} 
                                onChange={(e) => setFormData(prev => ({ ...prev, workloadHours: parseInt(e.target.value) }))} 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phase">Fase Padrão</Label>
                            <Input 
                                id="phase" 
                                type="number"
                                value={formData.phase} 
                                onChange={(e) => setFormData(prev => ({ ...prev, phase: parseInt(e.target.value) }))} 
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="syllabus">Ementa (Syllabus)</Label>
                        <Textarea 
                            id="syllabus" 
                            value={formData.syllabus} 
                            onChange={(e) => setFormData(prev => ({ ...prev, syllabus: e.target.value }))} 
                            className="min-h-[200px]"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Salvar Alterações
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
