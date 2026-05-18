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
    TableToolbar,
    TablePagination,
    TableEmptyState,
} from "@/components/table";
import { useTable } from "@/hooks/table/useTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Clock, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";

interface PlansTableProps {
    initialPlans: any[];
    total: number;
    pageSize: number;
    currentPage: number;
}

export function PlansTable({ initialPlans, total, pageSize, currentPage }: PlansTableProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const { density } = useTable({ id: 'chef-plans-overview' });

    const statusLabels: Record<string, { label: string, color: string, icon: any }> = {
        draft: { label: "Rascunho", color: "bg-slate-100 text-slate-800", icon: Clock },
        submitted: { label: "Nova Submissão", color: "bg-blue-100 text-blue-800", icon: Clock },
        pending_review: { label: "Em Revisão", color: "bg-brand-light/20 text-indigo-800", icon: Clock },
        approved: { label: "Aprovado", color: "bg-green-100 text-green-800", icon: CheckCircle },
        rejected: { label: "Rejeitado", color: "bg-red-100 text-red-800", icon: XCircle },
    };

    const onPageChange = (page: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", page.toString());
        router.push(`/dashboard/chef?${params.toString()}`);
    };

    const onLimitChange = (limit: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("limit", limit.toString());
        params.set("page", "1");
        router.push(`/dashboard/chef?${params.toString()}`);
    };

    return (
        <TableShell>
            <TableContainer density={density}>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/50">
                            <TableHead>Curso / Disciplina</TableHead>
                            <TableHead>Professor</TableHead>
                            <TableHead>Semestre</TableHead>
                            <TableHead>Situação</TableHead>
                            <TableHead>Última Atualização</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialPlans.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="p-0">
                                    <TableEmptyState 
                                        title="Nenhum plano de ensino encontrado"
                                        description="Não encontramos nenhum plano de ensino com os filtros selecionados."
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            initialPlans.map((plan) => (
                                <TableRow key={plan.id} className="hover:bg-slate-50/30 transition-colors">
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-slate-900">{plan.courses?.[0]?.name || "Sem Disciplina"}</span>
                                            <span className="text-xs text-slate-500 uppercase">
                                                {plan.turma ? `Turma ${plan.turma.turma}` : plan.organization.name}
                                            </span>
                                        </div>
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
                                    <TableCell className="text-right">
                                        <Link href={`/dashboard/study-plans/${plan.id}/preview`}>
                                            <Button size="sm" variant="outline" className="gap-2 h-8">
                                                <Eye className="w-4 h-4" />
                                                Visualizar
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination 
                total={total}
                page={currentPage}
                limit={pageSize}
                onPageChange={onPageChange}
                onLimitChange={onLimitChange}
            />
        </TableShell>
    );
}
