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
import { Edit, Eye } from "lucide-react";
import Link from "next/link";
import { DeletePlanButton } from "./delete-plan-button";

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

    const statusLabels: Record<string, { label: string, variant: "default" | "secondary" | "destructive" | "outline" }> = {
        draft: { label: "Rascunho", variant: "secondary" },
        submitted: { label: "Enviado", variant: "default" },
        approved: { label: "Aprovado", variant: "outline" },
        rejected: { label: "Rejeitado", variant: "destructive" },
    };

    return (
        <TableShell>
            <TableContainer density={density}>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/50">
                            <TableHead>Título / Disciplina</TableHead>
                            <TableHead>Turma</TableHead>
                            <TableHead>Semestre</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Última Atualização</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {plans.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="p-0">
                                    <TableEmptyState 
                                        title="Nenhum plano de ensino encontrado"
                                        description="Comece criando um novo plano de ensino!"
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            plans.map((plan) => (
                                <TableRow key={plan.id} className="hover:bg-slate-50/30 transition-colors">
                                    <TableCell className="font-medium text-slate-900">
                                        {plan.courses?.[0]?.name || "Sem Disciplina"}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-slate-500">
                                        {plan.courses?.[0]?.classIdentifier || "-"}
                                    </TableCell>
                                    <TableCell className="text-slate-600">{plan.semester || "-"}</TableCell>
                                    <TableCell>
                                        <Badge variant={statusLabels[plan.status]?.variant || "outline"}>
                                            {statusLabels[plan.status]?.label || plan.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-slate-500 text-xs">
                                        {new Date(plan.updatedAt).toLocaleDateString('pt-BR')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            {(plan.status === 'draft' || plan.status === 'rejected') && (
                                                <DeletePlanButton id={plan.id} variant="icon" />
                                            )}
                                            <Link href={`/dashboard/study-plans/${plan.id}`}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar">
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                            <Link href={`/dashboard/study-plans/${plan.id}/preview`}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" title="Visualizar">
                                                    <Eye className="w-4 h-4" />
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
    );
}
