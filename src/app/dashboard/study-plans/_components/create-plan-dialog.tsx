"use client";

import { useState, useTransition, useMemo } from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
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
import { Plus, Loader2, BookOpen, Search } from "lucide-react";
import { createStudyPlanFromSelectionAction } from "../actions";
import { toastError, toastSuccess, toastWarning } from "@/lib/swal";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface CreatePlanDialogProps {
    courses: { id: string, code: string, name: string }[];
    organizations: { id: string, name: string }[];
    activeSemester: string;
}

export function CreatePlanDialog({ courses, organizations, activeSemester }: CreatePlanDialogProps) {
    const [open, setOpen] = useState(false);
    const [isCreating, startTransition] = useTransition();
    const [courseId, setCourseId] = useState("");
    const [organizationIds, setOrganizationIds] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const router = useRouter();

    // Helper to normalize strings (remove accents)
    const normalizeString = (str: string) => {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

    const filteredCourses = useMemo(() => {
        if (!searchTerm) return courses;
        const term = normalizeString(searchTerm);
        return courses.filter(c => 
            normalizeString(c.name).includes(term) || 
            normalizeString(c.code).includes(term)
        );
    }, [courses, searchTerm]);

    const toggleOrganization = (id: string) => {
        setOrganizationIds(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleCreate = () => {
        if (!courseId || organizationIds.length === 0) {
            toastWarning("Por favor, selecione a disciplina e ao menos uma graduação.");
            return;
        }

        startTransition(async () => {
            try {
                const result = await createStudyPlanFromSelectionAction(courseId, activeSemester, organizationIds);
                toastSuccess(result.count > 1 
                    ? `${result.count} planos de ensino criados com sucesso!` 
                    : "Plano de ensino criado com sucesso!"
                );
                setOpen(false);
                // Reset states
                setCourseId("");
                setOrganizationIds([]);
                setSearchTerm("");
                router.push(`/dashboard/study-plans/${result.id}`);
            } catch (error: unknown) {
                toastError(error instanceof Error ? error.message : "Erro ao criar plano de ensino");
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val);
            if (!val) {
                setSearchTerm("");
                setCourseId("");
                setOrganizationIds([]);
            }
        }}>
            <DialogTrigger asChild>
                <Button className="gap-2 rounded-sm shadow-sm">
                    <Plus className="w-4 h-4" />
                    Novo Plano de Ensino
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-xl overflow-hidden p-0 border-none shadow-2xl">
                <div className="bg-white p-6 space-y-6">
                <DialogHeader className="space-y-1">
                    <DialogTitle className="text-lg flex items-center gap-2 text-slate-900">
                        <BookOpen className="w-5 h-5 text-brand-blue" />
                        Novo Plano de Ensino
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                        Preencha os campos abaixo para gerar seus planos de ensino.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-5">
                    <div className="space-y-2">
                        <Label htmlFor="course" className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Disciplina</Label>
                        <Select value={courseId} onValueChange={setCourseId}>
                            <SelectTrigger className="w-full h-10 border-slate-200 focus:ring-brand-blue">
                                <SelectValue placeholder="Selecione a disciplina..." />
                            </SelectTrigger>
                            <SelectContent position="popper" sideOffset={4} className="max-h-[350px] p-0 w-[var(--radix-select-trigger-width)]" onPointerDownOutside={(e) => {
                                // Prevent closing when clicking the search input if it's considered outside
                                if (e.target instanceof HTMLElement && e.target.closest('.search-container')) {
                                    e.preventDefault();
                                }
                            }}>
                                <div className="p-2 border-b bg-slate-50/50 sticky top-0 z-10 search-container">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                                        <Input 
                                            placeholder="Buscar nome ou código..." 
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="h-8 pl-8 text-xs border-slate-200 focus-visible:ring-brand-blue bg-white"
                                            autoFocus
                                            onKeyDown={(e) => {
                                                // Prevent select from closing on space or enter in search
                                                if (e.key === ' ' || e.key === 'Enter') {
                                                    e.stopPropagation();
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="max-h-[250px] overflow-y-auto">
                                    {filteredCourses.length === 0 ? (
                                        <div className="py-8 text-center text-xs text-slate-500 italic">Nenhuma disciplina encontrada</div>
                                    ) : (
                                        filteredCourses.map(c => (
                                            <SelectItem key={c.id} value={c.id} className="text-xs py-2 focus:bg-slate-50">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">{c.code}</span>
                                                    <span className="font-medium truncate max-w-[220px]">{c.name}</span>
                                                </div>
                                            </SelectItem>
                                        ))
                                    )}
                                </div>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2.5">
                        <Label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Graduações (PPC)</Label>
                        <div className="grid grid-cols-1 gap-1 max-h-[140px] overflow-y-auto p-2 border border-slate-200 rounded-lg bg-slate-50/30">
                            {organizations.map(o => (
                                <div 
                                    key={o.id} 
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-1.5 rounded-md transition-colors",
                                        organizationIds.includes(o.id) ? "bg-blue-50/50" : "hover:bg-slate-100/50"
                                    )}
                                >
                                    <Checkbox 
                                        id={`prof-org-${o.id}`} 
                                        checked={organizationIds.includes(o.id)}
                                        onCheckedChange={() => toggleOrganization(o.id)}
                                        className="h-4 w-4 rounded-sm border-slate-300 data-[state=checked]:bg-brand-blue data-[state=checked]:border-brand-blue"
                                    />
                                    <Label 
                                        htmlFor={`prof-org-${o.id}`}
                                        className="text-[11px] font-medium cursor-pointer leading-none text-slate-700 flex-1 py-1"
                                    >
                                        {o.name}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="semester" className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Semestre Letivo</Label>
                        <div className="relative">
                            <Input 
                                id="semester" 
                                value={activeSemester} 
                                readOnly
                                className="h-10 bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed text-xs font-semibold pl-3"
                            />
                            <div className="absolute right-3 top-2.5 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-[9px] text-green-600 font-bold uppercase tracking-tight">Ativo</span>
                            </div>
                        </div>
                    </div>
                </div>
                </div>

                <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-200">
                    <Button variant="ghost" onClick={() => setOpen(false)} className="h-9 text-xs font-semibold text-slate-500 hover:text-slate-700">
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleCreate} 
                        disabled={isCreating || !courseId || organizationIds.length === 0}
                        className="bg-brand-blue hover:bg-brand-blue/90 h-9 text-xs px-6 rounded-sm font-bold shadow-sm transition-all active:scale-[0.98]"
                    >
                        {isCreating ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                                Criando...
                            </>
                        ) : (
                            <>
                                <Plus className="w-3.5 h-3.5 mr-2" />
                                Criar Planos
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
