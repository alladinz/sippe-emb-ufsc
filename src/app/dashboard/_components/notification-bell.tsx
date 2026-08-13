"use client";

import { useState, useEffect } from "react";
import { Bell, CheckCircle, XCircle, ExternalLink } from "lucide-react";
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
        // Update local state immediately for better UX
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
            // New plans and rejected plans should go to the edit page
            // Approved plans and new submissions for chiefs should go to the preview page
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
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case "plano_rejeitado":
            case "programa_devolvido":
                return <XCircle className="w-4 h-4 text-red-500" />;
            case "nova_submissao":
            case "novo_plano":
            case "programa_submetido":
                return <Bell className="w-4 h-4 text-yellow-500" />;
            default:
                return <Bell className="w-4 h-4 text-blue-500" />;
        }
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hover:bg-slate-100 rounded-full">
                    <Bell className="w-5 h-5 text-slate-600" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden rounded-xl shadow-lg border-slate-200">
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50/50 border-b">
                    <DropdownMenuLabel className="p-0 font-bold text-slate-900">Notificações</DropdownMenuLabel>
                    {unreadCount > 0 && (
                        <button 
                            onClick={(e) => { 
                                e.preventDefault();
                                e.stopPropagation(); 
                                markAllAsRead(); 
                            }}
                            className="text-[10px] font-bold text-brand-blue uppercase tracking-wider hover:underline"
                        >
                            Marcar todas como lidas
                        </button>
                    )}
                </div>
                
                <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="py-10 text-center flex flex-col items-center justify-center gap-2">
                            <Bell className="w-8 h-8 text-slate-200" />
                            <p className="text-sm text-slate-500">Nenhuma notificação</p>
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <div 
                                key={n.id}
                                onClick={() => handleNotificationClick(n)}
                                className={`
                                    flex gap-3 px-4 py-3 cursor-pointer transition-colors border-b last:border-0
                                    ${!n.read ? 'bg-blue-50/50 border-l-4 border-l-brand-blue' : 'bg-white hover:bg-slate-50'}
                                `}
                            >
                                <div className="mt-1 flex-shrink-0">
                                    {getIcon(n.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm leading-tight mb-0.5 ${!n.read ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
                                        {n.title}
                                    </p>
                                    <p className="text-xs text-slate-500 line-clamp-2 mb-1">
                                        {n.message}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-medium">
                                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ptBR })}
                                    </p>
                                </div>
                                {n.planId && (
                                    <div className="flex-shrink-0 self-center">
                                        <ExternalLink className="w-3 h-3 text-slate-300" />
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
