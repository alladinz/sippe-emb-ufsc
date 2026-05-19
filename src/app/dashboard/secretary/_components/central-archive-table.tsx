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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { 
    Eye, 
    Archive, 
    CheckCircle, 
    Trash2, 
    FilterX
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArchiveButton } from "./archive-button";
import { bulkDeletePlansAction } from "../actions";
import { useRouter, usePathname } from "next/navigation";
import { confirmDialog, toastError, toastSuccess } from "@/lib/swal";

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
    const uniqueDisciplines = useMemo(() => Array.from(new Set(plans.map(p => p.courses?.[0]?.name || "Sem Disciplina"))).sort(), [plans]);
    const uniqueTeachers = useMemo(() => Array.from(new Set(plans.map(p => p.user.name))).sort(), [plans]);
    const uniqueSemesters = useMemo(() => Array.from(new Set(plans.map(p => p.semester).filter((s): s is string => !!s))).sort(), [plans]);

    const statusLabels: Record<string, { label: string, color: string, icon: React.ElementType }> = {
        approved: { label: "Aprovado", color: "bg-green-100 text-green-800", icon: CheckCircle },
        archived: { label: "Arquivado", color: "bg-slate-100 text-slate-800", icon: Archive },
    };

    const filteredPlans = useMemo(() => {
        const result = plans.filter(p => {
            const query = search.toLowerCase();
            const matchesQuery = !query || 
                p.user.name.toLowerCase().includes(query) || 
                p.organization.name.toLowerCase().includes(query) ||
                p.semester?.toLowerCase().includes(query) ||
                p.courses?.[0]?.name.toLowerCase().includes(query);

            if (!matchesQuery) return false;

            const discName = p.courses?.[0]?.name || "Sem Disciplina";
            if (filters.discipline && filters.discipline !== "all" && discName !== filters.discipline) return false;
            if (filters.teacher && filters.teacher !== "all" && p.user.name !== filters.teacher) return false;
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
            />

            <TableFilters isOpen={showFilters}>
                <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-slate-500 font-bold">Disciplina</Label>
                    <Select 
                        value={(filters.discipline as string) || "all"} 
                        onValueChange={(val) => setFilters({ ...filters, discipline: val === "all" ? undefined : val })}
                    >
                        <SelectTrigger className="h-9">
                            <SelectValue placeholder="Todas as disciplinas" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas</SelectItem>
                            {uniqueDisciplines.map(d => (
                                <SelectItem key={d} value={d}>{d}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-slate-500 font-bold">Professor</Label>
                    <Select 
                        value={(filters.teacher as string) || "all"} 
                        onValueChange={(val) => setFilters({ ...filters, teacher: val === "all" ? undefined : val })}
                    >
                        <SelectTrigger className="h-9">
                            <SelectValue placeholder="Todos os professores" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            {uniqueTeachers.map(t => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-slate-500 font-bold">Semestre</Label>
                    <Select 
                        value={(filters.semester as string) || "all"} 
                        onValueChange={(val) => setFilters({ ...filters, semester: val === "all" ? undefined : val })}
                    >
                        <SelectTrigger className="h-9">
                            <SelectValue placeholder="Todos os semestres" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            {uniqueSemesters.map(s => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-slate-500 font-bold">Status</Label>
                    <Select 
                        value={(filters.status as string) || "all"} 
                        onValueChange={(val) => setFilters({ ...filters, status: val === "all" ? undefined : val })}
                    >
                        <SelectTrigger className="h-9">
                            <SelectValue placeholder="Todos os status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="approved">Aprovado</SelectItem>
                            <SelectItem value="archived">Arquivado</SelectItem>
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
                        <TableRow className="bg-slate-50/50">
                            <TableHead className="w-12">
                                <Checkbox 
                                    checked={paginatedPlans.length > 0 && selectedIds.length === paginatedPlans.length}
                                    onCheckedChange={() => toggleSelectAll(paginatedPlans.map(p => p.id))}
                                />
                            </TableHead>
                            <TableHead>Disciplina</TableHead>
                            <TableHead>Turma</TableHead>
                            <TableHead>Professor</TableHead>
                            <TableHead>Semestre</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Modificação</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
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
                                        <Badge className={cn("gap-1.5 border-none", statusLabels[plan.status]?.color)}>
                                            {(() => {
                                                const StatusIcon = statusLabels[plan.status]?.icon;
                                                return StatusIcon ? <StatusIcon className="w-3 h-3" /> : null;
                                            })()}
                                            {statusLabels[plan.status]?.label || plan.status}
                                        </Badge>
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
