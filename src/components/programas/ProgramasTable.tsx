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
import { Button } from "@/components/ui/button";
import { ArrowRight, GraduationCap, Search } from "lucide-react";
import Link from "next/link";
import { getProgramaStatusBadge } from "../../utils/programaStatus";
import { CompletudeBadge } from "./CompletudeBadge";
import type { ProgramaListItem } from "../../types/programaEnsino";

interface ProgramasTableProps {
    programas: ProgramaListItem[];
    isLoading: boolean;
    hasError: boolean;
    onRetry: () => void;
    hasFiltersActive?: boolean;
}

export function ProgramasTable({ programas, isLoading, hasError, onRetry, hasFiltersActive = false }: ProgramasTableProps) {
    const { density } = useTable({ id: 'programas-table' });

    return (
        <TableShell>
            <TableContainer density={density}>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/50">
                            <TableHead>Disciplina</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Preenchimento</TableHead>
                            <TableHead>Atualizado em</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><div className="h-4 w-48 bg-slate-200 animate-pulse rounded" /></TableCell>
                                    <TableCell><div className="h-4 w-24 bg-slate-200 animate-pulse rounded-full" /></TableCell>
                                    <TableCell><div className="h-4 w-32 bg-slate-200 animate-pulse rounded" /></TableCell>
                                    <TableCell><div className="h-4 w-28 bg-slate-200 animate-pulse rounded" /></TableCell>
                                    <TableCell className="text-right"><div className="h-8 w-8 bg-slate-200 animate-pulse rounded ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : hasError ? (
                            <TableRow>
                                <TableCell colSpan={5} className="p-0">
                                    <div className="py-10 text-center flex flex-col items-center">
                                        <p className="text-slate-500 mb-4">Erro ao carregar programas.</p>
                                        <Button variant="outline" onClick={onRetry}>Tentar Novamente</Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : programas.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="p-0">
                                    {hasFiltersActive ? (
                                        <TableEmptyState 
                                            icon={<Search className="w-8 h-8 text-slate-400" />}
                                            title="Nenhum programa encontrado"
                                            description="Tente ajustar os filtros ou o termo de busca."
                                        />
                                    ) : (
                                        <TableEmptyState 
                                            icon={<GraduationCap className="w-8 h-8 text-slate-400" />}
                                            title="Nenhum programa de ensino criado ainda"
                                            description="Clique em 'Novo Programa' para criar o programa de ensino de uma disciplina."
                                        />
                                    )}
                                </TableCell>
                            </TableRow>
                        ) : (
                            programas.map((programa) => {
                                const statusInfo = getProgramaStatusBadge(programa.status);
                                return (
                                    <TableRow key={programa.id} className="hover:bg-slate-50/30 transition-colors">
                                        <TableCell>
                                            <p className="font-medium text-slate-900">{programa.nome_disciplina}</p>
                                            <p className="text-xs text-slate-400">{programa.codigo_disciplina}</p>
                                            {programa.cursos_vinculados.length > 0 && (
                                                <div className="flex gap-1 mt-1">
                                                    {programa.cursos_vinculados.slice(0, 2).map(c => (
                                                        <span key={c} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                                            {c}
                                                        </span>
                                                    ))}
                                                    {programa.cursos_vinculados.length > 2 && (
                                                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                                            +{programa.cursos_vinculados.length - 2} mais
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${statusInfo.colors.bg} ${statusInfo.colors.text} ${statusInfo.colors.border}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.colors.dot}`} />
                                                {statusInfo.label}
                                            </span>
                                        </TableCell>
                                        <TableCell className="w-[140px]">
                                            <CompletudeBadge value={programa.completude} showLabel={false} />
                                        </TableCell>
                                        <TableCell className="text-slate-500 text-sm">
                                            {new Date(programa.updated_at).toLocaleString('pt-BR')}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link href={`/dashboard/programas-ensino/${programa.id}`}>
                                                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium flex items-center gap-1 ml-auto">
                                                    Abrir <ArrowRight className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </TableShell>
    );
}
