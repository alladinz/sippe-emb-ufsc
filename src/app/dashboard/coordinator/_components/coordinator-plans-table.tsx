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
    TableEmptyState,
} from "@/components/table";
import { useTable } from "@/hooks/table/useTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Clock, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface CoordinatorPlansTableProps {
    plans: any[];
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

    const statusLabels: Record<string, { label: string, variant: string, icon: any }> = {
        draft: { label: "Rascunho", variant: "bg-slate-100 text-slate-800", icon: Clock },
        submitted: { label: "Nova Submissão", variant: "bg-amber-100 text-amber-800 border-amber-200", icon: Clock },
        pending_review: { label: "Em Revisão", variant: "bg-blue-100 text-blue-800 border-blue-200", icon: Clock },
        approved: { label: "Aprovado", variant: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle },
        rejected: { label: "Rejeitado", variant: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
    };

    return (
        <TableShell>
            <TableContainer density={density}>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/50">
                            <TableHead className="w-[15%]">Professor</TableHead>
                            <TableHead className="w-[20%]">Disciplina</TableHead>
                            <TableHead className="w-[10%]">Turma</TableHead>
                            <TableHead className="w-[10%]">Semestre</TableHead>
                            <TableHead className="w-[15%]">Status</TableHead>
                            <TableHead className="w-[15%]">Data</TableHead>
                            <TableHead className="text-right w-[15%]">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {plans.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="p-0">
                                    <TableEmptyState 
                                        title={emptyMessage}
                                        icon={<Clock className="h-12 w-12 text-slate-200" />}
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            plans.map((plan) => (
                                <TableRow key={plan.id} className="hover:bg-slate-50/30 transition-colors">
                                    <TableCell className="font-medium text-slate-900">
                                        {plan.user.name}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-900">{plan.courses?.[0]?.name || "Sem Disciplina"}</span>
                                            <span className="text-xs text-slate-500">{plan.courses?.[0]?.code || "-"}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-slate-500">
                                        {plan.courses?.[0]?.classIdentifier || "-"}
                                    </TableCell>
                                    <TableCell className="text-slate-600">{plan.semester || "-"}</TableCell>
                                    <TableCell>
                                        <Badge className={cn("gap-1.5 border-none", statusLabels[plan.status]?.variant)}>
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
                                    <TableCell className="text-right">
                                        <Link href={`/dashboard/study-plans/${plan.id}/preview`}>
                                            <Button size="sm" className={cn("gap-2 h-8", statusVariant === "blue" ? "bg-brand-blue hover:bg-brand-blue/90" : "")}>
                                                <Eye className="w-4 h-4" />
                                                {actionLabel}
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </TableShell>
    );
}
