"use client";

import { useEffect, useState } from "react";
import { X, Clock } from "lucide-react";
import { programasEnsinoApi } from "../../services/programasEnsinoApi";

interface HistoricoDrawerProps {
    programaId: string;
    onClose: () => void;
}

interface EventoHistorico {
    tipo_evento: string;
    data_evento: string;
    usuario?: { name: string };
    detalhes?: string;
}

export function HistoricoDrawer({ programaId, onClose }: HistoricoDrawerProps) {
    const [historico, setHistorico] = useState<EventoHistorico[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
        programasEnsinoApi.getHistorico(programaId)
            .then(data => setHistorico(data))
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [programaId]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300);
    };

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") handleClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleClose]);

    const getEventColor = (tipo: string) => {
        switch (tipo) {
            case 'criado': return 'bg-gray-400';
            case 'editado': return 'bg-blue-400';
            case 'submetido': return 'bg-yellow-400';
            case 'aprovado': return 'bg-green-500';
            case 'rejeitado': return 'bg-red-500';
            case 'arquivado': return 'bg-blue-800';
            default: return 'bg-gray-400';
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            {/* Backdrop */}
            <div 
                className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`} 
                onClick={handleClose}
            />

            {/* Drawer */}
            <div 
                className={`relative w-80 max-w-sm bg-white shadow-xl h-full flex flex-col transform transition-transform duration-300 ease-in-out ${isVisible ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-slate-500" />
                        Histórico
                    </h2>
                    <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Clock className="w-6 h-6 text-slate-300 animate-spin" />
                        </div>
                    ) : historico.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-8">Nenhum evento registrado.</p>
                    ) : (
                        <div className="relative pl-4 space-y-6">
                            {/* Timeline line */}
                            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-slate-200" />
                            
                            {historico.map((evento, i) => (
                                <div key={i} className="relative">
                                    <div className={`absolute -left-[21px] w-3 h-3 rounded-full border-2 border-white ${getEventColor(evento.tipo_evento)}`} />
                                    <div>
                                        <p className="text-sm font-medium text-slate-900 capitalize">
                                            {evento.tipo_evento}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {new Date(evento.data_evento).toLocaleString('pt-BR')}
                                        </p>
                                        <p className="text-xs text-slate-600 mt-1">
                                            Por: {evento.usuario?.name || 'Sistema'}
                                        </p>
                                        {evento.detalhes && (
                                            <p className="text-xs text-slate-500 mt-2 p-2 bg-slate-50 rounded italic border">
                                            &quot;{evento.detalhes}&quot;
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
