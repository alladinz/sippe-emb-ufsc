"use client";

import { useState, useEffect } from "react";
import { Plus as PlusIcon, Search as MagnifyingGlassIcon, X as XMarkIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { programasEnsinoApi } from "@/services/programasEnsinoApi";
import { StatsBar } from "@/components/programas/StatsBar";
import { ProgramasTable } from "@/components/programas/ProgramasTable";
import { CreateProgramaModal } from "@/components/programas/CreateProgramaModal";
import { TablePagination } from "@/components/table";
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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        Programas de Ensino
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Gerencie os programas de ensino das disciplinas do departamento.
                    </p>
                </div>
                { (isChef || isComissao) && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Novo Programa
                    </button>
                )}
            </div>

            <StatsBar programas={programas} total={total} />

            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
                <div className="flex flex-col gap-3">
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar por disciplina ou código..."
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <XMarkIcon className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-500 font-medium mr-1">
                            Status:
                        </span>
                        {[
                            { value: 'all',       label: 'Todos'              },
                            { value: 'draft',     label: 'Rascunho'           },
                            { value: 'submitted', label: 'Aguardando'         },
                            { value: 'approved',  label: 'Aprovado'           },
                            { value: 'rejected',  label: 'Devolvido'          },
                            { value: 'archived',  label: 'Arquivado'          },
                        ].map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setStatusFilter(opt.value)}
                                className={`text-xs px-3 py-1 rounded-full border transition-colors font-medium ${statusFilter === opt.value
                                    ? 'bg-gray-900 text-white border-gray-900'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
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
