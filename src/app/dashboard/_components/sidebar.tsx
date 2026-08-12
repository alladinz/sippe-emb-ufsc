"use client";

import { useState } from "react";
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
}

interface NavItem {
    href: string;
    label: string;
    icon: LucideIcon;
    show: boolean;
}

export function Sidebar({ isReviewer, isChef, isAdmin }: SidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const pathname = usePathname();

    const navItems: NavItem[] = [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, show: true },
        { href: "/dashboard/study-plans", label: "Planos de ensino", icon: FileText, show: true },
        { href: "/dashboard/programas-ensino", label: "Programas de ensino", icon: GraduationCap, show: isChef || isReviewer },
        { href: "/dashboard/coordinator", label: "Revisão de planos", icon: ClipboardCheck, show: isReviewer },
        { href: "/dashboard/chef", label: "Visão geral", icon: School, show: isChef },
        { href: "/dashboard/secretary", label: "Arquivo Central", icon: Archive, show: isAdmin },
    ];

    return (
        <aside className={cn(
            "bg-white border-r flex flex-col transition-all duration-300 ease-in-out shrink-0",
            isCollapsed ? "w-20" : "w-64"
        )}>
            <div className={cn("py-6 transition-all", isCollapsed ? "px-4" : "px-6")}>
                <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden group/logo">
                    <div className={cn(
                        "shrink-0 transition-all duration-300 flex items-center justify-center",
                        isCollapsed ? "w-12 h-12" : "w-10 h-10"
                    )}>
                        <Image 
                            src="/brasao_UFSC_JOINVILLE_impressao__vertical_sigla_color.png" 
                            alt="UFSC Logo" 
                            width={120} 
                            height={120}
                            className="w-full h-full object-contain"
                        />
                    </div>
                    {!isCollapsed && (
                        <div className="flex flex-col">
                            <h1 className="font-bold text-brand-blue leading-tight text-xl">
                                SIPPE
                            </h1>
                            <span className="block text-xs font-normal text-slate-500 whitespace-nowrap">
                                Gestão Acadêmica
                            </span>
                        </div>
                    )}
                </Link>
            </div>
            
            <nav className="flex-1 px-3 space-y-1">
                {navItems.filter(item => item.show).map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-label={item.label}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all group relative",
                                isActive 
                                    ? "bg-brand-light/30 text-brand-blue" 
                                    : "text-slate-600 hover:bg-brand-light/10 hover:text-brand-blue",
                                isCollapsed && "justify-center px-0"
                            )}
                        >
                            <div className={cn(
                                "flex items-center justify-center transition-all",
                                isCollapsed && isActive && "bg-brand-light/50 rounded-md p-2 w-10 h-10",
                                isCollapsed && !isActive && "w-10 h-10"
                            )}>
                                <item.icon className={cn(
                                    "w-5 h-5 shrink-0 transition-colors",
                                    isActive ? "text-brand-blue" : "text-slate-400 group-hover:text-brand-blue"
                                )} />
                            </div>
                            
                            {!isCollapsed && <span className="truncate">{item.label}</span>}
                            
                            {isCollapsed && (
                                <div className="absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 group-hover:delay-150 whitespace-nowrap z-50 pointer-events-none shadow-md">
                                    {item.label}
                                    {/* Tooltip Arrow */}
                                    <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 border-y-[4px] border-y-transparent border-r-[4px] border-r-gray-900" />
                                </div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t mt-auto">
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center text-slate-500 hover:text-brand-blue hover:bg-brand-light/10"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5 mr-2" />}
                    {!isCollapsed && "Recolher"}
                </Button>
            </div>
        </aside>
    );
}
