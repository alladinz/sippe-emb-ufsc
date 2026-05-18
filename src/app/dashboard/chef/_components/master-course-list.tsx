"use client";

import { useState, useTransition, useMemo, useEffect, useCallback } from "react";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { 
    TableContainer,
    TableShell,
    TableToolbar,
    TablePagination,
    TableEmptyState,
    TableFilters
} from "@/components/table";
import { useTable } from "@/hooks/table/useTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
    Database, 
    RefreshCcw, 
    Loader2, 
    Trash2,
    FilterX
} from "lucide-react";
import { syncMasterDataFolderAction, clearMasterDatabaseAction } from "../actions";
import { AssignmentDialog } from "./assignment-dialog";
import { EditCourseDialog } from "./edit-course-dialog";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { confirmDialog, toastError, toastSuccess, swalLoading, MySwal } from "@/lib/swal";

interface MasterCourse {
    id: string;
    code: string;
    name: string;
    curriculum?: string | null;
    phase?: number | null;
    workloadHours?: number | null;
    graduation?: string | null;
}

interface MasterCourseListProps {
    courses: MasterCourse[];
    teachers: { id: string, name: string | null }[];
    organizations: { id: string, name: string }[];
}

export function MasterCourseList({ courses: initialCourses, teachers, organizations }: MasterCourseListProps) {
    const [isSyncing, startTransition] = useTransition();
    const [showFilters, setShowFilters] = useState(false);

    const {
        page, limit, search, filters, density,
        setPage, setLimit, setSearch, setFilters
    } = useTable({ id: 'master-course-list', initialLimit: 20 });

    // Pagination & Dynamic Data State
    const [masterCourses, setMasterCourses] = useState<MasterCourse[]>(initialCourses || []);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const fetchMasterCourses = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            params.set("page", page.toString());
            params.set("limit", limit.toString());
            if (search) params.set("search", search);
            if (filters.phase && filters.phase !== "all") params.set("phase", filters.phase);
            if (filters.graduation && filters.graduation !== "all") params.set("graduation", filters.graduation);
            if (filters.curriculum && filters.curriculum !== "all") params.set("curriculum", filters.curriculum);

            const res = await fetch(`/api/admin/master-courses?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch courses");
            const data = await res.json();

            setMasterCourses(data.courses);
            setTotal(data.total);
        } catch (error) {
            console.error(error);
            toastError("Erro ao carregar base de disciplinas");
        } finally {
            setIsLoading(false);
        }
    }, [page, limit, search, filters]);

    useEffect(() => {
        fetchMasterCourses();
    }, [fetchMasterCourses]);

    const handleSync = async () => {

        const confirmed = await confirmDialog(
            "Atualizar disciplinas?",
            "Sincroniza as disciplinas a partir da fonte de dados configurada pelo administrador. Continuar?",
            "Atualizar",
            "Cancelar",
            false
        );

        if (!confirmed) return;

        swalLoading("Atualizando base de disciplinas...");
        
        startTransition(async () => {
            try {
                await syncMasterDataFolderAction();
                MySwal.close();
                toastSuccess("Base de disciplinas atualizada com sucesso");
                fetchMasterCourses();
            } catch (error: unknown) {
                MySwal.close();
                toastError(error instanceof Error ? error.message : "Erro ao atualizar disciplinas");
            }
        });
    };

    const handleClear = async () => {
        const confirmed = await confirmDialog(
            "Limpar base de dados?",
            "TEM CERTEZA? Isso irá excluir TODAS as disciplinas da base de dados mestre. Esta ação não pode ser desfeita.",
            "Excluir Tudo",
            "Cancelar",
            true
        );

        if (!confirmed) return;

        swalLoading("Limpando base de dados...");

        startTransition(async () => {
            try {
                await clearMasterDatabaseAction();
                MySwal.close();
                toastSuccess("Base de dados limpa");
                fetchMasterCourses();
            } catch (error: unknown) {
                MySwal.close();
                toastError(error instanceof Error ? error.message : "Erro ao limpar base de dados");
            }
        });
    };

    // Extract unique graduations from data (for filter options)
    const graduations = useMemo(() => {
        const set = new Set<string>();
        masterCourses.forEach(c => {
            if (c.graduation) {
                c.graduation.split(", ").forEach((g: string) => set.add(g));
            }
        });
        return Array.from(set).sort();
    }, [masterCourses]);

    // Extract unique curriculums from data
    const curriculums = useMemo(() => {
        const set = new Set<string>();
        masterCourses.forEach(c => {
            if (c.curriculum) {
                c.curriculum.split(", ").forEach((v: string) => set.add(v));
            }
        });
        return Array.from(set).sort((a, b) => b.localeCompare(a));
    }, [masterCourses]);

    return (
        <div className="space-y-6">
            {/* Header / Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 flex justify-between items-center bg-slate-900 text-white p-6 rounded-xl shadow-lg">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-brand-blue/20 rounded-lg">
                            <Database className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Base de Dados Mestres</h2>
                            <p className="text-indigo-300 text-sm">
                                {total} disciplinas mapeadas em {graduations.length} cursos.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            className="bg-transparent border-red-500/50 hover:bg-red-500/10 text-red-400 hover:text-red-500 h-10 w-10 p-0"
                            onClick={handleClear}
                            disabled={isSyncing}
                        >
                            {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </Button>
                        <Button 
                            variant="outline" 
                            className="bg-brand-blue border-none hover:bg-brand-blue text-white h-10"
                            onClick={handleSync}
                            disabled={isSyncing}
                            title="Atualizar Base de Disciplinas"
                        >
                            {isSyncing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCcw className="w-4 h-4 mr-2" />}
                            Atualizar Base
                        </Button>
                    </div>
                </div>
                
                <div className="bg-white border rounded-xl p-6 shadow-sm flex flex-col justify-center">
                    <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Status da Base</span>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-lg font-semibold text-slate-900">Atualizada</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Deduplicação por código e nome.</p>
                </div>
            </div>

            <TableShell>
                <TableToolbar 
                    count={total}
                    searchValue={search}
                    onSearchChange={setSearch}
                    onClearSearch={() => setSearch("")}
                    onToggleFilters={() => setShowFilters(!showFilters)}
                    showFilters={showFilters}
                />

                <TableFilters isOpen={showFilters}>
                    <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-slate-500 font-bold">Currículo</Label>
                        <Select 
                            value={filters.curriculum || "all"} 
                            onValueChange={(val) => setFilters({ ...filters, curriculum: val === "all" ? undefined : val })}
                        >
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="Currículo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos Currículos</SelectItem>
                                {curriculums.map(c => (
                                    <SelectItem key={c} value={c}>PPC {c}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-slate-500 font-bold">Graduação</Label>
                        <Select 
                            value={filters.graduation || "all"} 
                            onValueChange={(val) => setFilters({ ...filters, graduation: val === "all" ? undefined : val })}
                        >
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="Graduação" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas as Graduações</SelectItem>
                                {graduations.map(g => (
                                    <SelectItem key={g} value={g}>{g}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-slate-500 font-bold">Fase</Label>
                        <Select 
                            value={filters.phase || "all"} 
                            onValueChange={(val) => setFilters({ ...filters, phase: val === "all" ? undefined : val })}
                        >
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="Fase" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas</SelectItem>
                                {[1,2,3,4,5,6,7,8,9,10].map(p => (
                                    <SelectItem key={p} value={p.toString()}>{p}ª Fase</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {Object.keys(filters).length > 0 && (
                        <div className="flex items-end">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setFilters({})}
                                className="h-9 text-slate-500 hover:text-slate-900 gap-2"
                            >
                                <FilterX className="w-4 h-4" />
                                Limpar Filtros
                            </Button>
                        </div>
                    )}
                </TableFilters>

                <TableContainer density={density}>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-24">Código</TableHead>
                                <TableHead>Nome da Disciplina</TableHead>
                                <TableHead>Currículo</TableHead>
                                <TableHead>Fase</TableHead>
                                <TableHead>C.H.</TableHead>
                                <TableHead>Graduações</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="p-0">
                                        <div className="flex flex-col items-center justify-center p-20 gap-4 text-slate-400">
                                            <Loader2 className="w-8 h-8 animate-spin" />
                                            <p className="text-sm">Carregando disciplinas...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : masterCourses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="p-0">
                                        <TableEmptyState 
                                            title="Nenhuma disciplina encontrada"
                                            description={search || Object.keys(filters).length > 0 
                                                ? "Não encontramos nenhuma disciplina com os filtros aplicados."
                                                : "Clique em 'Atualizar Base' para carregar as disciplinas."
                                            }
                                            actionLabel={search || Object.keys(filters).length > 0 ? "Limpar filtros" : "Atualizar Base"}
                                            onAction={search || Object.keys(filters).length > 0 ? () => { setFilters({}); setSearch(""); } : handleSync}
                                        />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                masterCourses.map((course) => (
                                    <TableRow key={course.id} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="font-mono text-xs font-bold text-brand-blue">
                                            {course.code}
                                        </TableCell>
                                        <TableCell className="font-medium text-slate-900">
                                            {course.name}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {course.curriculum?.split(", ").map((c: string) => (
                                                    <Badge key={c} variant="secondary" className="text-[9px] bg-slate-100 text-slate-600 border-slate-200">
                                                        {c}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-[10px]">
                                                {course.phase ? `${course.phase}ª` : "-"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-slate-600 text-xs">
                                            {course.workloadHours}h
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {course.graduation?.split(", ").map((g: string) => (
                                                    <Badge key={g} className="bg-blue-50 text-blue-700 border-blue-100 text-[9px] hover:bg-blue-50">
                                                        {g}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <EditCourseDialog course={course} />
                                                <AssignmentDialog 
                                                    course={course} 
                                                    teachers={teachers} 
                                                    organizations={organizations}
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination 
                    total={total}
                    page={page}
                    limit={limit}
                    onPageChange={setPage}
                    onLimitChange={setLimit}
                />
            </TableShell>
                </div>
                );
                }

