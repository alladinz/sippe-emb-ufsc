"use client";

import { useState, useEffect } from "react";
import { Plus as PlusIcon, Search as MagnifyingGlassIcon, X as XMarkIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { programasEnsinoApi } from "@/services/programasEnsinoApi";
import { StatsBar } from "@/components/programas/StatsBar";
import { ProgramasTable } from "@/components/programas/ProgramasTable";
import { CreateProgramaModal } from "@/components/programas/CreateProgramaModal";
import { TablePagination } from "@/components/table";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { cn } from "@/lib/utils";
import type { ProgramaListItem } from "@/types/programaEnsino";

export function ProgramasEnsinoClient({ isChef, isComissao = false }: { isChef: boolean; isComissao?: boolean }) {
    const router = useRouter();
    const [programas, setProgramas] = useState<ProgramaListItem[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (isLoading) setHasError(true);
        }, 8000);

        setIsLoading(true);
        setHasError(false);

        programasEnsinoApi.list({
            status: statusFilter !== 'all' ? statusFilter : undefined,
            search: search || undefined,
            page,
            limit,
        })
        .then(res => {
            setProgramas(res.data);
            setTotal(res.total);
        })
        .catch(() => setHasError(true))
        .finally(() => {
            setIsLoading(false);
            clearTimeout(timeout);
        });

        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, statusFilter, page, limit]);

    // Reset page when filters change
    useEffect(() => { setPage(1); }, [search, statusFilter]);

    return (
        <div className="space-y-6 pb-8">
            <PageHeader
                title="Programas de Ensino"
                description="Gerencie os programas de ensino das disciplinas do departamento."
                action={
                    (isChef || isComissao) && (
                        <Button
                            onClick={() => setShowCreateModal(true)}
                            className="gap-2 bg-[#023E8A] hover:bg-[#023E8A]/90 text-white font-bold rounded-lg h-9"
                        >
                            <PlusIcon className="w-4 h-4" />
                            Novo Programa
                        </Button>
                    )
                }
            />

            <StatsBar programas={programas} total={total} isLoading={isLoading} />

            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-md">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar por disciplina ou código..."
                            className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#023E8A] focus:border-transparent transition-all"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                title="Limpar busca"
                            >
                                <XMarkIcon className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs text-slate-500 font-bold mr-1">
                            Status:
                        </span>
                        {[
                            { value: 'all',       label: 'Todos'      },
                            { value: 'draft',     label: 'Rascunho'   },
                            { value: 'submitted', label: 'Aguardando' },
                            { value: 'approved',  label: 'Aprovado'   },
                            { value: 'rejected',  label: 'Devolvido'  },
                            { value: 'archived',  label: 'Arquivado'  },
                        ].map(opt => (
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

            <div className="flex flex-col gap-4">
                <ProgramasTable
                    programas={programas}
                    isLoading={isLoading}
                    hasError={hasError}
                    onRetry={() => setPage(p => p)}
                    hasFiltersActive={search !== '' || statusFilter !== 'all'}
                />

                {!isLoading && !hasError && total > 0 && (
                    <TablePagination
                        total={total}
                        page={page}
                        limit={limit}
                        onPageChange={setPage}
                        onLimitChange={setLimit}
                    />
                )}
            </div>

            {showCreateModal && (
                <CreateProgramaModal
                    onClose={() => setShowCreateModal(false)}
                    onCreated={(programa) => {
                        setShowCreateModal(false);
                        router.push(`/dashboard/programas-ensino/${programa.id}`);
                    }}
                />
            )}
        </div>
    );
}
