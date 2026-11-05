"use client";

import { useState, useEffect } from "react";
import {
    LayoutDashboard,
    FileText,
    ClipboardCheck,
    School,
    Archive,
    ChevronLeft,
    ChevronRight,
    LucideIcon,
    GraduationCap
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface SidebarProps {
    isReviewer: boolean;
    isChef: boolean;
    isAdmin: boolean;
    isComissao?: boolean;
}

interface NavItem {
    href: string;
    label: string;
    icon: LucideIcon;
    show: boolean;
}

interface NavGroup {
    id: string;
    title: string;
    items: NavItem[];
}

export function Sidebar({ isReviewer, isChef, isAdmin, isComissao = false }: SidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const pathname = usePathname();

    // Persist sidebar state
    useEffect(() => {
        const saved = localStorage.getItem("sippe_sidebar_collapsed");
        if (saved !== null) {
            setIsCollapsed(saved === "true");
        }
    }, []);

    const toggleCollapse = () => {
        setIsCollapsed(prev => {
            const next = !prev;
            localStorage.setItem("sippe_sidebar_collapsed", String(next));
            return next;
        });
    };

    const navGroups: NavGroup[] = [
        {
            id: "work",
            title: "Área de Trabalho",
            items: [
                { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, show: !isComissao },
                { href: "/dashboard/study-plans", label: "Planos de ensino", icon: FileText, show: !isComissao },
                { href: "/dashboard/programas-ensino", label: "Programas de ensino", icon: GraduationCap, show: isChef || isReviewer || isComissao },
            ],
        },
        {
            id: "approval",
            title: "Fluxo de Aprovação",
            items: [
                { href: "/dashboard/coordinator", label: "Revisão de planos", icon: ClipboardCheck, show: isReviewer && !isComissao },
                { href: "/dashboard/revisao-programas", label: "Revisão de programas", icon: ClipboardCheck, show: (isReviewer || isChef) && !isComissao },
            ],
        },
        {
            id: "admin",
            title: "Administração",
            items: [
                { href: "/dashboard/chef", label: "Visão geral", icon: School, show: isChef && !isComissao },
                { href: "/dashboard/secretary", label: "Arquivo Central", icon: Archive, show: isAdmin && !isComissao },
            ],
        },
    ];

    // Filter out groups with no visible items
    const visibleGroups = navGroups
        .map(group => ({
            ...group,
            items: group.items.filter(item => item.show),
        }))
        .filter(group => group.items.length > 0);

    return (
        <aside className={cn(
            "bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out shrink-0 select-none",
            isCollapsed ? "w-20" : "w-64"
        )}>
            {/* Logo */}
            <div className={cn("py-5 transition-all border-b border-slate-100", isCollapsed ? "px-3" : "px-5")}>
                <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden group/logo">
                    <div className={cn(
                        "shrink-0 transition-all duration-300 flex items-center justify-center",
                        isCollapsed ? "w-12 h-12 mx-auto" : "w-10 h-10"
                    )}>
                        <Image
                            src="/brasao_UFSC_JOINVILLE_impressao__vertical_sigla_color.png"
                            alt="UFSC Logo"
                            width={120}
                            height={120}
                            className="w-full h-full object-contain"
                            priority
                        />
                    </div>
                    {!isCollapsed && (
                        <div className="flex flex-col min-w-0">
                            <h1 className="font-bold text-[#023E8A] leading-tight text-xl tracking-tight">
                                SIPPE
                            </h1>
                            <span className="block text-xs font-normal text-slate-500 whitespace-nowrap truncate">
                                Gestão Acadêmica
                            </span>
                        </div>
                    )}
                </Link>
            </div>

            {/* Navigation Groups */}
            <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
                {visibleGroups.map((group, groupIndex) => (
                    <div key={group.id} className="space-y-1">
                        {/* Section Header */}
                        {!isCollapsed ? (
                            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 pt-2 pb-1">
                                {group.title}
                            </h2>
                        ) : groupIndex > 0 ? (
                            <div className="border-t border-slate-100 my-2 mx-2" aria-hidden="true" />
                        ) : null}

                        {/* Group Items */}
                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        aria-label={item.label}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2 text-sm font-bold rounded-lg transition-all duration-150 group relative outline-none focus-visible:ring-2 focus-visible:ring-brand-blue",
                                            isActive
                                                ? "bg-[#EAF2FE] text-[#023E8A]"
                                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                                            isCollapsed && "justify-center px-0 py-2"
                                        )}
                                    >
                                        <div className={cn(
                                            "flex items-center justify-center transition-all",
                                            isCollapsed && isActive && "bg-[#EAF2FE] rounded-lg p-2 w-10 h-10",
                                            isCollapsed && !isActive && "w-10 h-10"
                                        )}>
                                            <item.icon className={cn(
                                                "w-5 h-5 shrink-0 transition-colors",
                                                isActive ? "text-[#023E8A]" : "text-slate-400 group-hover:text-slate-700"
                                            )} />
                                        </div>

                                        {!isCollapsed && <span className="truncate">{item.label}</span>}

                                        {/* Tooltip on collapsed state */}
                                        {isCollapsed && (
                                            <div className="absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 whitespace-nowrap z-50 pointer-events-none shadow-md">
                                                {item.label}
                                                <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 border-y-[4px] border-y-transparent border-r-[4px] border-r-slate-900" />
                                            </div>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Collapse toggle */}
            <div className="p-3 border-t border-slate-100 mt-auto">
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center text-slate-500 hover:text-[#023E8A] hover:bg-slate-50 font-bold"
                    onClick={toggleCollapse}
                    title={isCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
                >
                    {isCollapsed ? (
                        <ChevronRight className="w-5 h-5" />
                    ) : (
                        <>
                            <ChevronLeft className="w-5 h-5 mr-1.5" />
                            <span>Recolher</span>
                        </>
                    )}
                </Button>
            </div>
        </aside>
    );
}
