"use client";

import { useState, useMemo } from "react";
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
    TableEmptyState,
} from "@/components/table";
import { useTable } from "@/hooks/table/useTable";
import { Button } from "@/components/ui/button";
import { Edit, Eye, Search, X, FileText } from "lucide-react";
import Link from "next/link";
import { DeletePlanButton } from "./delete-plan-button";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { cn } from "@/lib/utils";

interface TeacherPlan {
    id: string;
    status: string;
    semester: string | null;
    updatedAt: string | Date;
    courses: { name: string; classIdentifier?: string | null }[];
}

interface TeacherPlansTableProps {
    plans: TeacherPlan[];
}

export function TeacherPlansTable({ plans }: TeacherPlansTableProps) {
    const { density } = useTable({ id: 'teacher-plans' });
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    // Metrics
    const stats = useMemo(() => [
        { label: "Total", value: plans.length, dot: "bg-slate-400" },
        { label: "Rascunho", value: plans.filter(p => p.status === "draft").length, dot: "bg-slate-400" },
        { label: "Aguardando", value: plans.filter(p => p.status === "submitted" || p.status === "pending_review").length, dot: "bg-amber-500" },
        { label: "Aprovados", value: plans.filter(p => p.status === "approved").length, dot: "bg-emerald-500" },
    ], [plans]);

    // Filtering
    const filteredPlans = useMemo(() => {
        return plans.filter((plan) => {
            const courseName = plan.courses?.[0]?.name?.toLowerCase() || "";
            const classIdentifier = plan.courses?.[0]?.classIdentifier?.toLowerCase() || "";
            const matchesSearch = !search ||
                courseName.includes(search.toLowerCase()) ||
                classIdentifier.includes(search.toLowerCase());

            if (!matchesSearch) return false;

            if (statusFilter === "all") return true;
            if (statusFilter === "draft") return plan.status === "draft";
            if (statusFilter === "submitted") return plan.status === "submitted" || plan.status === "pending_review";
            if (statusFilter === "approved") return plan.status === "approved";
            if (statusFilter === "rejected") return plan.status === "rejected";
            return true;
        });
    }, [plans, search, statusFilter]);

    const hasFiltersActive = search !== "" || statusFilter !== "all";

    return (
        <div className="space-y-4">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {stats.map((s) => (
                    <div
                        key={s.label}
                        className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs flex items-center justify-between"
                    >
                        <div>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                {s.label}
                            </p>
                            <p className="text-2xl font-bold text-[#102E52] mt-0.5 leading-none">
                                {s.value}
                            </p>
                        </div>
                        <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", s.dot)} aria-hidden="true" />
                    </div>
                ))}
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por disciplina ou turma..."
                            className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#023E8A] focus:border-transparent transition-all"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                title="Limpar busca"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Status filter pills */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs text-slate-500 font-bold mr-1">
                            Status:
                        </span>
                        {[
                            { value: "all", label: "Todos" },
                            { value: "draft", label: "Rascunho" },
                            { value: "submitted", label: "Aguardando" },
                            { value: "approved", label: "Aprovado" },
                            { value: "rejected", label: "Devolvido" },
                        ].map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => setStatusFilter(opt.value)}
                                className={cn(
                                    "text-xs px-3 py-1 rounded-full border transition-all duration-150 font-bold",
                                    statusFilter === opt.value
                                        ? "bg-[#023E8A] text-white border-[#023E8A]"
                                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                )}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table */}
            <TableShell>
                <TableContainer density={density}>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/75 border-b border-slate-200">
                                <TableHead className="text-xs font-bold text-slate-600 uppercase tracking-wider py-3">
                                    Título / Disciplina
                                </TableHead>
                                <TableHead className="text-xs font-bold text-slate-600 uppercase tracking-wider py-3">
                                    Turma
                                </TableHead>
                                <TableHead className="text-xs font-bold text-slate-600 uppercase tracking-wider py-3">
                                    Semestre
                                </TableHead>
                                <TableHead className="text-xs font-bold text-slate-600 uppercase tracking-wider py-3">
                                    Status
                                </TableHead>
                                <TableHead className="text-xs font-bold text-slate-600 uppercase tracking-wider py-3">
                                    Última Atualização
                                </TableHead>
                                <TableHead className="text-xs font-bold text-slate-600 uppercase tracking-wider text-right py-3">
                                    Ações
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPlans.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="p-0">
                                        {hasFiltersActive ? (
                                            <TableEmptyState
                                                icon={<Search className="w-8 h-8 text-slate-400" />}
                                                title="Nenhum plano encontrado"
                                                description="Tente ajustar a busca ou o filtro de status selecionado."
                                            />
                                        ) : (
                                            <TableEmptyState
                                                icon={<FileText className="w-8 h-8 text-slate-400" />}
                                                title="Nenhum plano de ensino criado"
                                                description="Clique em 'Novo Plano' acima para iniciar a criação de um plano de ensino."
                                            />
                                        )}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPlans.map((plan) => (
                                    <TableRow key={plan.id} className="hover:bg-slate-50/60 transition-colors border-b border-slate-100">
                                        <TableCell className="font-bold text-slate-900">
                                            {plan.courses?.[0]?.name || "Sem Disciplina"}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs text-slate-500 font-bold">
                                            {plan.courses?.[0]?.classIdentifier || "-"}
                                        </TableCell>
                                        <TableCell className="text-slate-600 text-sm">
                                            {plan.semester || "-"}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={plan.status} />
                                        </TableCell>
                                        <TableCell className="text-slate-500 text-xs">
                                            {new Date(plan.updatedAt).toLocaleDateString('pt-BR')}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end items-center gap-1">
                                                {(plan.status === 'draft' || plan.status === 'rejected') && (
                                                    <DeletePlanButton id={plan.id} variant="icon" />
                                                )}
                                                <Link href={`/dashboard/study-plans/${plan.id}`}>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-600 hover:text-[#023E8A] hover:bg-slate-100"
                                                        title="Editar plano"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                        <span className="sr-only">Editar</span>
                                                    </Button>
                                                </Link>
                                                <Link href={`/dashboard/study-plans/${plan.id}/preview`}>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-600 hover:text-[#023E8A] hover:bg-slate-100"
                                                        title="Visualizar plano"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        <span className="sr-only">Visualizar</span>
                                                    </Button>
                                                </Link>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </TableShell>
        </div>
    );
}
