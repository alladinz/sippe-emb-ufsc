"use client";

import { useState, useMemo, useTransition, useEffect } from "react";
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
    TableFilters,
    TableBulkActions
} from "@/components/table";
import { useTable } from "@/hooks/table/useTable";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
    Eye, 
    Archive, 
    Trash2, 
    FilterX
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArchiveButton } from "./archive-button";
import { bulkDeletePlansAction } from "../actions";
import { useRouter, usePathname } from "next/navigation";
import { confirmDialog, toastError, toastSuccess } from "@/lib/swal";
import { StatusBadge } from "@/components/dashboard/status-badge";

interface Plan {
    id: string;
    status: string;
    semester: string | null;
    updatedAt: string | Date;
    user: { name: string };
    organization: { name: string };
    courses: { name: string; classIdentifier?: string | null }[];
}

interface CentralArchiveTableProps {
    plans: Plan[];
    initialQuery?: string;
}

export function CentralArchiveTable({ plans, initialQuery = "" }: CentralArchiveTableProps) {
    const [, startTransition] = useTransition();
    const router = useRouter();
    const pathname = usePathname();
    const [showFilters, setShowFilters] = useState(false);
    const [teacherSearch, setTeacherSearch] = useState("");

    const {
        page, limit, search, filters, selectedIds, density,
        setPage, setLimit, setSearch, setFilters, toggleSelect, toggleSelectAll, clearSelection
    } = useTable({ id: 'central-archive', initialLimit: 20 });

    // Sync search from URL if needed, but here it's passed as initialQuery
    useEffect(() => {
        if (initialQuery && !search) {
            setSearch(initialQuery);
        }
    }, [initialQuery, search, setSearch]);

    // Get unique values for filters
    const uniqueTeachers = useMemo(() => Array.from(new Set(plans.map(p => p.user?.name).filter(Boolean))).sort(), [plans]);
    const uniqueSemesters = useMemo(() =>
        Array.from(new Set(plans.map(p => p.semester).filter((s): s is string => !!s)))
            .sort((a, b) => b.localeCompare(a, undefined, { numeric: true })),
        [plans]
    );

    const filteredTeachers = useMemo(() => {
        if (!teacherSearch.trim()) return uniqueTeachers;
        const q = teacherSearch.toLowerCase();
        return uniqueTeachers.filter(t => t.toLowerCase().includes(q));
    }, [uniqueTeachers, teacherSearch]);

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (filters.semester && filters.semester !== "all") count++;
        if (filters.status && filters.status !== "all") count++;
        if (filters.teacher && filters.teacher !== "all") count++;
        return count;
    }, [filters]);

    const filteredPlans = useMemo(() => {
        const result = plans.filter(p => {
            const query = search.toLowerCase();
            const matchesQuery = !query ||
                p.user?.name?.toLowerCase().includes(query) ||
                p.organization?.name?.toLowerCase().includes(query) ||
                p.semester?.toLowerCase().includes(query) ||
                p.courses?.some(c =>
                    c.name?.toLowerCase().includes(query) ||
                    c.classIdentifier?.toLowerCase().includes(query)
                );

            if (!matchesQuery) return false;

            if (filters.teacher && filters.teacher !== "all" && p.user?.name !== filters.teacher) return false;
            if (filters.semester && filters.semester !== "all" && p.semester !== filters.semester) return false;
            if (filters.status && filters.status !== "all" && p.status !== filters.status) return false;
            
            return true;
        });

        return result;
    }, [plans, search, filters]);

    // Manual pagination for client-side filtering
    const paginatedPlans = useMemo(() => {
        const start = (page - 1) * limit;
        return filteredPlans.slice(start, start + limit);
    }, [filteredPlans, page, limit]);

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        
        const confirmed = await confirmDialog(
            "Excluir permanentemente?",
            `Deseja excluir permanentemente ${selectedIds.length} plano(s) de ensino? Esta ação não pode ser desfeita.`,
            "Excluir",
            "Cancelar",
            true
        );

        if (!confirmed) return;

        startTransition(async () => {
            try {
                await bulkDeletePlansAction(selectedIds);
                clearSelection();
                toastSuccess("Planos excluídos com sucesso");
                router.refresh();
            } catch (error: unknown) {
                toastError(error instanceof Error ? error.message : "Erro ao excluir planos");
            }
        });
    };

    return (
        <TableShell>
            <TableToolbar 
                title="Arquivo Central"
                count={filteredPlans.length}
                searchValue={search}
                onSearchChange={setSearch}
                onClearSearch={() => { setSearch(""); router.replace(pathname); }}
                onToggleFilters={() => setShowFilters(!showFilters)}
                showFilters={showFilters}
                activeFiltersCount={activeFiltersCount}
            />

            <TableFilters isOpen={showFilters} containerClassName="flex flex-col gap-3">
                {/* Semestre Pills */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <span className="text-xs text-slate-500 font-bold w-20 shrink-0">Semestre:</span>
                    <div className="flex gap-2 flex-wrap items-center">
                        <button
                            type="button"
                            onClick={() => setFilters({ ...filters, semester: undefined })}
                            className={cn(
                                "inline-flex items-center text-xs px-3 py-1 rounded-full border transition-all duration-150 cursor-pointer font-bold",
                                !filters.semester || filters.semester === "all"
                                    ? "bg-[#023E8A] text-white border-[#023E8A]"
                                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                            )}
                        >
                            Todos
                        </button>
                        {uniqueSemesters.map(s => {
                            const isSelected = filters.semester === s;
                            return (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setFilters({ ...filters, semester: isSelected ? undefined : s })}
                                    className={cn(
                                        "inline-flex items-center text-xs px-3 py-1 rounded-full border transition-all duration-150 cursor-pointer font-bold",
                                        isSelected
                                            ? "bg-[#023E8A] text-white border-[#023E8A]"
                                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                    )}
                                >
                                    {s}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Status Pills */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <span className="text-xs text-slate-500 font-bold w-20 shrink-0">Status:</span>
                    <div className="flex gap-2 flex-wrap items-center">
                        <button
                            type="button"
                            onClick={() => setFilters({ ...filters, status: undefined })}
                            className={cn(
                                "inline-flex items-center text-xs px-3 py-1 rounded-full border transition-all duration-150 cursor-pointer font-bold",
                                !filters.status || filters.status === "all"
                                    ? "bg-[#023E8A] text-white border-[#023E8A]"
                                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                            )}
                        >
                            Todos
                        </button>
                        {[
                            { key: "approved", label: "Aprovado" },
                            { key: "archived", label: "Arquivado" },
                        ].map(st => {
                            const isSelected = filters.status === st.key;
                            return (
                                <button
                                    key={st.key}
                                    type="button"
                                    onClick={() => setFilters({ ...filters, status: isSelected ? undefined : st.key })}
                                    className={cn(
                                        "inline-flex items-center text-xs px-3 py-1 rounded-full border transition-all duration-150 cursor-pointer font-bold",
                                        isSelected
                                            ? "bg-[#023E8A] text-white border-[#023E8A]"
                                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                    )}
                                >
                                    {st.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Professor Filter */}
                <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 pt-1 border-t border-slate-100">
                    <span className="text-xs text-slate-500 font-bold w-20 shrink-0 sm:pt-1.5">Professor:</span>
                    <div className="flex flex-col gap-2 flex-1 min-w-0">
                        {uniqueTeachers.length > 6 && (
                            <div className="w-full sm:w-64">
                                <input
                                    type="text"
                                    placeholder="Filtrar por nome do professor..."
                                    value={teacherSearch}
                                    onChange={(e) => setTeacherSearch(e.target.value)}
                                    className="w-full px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#023E8A] placeholder:text-slate-400"
                                />
                            </div>
                        )}
                        <div className="flex gap-2 flex-wrap items-center max-h-28 overflow-y-auto pr-1">
                            <button
                                type="button"
                                onClick={() => setFilters({ ...filters, teacher: undefined })}
                                className={cn(
                                    "inline-flex items-center text-xs px-3 py-1 rounded-full border transition-all duration-150 cursor-pointer font-bold",
                                    !filters.teacher || filters.teacher === "all"
                                        ? "bg-[#023E8A] text-white border-[#023E8A]"
                                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                )}
                            >
                                Todos
                            </button>
                            {typeof filters.teacher === "string" && filters.teacher !== "all" && !filteredTeachers.includes(filters.teacher) && (
                                <button
                                    type="button"
                                    onClick={() => setFilters({ ...filters, teacher: undefined })}
                                    className="inline-flex items-center text-xs px-3 py-1 rounded-full border transition-all duration-150 cursor-pointer font-bold bg-[#023E8A] text-white border-[#023E8A]"
                                >
                                    {filters.teacher}
                                </button>
                            )}
                            {filteredTeachers.map(t => {
                                const isSelected = filters.teacher === t;
                                return (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setFilters({ ...filters, teacher: isSelected ? undefined : t })}
                                        className={cn(
                                            "inline-flex items-center text-xs px-3 py-1 rounded-full border transition-all duration-150 cursor-pointer font-bold",
                                            isSelected
                                                ? "bg-[#023E8A] text-white border-[#023E8A]"
                                                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                        )}
                                    >
                                        {t}
                                    </button>
                                );
                            })}
                            {filteredTeachers.length === 0 && teacherSearch && (
                                <span className="text-xs text-slate-400 italic py-1">Nenhum professor encontrado com esse nome.</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Clear filters row */}
                {(activeFiltersCount > 0 || search) && (
                    <div className="flex justify-end pt-1 border-t border-slate-100">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                                setFilters({});
                                setTeacherSearch("");
                            }}
                            className="h-8 text-xs font-bold text-slate-500 hover:text-slate-900 gap-1.5"
                        >
                            <FilterX className="w-3.5 h-3.5" />
                            Limpar Filtros
                        </Button>
                    </div>
                )}
            </TableFilters>

            <div className="px-4 pb-2">
                <TableBulkActions 
                    selectedCount={selectedIds.length}
                    onClearSelection={clearSelection}
                    actions={
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleBulkDelete}
                            className="text-white hover:bg-white/10 gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Excluir Selecionados
                        </Button>
                    }
                />
            </div>

            <TableContainer density={density}>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/75 border-b border-slate-200">
                            <TableHead className="w-12">
                                <Checkbox 
                                    checked={paginatedPlans.length > 0 && selectedIds.length === paginatedPlans.length}
                                    onCheckedChange={() => toggleSelectAll(paginatedPlans.map(p => p.id))}
                                />
                            </TableHead>
                            <TableHead className="text-xs font-bold text-slate-600 uppercase tracking-wider py-3">Disciplina</TableHead>
                            <TableHead className="text-xs font-bold text-slate-600 uppercase tracking-wider py-3">Turma</TableHead>
                            <TableHead className="text-xs font-bold text-slate-600 uppercase tracking-wider py-3">Professor</TableHead>
                            <TableHead className="text-xs font-bold text-slate-600 uppercase tracking-wider py-3">Semestre</TableHead>
                            <TableHead className="text-xs font-bold text-slate-600 uppercase tracking-wider py-3">Status</TableHead>
                            <TableHead className="text-xs font-bold text-slate-600 uppercase tracking-wider py-3">Modificação</TableHead>
                            <TableHead className="text-xs font-bold text-slate-600 uppercase tracking-wider text-right py-3">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedPlans.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="p-0">
                                    <TableEmptyState 
                                        title={plans.length === 0 ? "Arquivo vazio" : "Nenhum plano encontrado"}
                                        description={plans.length === 0 
                                            ? "Planos de ensino aprovados e encerrados aparecerão aqui."
                                            : "Não encontramos nenhum plano com os filtros aplicados."
                                        }
                                        icon={plans.length === 0 ? <Archive className="h-12 w-12 text-slate-200" /> : undefined}
                                        actionLabel={Object.keys(filters).length > 0 || search ? "Limpar filtros" : undefined}
                                        onAction={() => { setFilters({}); setSearch(""); router.replace(pathname); }}
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedPlans.map((plan) => (
                                <TableRow key={plan.id} className={cn(
                                    "transition-colors",
                                    selectedIds.includes(plan.id) ? "bg-slate-50" : "hover:bg-slate-50/30"
                                )}>
                                    <TableCell>
                                        <Checkbox 
                                            checked={selectedIds.includes(plan.id)}
                                            onCheckedChange={() => toggleSelect(plan.id)}
                                        />
                                    </TableCell>
                                    <TableCell className="font-semibold text-slate-900">
                                        <div className="flex flex-col">
                                            <span>{plan.courses?.[0]?.name || "Sem Disciplina"}</span>
                                            <span className="text-[10px] text-slate-500 font-normal uppercase">{plan.organization.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-slate-500">
                                        {plan.courses?.[0]?.classIdentifier || "-"}
                                    </TableCell>
                                    <TableCell className="font-medium text-slate-700">{plan.user.name}</TableCell>
                                    <TableCell className="text-slate-600">{plan.semester}</TableCell>
                                    <TableCell>
                                        <StatusBadge status={plan.status} />
                                    </TableCell>
                                    <TableCell className="text-slate-500 text-xs">
                                        {new Date(plan.updatedAt).toLocaleDateString('pt-BR')}
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Link href={`/dashboard/study-plans/${plan.id}/preview`}>
                                            <Button size="sm" variant="ghost" className="gap-2 h-8">
                                                <Eye className="w-4 h-4" />
                                                Visualizar
                                            </Button>
                                        </Link>
                                        {plan.status === "approved" && (
                                            <ArchiveButton id={plan.id} />
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination 
                total={filteredPlans.length}
                page={page}
                limit={limit}
                onPageChange={setPage}
                onLimitChange={setLimit}
            />
        </TableShell>
    );
}
