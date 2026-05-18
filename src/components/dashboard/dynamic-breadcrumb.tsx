"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
    Breadcrumb, 
    BreadcrumbItem, 
    BreadcrumbLink, 
    BreadcrumbList, 
    BreadcrumbPage, 
    BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import React from "react";

const routeMap: Record<string, string> = {
    "dashboard": "Dashboard",
    "study-plans": "Planos de ensino",
    "coordinator": "Revisão de planos",
    "chef": "Visão Geral (Chefe)",
    "secretary": "Arquivo Central",
    "preview": "Visualizar",
    "edit": "Editar",
};

export function DynamicBreadcrumb() {
    const pathname = usePathname();
    const pathSegments = pathname.split("/").filter(segment => segment !== "");

    // Don't show on root dashboard
    if (pathSegments.length <= 1 && pathSegments[0] === "dashboard") {
        return null;
    }

    return (
        <Breadcrumb className="mb-4">
            <BreadcrumbList>
                {pathSegments.map((segment, index) => {
                    const href = `/${pathSegments.slice(0, index + 1).join("/")}`;
                    const isLast = index === pathSegments.length - 1;
                    
                    // Skip numeric IDs or UUIDs for the label
                    const isId = /^[0-9a-fA-F-]{24,36}$/.test(segment) || /^\d+$/.test(segment);
                    const label = isId ? "Detalhes" : (routeMap[segment] || segment);
                    
                    return (
                        <React.Fragment key={href}>
                            <BreadcrumbItem>
                                {isLast ? (
                                    <BreadcrumbPage className="font-semibold text-slate-900">
                                        {label}
                                    </BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink asChild className="text-slate-500 hover:text-brand-blue transition-colors">
                                        <Link href={href}>{label}</Link>
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                            {!isLast && <BreadcrumbSeparator />}
                        </React.Fragment>
                    );
                })}
            </BreadcrumbList>
        </Breadcrumb>
    );
}
