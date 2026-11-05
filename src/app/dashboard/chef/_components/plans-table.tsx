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
    TablePagination,
    TableEmptyState,
} from "@/components/table";
import { useTable } from "@/hooks/table/useTable";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

interface Plan {
    id: string;
    status: string;
    semester: string | null;
    updatedAt: string | Date;
    user: { name: string };
    organization: { name: string };
    courses: { name: string }[];
    turma?: { turma: string } | null;
}

interface PlansTableProps {
    initialPlans: Plan[];
    total: number;
    pageSize: number;
    currentPage: number;
}

export function PlansTable({ initialPlans, total, pageSize, currentPage }: PlansTableProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const { density } = useTable({ id: 'chef-plans-overview' });

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
                                        <StatusBadge status={plan.status} />
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
