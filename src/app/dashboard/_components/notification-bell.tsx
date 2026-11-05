"use client";

import { useState, useEffect } from "react";
import { Bell, CheckCircle, XCircle, Clock, FileText, Check } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string | null;
    read: boolean;
    planId: string | null;
    programaId: string | null;
    createdAt: string;
}

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const fetchNotifications = async () => {
        try {
            const response = await fetch("/api/notificacoes");
            if (response.ok) {
                const data = await response.json();
                setNotifications(data);
                setUnreadCount(data.filter((n: Notification) => !n.read).length);
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // Poll every 60 seconds
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await fetch(`/api/notificacoes/${id}/lida`, { method: "PATCH" });
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
        }
    };

    const markAllAsRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);

        try {
            await fetch("/api/notificacoes/marcar-todas-lidas", { method: "PATCH" });
        } catch (error) {
            console.error("Failed to mark all as read:", error);
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.read) {
            markAsRead(notification.id);
        }
        if (notification.planId) {
            const editTypes = ['novo_plano', 'plano_rejeitado'];
            const path = editTypes.includes(notification.type)
                ? `/dashboard/study-plans/${notification.planId}`
                : `/dashboard/study-plans/${notification.planId}/preview`;

            router.push(path);
            setIsOpen(false);
        }
        if (notification.programaId) {
            const editTypes = ['programa_devolvido'];
            const path = editTypes.includes(notification.type)
                ? `/dashboard/programas-ensino/${notification.programaId}`
                : `/dashboard/programas-ensino/${notification.programaId}/visualizar`;

            router.push(path);
            setIsOpen(false);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "plano_aprovado":
            case "programa_aprovado":
                return <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />;
            case "plano_rejeitado":
            case "programa_devolvido":
                return <XCircle className="w-4 h-4 text-red-600 shrink-0" />;
            case "nova_submissao":
            case "programa_submetido":
                return <Clock className="w-4 h-4 text-amber-500 shrink-0" />;
            case "novo_plano":
                return <FileText className="w-4 h-4 text-[#023E8A] shrink-0" />;
            default:
                return <Bell className="w-4 h-4 text-slate-500 shrink-0" />;
        }
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative hover:bg-slate-100 rounded-full h-9 w-9 text-slate-600 transition-colors"
                    aria-label={`Notificações ${unreadCount > 0 ? `(${unreadCount} não lidas)` : ''}`}
                >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-80 sm:w-96 p-0 overflow-hidden rounded-xl shadow-xl border border-slate-200/90 bg-white"
            >
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50/80 border-b border-slate-200/80">
                    <div className="flex items-center gap-2">
                        <DropdownMenuLabel className="p-0 font-bold text-sm text-[#102E52]">
                            Notificações
                        </DropdownMenuLabel>
                        {unreadCount > 0 && (
                            <span
                                title={`${unreadCount} notificações não lidas`}
                                aria-label={`${unreadCount} notificações não lidas`}
                                className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold tabular-nums leading-none text-white bg-[#023E8A] rounded-full shadow-2xs"
                            >
                                {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                markAllAsRead();
                            }}
                            className="text-[11px] font-bold text-[#023E8A] hover:text-[#023E8A]/80 flex items-center gap-1 transition-colors"
                        >
                            <Check className="w-3 h-3" />
                            Marcar lidas
                        </button>
                    )}
                </div>

                <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
                    {isLoading ? (
                        <div className="p-4 space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex gap-3 animate-pulse">
                                    <div className="w-4 h-4 bg-slate-200 rounded-full mt-1 shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 bg-slate-200 rounded w-3/4" />
                                        <div className="h-2.5 bg-slate-100 rounded w-full" />
                                        <div className="h-2 bg-slate-100 rounded w-1/3" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="py-10 text-center flex flex-col items-center justify-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                <Bell className="w-5 h-5" />
                            </div>
                            <p className="text-xs font-semibold text-slate-700">Nenhuma notificação</p>
                            <p className="text-[11px] text-slate-400">Você está em dia com todos os avisos.</p>
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <div
                                key={n.id}
                                onClick={() => handleNotificationClick(n)}
                                className={cn(
                                    "flex gap-3 px-4 py-3 cursor-pointer transition-colors text-left",
                                    !n.read
                                        ? "bg-blue-50/40 border-l-3 border-l-[#023E8A] hover:bg-blue-50/60"
                                        : "bg-white hover:bg-slate-50/80"
                                )}
                            >
                                <div className="mt-0.5 shrink-0">
                                    {getIcon(n.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline justify-between gap-2 mb-0.5">
                                        <p className={cn(
                                            "text-xs leading-tight truncate",
                                            !n.read ? "font-bold text-[#102E52]" : "font-semibold text-slate-700"
                                        )}>
                                            {n.title}
                                        </p>
                                        {!n.read && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#023E8A] shrink-0" />
                                        )}
                                    </div>
                                    {n.message && (
                                        <p className="text-xs text-slate-500 line-clamp-2 mb-1 leading-snug">
                                            {n.message}
                                        </p>
                                    )}
                                    <p className="text-[10px] text-slate-400 font-medium">
                                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ptBR })}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
