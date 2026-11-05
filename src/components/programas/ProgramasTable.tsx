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
import { StatusBadge } from "@/components/dashboard/status-badge";
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
                        <TableRow className="bg-slate-50/75 border-b border-slate-200">
                            <TableHead className="text-xs font-bold text-slate-600 uppercase tracking-wider py-3">
                                Disciplina
                            </TableHead>
                            <TableHead className="text-xs font-bold text-slate-600 uppercase tracking-wider py-3">
                                Status
                            </TableHead>
                            <TableHead className="text-xs font-bold text-slate-600 uppercase tracking-wider py-3">
                                Atualizado em
                            </TableHead>
                            <TableHead className="text-xs font-bold text-slate-600 uppercase tracking-wider text-right py-3">
                                Ações
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i} className="border-b border-slate-100">
                                    <TableCell><div className="h-4 w-48 bg-slate-200 animate-pulse rounded" /></TableCell>
                                    <TableCell><div className="h-4 w-24 bg-slate-200 animate-pulse rounded-full" /></TableCell>
                                    <TableCell><div className="h-4 w-28 bg-slate-200 animate-pulse rounded" /></TableCell>
                                    <TableCell className="text-right"><div className="h-8 w-8 bg-slate-200 animate-pulse rounded ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : hasError ? (
                            <TableRow>
                                <TableCell colSpan={4} className="p-0">
                                    <div className="py-12 text-center flex flex-col items-center">
                                        <p className="text-slate-500 mb-4 text-sm font-normal">Erro ao carregar programas de ensino.</p>
                                        <Button variant="outline" onClick={onRetry} className="font-bold">
                                            Tentar Novamente
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : programas.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="p-0">
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
                            programas.map((programa) => (
                                <TableRow key={programa.id} className="hover:bg-slate-50/60 transition-colors border-b border-slate-100">
                                    <TableCell>
                                        <p className="font-bold text-slate-900">{programa.nome_disciplina}</p>
                                        <p className="text-xs text-slate-400 font-mono font-bold mt-0.5">{programa.codigo_disciplina}</p>
                                        {programa.cursos_vinculados && programa.cursos_vinculados.length > 0 && (
                                            <div className="flex gap-1 mt-1.5 flex-wrap">
                                                {programa.cursos_vinculados.slice(0, 2).map(c => (
                                                    <span key={c} className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200/60">
                                                        {c}
                                                    </span>
                                                ))}
                                                {programa.cursos_vinculados.length > 2 && (
                                                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200/60">
                                                        +{programa.cursos_vinculados.length - 2} mais
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge status={programa.status} />
                                    </TableCell>
                                    <TableCell className="text-slate-500 text-xs">
                                        {new Date(programa.updated_at).toLocaleString('pt-BR')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {programa.status === 'archived' || programa.status === 'approved' ? (
                                            <Link href={`/dashboard/programas-ensino/${programa.id}/visualizar`}>
                                                <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-bold gap-1 ml-auto">
                                                    Visualizar <ArrowRight className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                        ) : (
                                            <Link href={`/dashboard/programas-ensino/${programa.id}`}>
                                                <Button variant="ghost" size="sm" className="text-[#023E8A] hover:text-[#023E8A] hover:bg-blue-50 font-bold gap-1 ml-auto">
                                                    Abrir <ArrowRight className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                        )}
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
