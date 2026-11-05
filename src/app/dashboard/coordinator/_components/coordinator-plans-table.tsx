"use client";

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
} from "@/components/table";
import { useTable } from "@/hooks/table/useTable";
import { Button } from "@/components/ui/button";
import { Eye, Clock } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { cn } from "@/lib/utils";

interface CoordinatorPlan {
    id: string;
    status: string;
    semester: string | null;
    updatedAt: string | Date;
    user: { name: string };
    courses: { name: string; code: string; classIdentifier?: string | null }[];
}

interface CoordinatorPlansTableProps {
    plans: CoordinatorPlan[];
    emptyMessage: string;
    actionLabel: string;
    statusVariant?: "amber" | "blue" | "default";
}

export function CoordinatorPlansTable({
    plans,
    emptyMessage,
    actionLabel,
    statusVariant = "default"
}: CoordinatorPlansTableProps) {
    const { density } = useTable({ id: 'coordinator-plans' });

    if (plans.length === 0) {
        return (
            <div className="bg-white border border-dashed border-slate-200/90 rounded-xl p-6 text-center shadow-2xs">
                <div className="flex flex-col items-center justify-center">
                    <Clock className="h-7 w-7 text-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-700">{emptyMessage}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Quando houver planos nesta etapa, eles aparecerão aqui para sua revisão.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <TableShell>
            <TableContainer density={density}>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/75 border-b border-slate-200">
                            <TableHead className="w-[15%] text-xs font-bold text-slate-600 uppercase tracking-wider py-3">Professor</TableHead>
                            <TableHead className="w-[20%] text-xs font-bold text-slate-600 uppercase tracking-wider py-3">Disciplina</TableHead>
                            <TableHead className="w-[10%] text-xs font-bold text-slate-600 uppercase tracking-wider py-3">Turma</TableHead>
                            <TableHead className="w-[10%] text-xs font-bold text-slate-600 uppercase tracking-wider py-3">Semestre</TableHead>
                            <TableHead className="w-[15%] text-xs font-bold text-slate-600 uppercase tracking-wider py-3">Status</TableHead>
                            <TableHead className="w-[15%] text-xs font-bold text-slate-600 uppercase tracking-wider py-3">Data</TableHead>
                            <TableHead className="text-right w-[15%] text-xs font-bold text-slate-600 uppercase tracking-wider py-3">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {plans.map((plan) => (
                            <TableRow key={plan.id} className="hover:bg-slate-50/60 transition-colors border-b border-slate-100">
                                <TableCell className="font-bold text-slate-900">
                                    {plan.user.name}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-900">{plan.courses?.[0]?.name || "Sem Disciplina"}</span>
                                        <span className="text-xs text-slate-400 font-mono font-bold mt-0.5">{plan.courses?.[0]?.code || "-"}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="font-mono text-xs text-slate-500 font-bold">
                                    {plan.courses?.[0]?.classIdentifier || "-"}
                                </TableCell>
                                <TableCell className="text-slate-600 text-sm">{plan.semester || "-"}</TableCell>
                                <TableCell>
                                    <StatusBadge status={plan.status} />
                                </TableCell>
                                <TableCell className="text-slate-500 text-xs">
                                    {new Date(plan.updatedAt).toLocaleDateString('pt-BR')}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Link href={`/dashboard/study-plans/${plan.id}/preview`}>
                                        <Button
                                            size="sm"
                                            className={cn(
                                                "gap-1.5 h-8 font-bold",
                                                statusVariant === "blue"
                                                    ? "bg-[#023E8A] hover:bg-[#023E8A]/90 text-white"
                                                    : statusVariant === "amber"
                                                    ? "bg-amber-600 hover:bg-amber-700 text-white"
                                                    : ""
                                            )}
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            {actionLabel}
                                        </Button>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </TableShell>
    );
}
