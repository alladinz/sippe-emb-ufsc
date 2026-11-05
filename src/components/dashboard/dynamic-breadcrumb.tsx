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
    "programas-ensino": "Programas de ensino",
    "coordinator": "Revisão de planos",
    "revisao-programas": "Revisão de programas",
    "chef": "Visão geral",
    "secretary": "Arquivo Central",
    "preview": "Visualizar",
    "visualizar": "Visualizar",
    "edit": "Editar",
};

export function DynamicBreadcrumb() {
    const pathname = usePathname();
    const pathSegments = pathname.split("/").filter(segment => segment !== "");

    // Don't show on root dashboard
    if (pathSegments.length <= 1 && pathSegments[0] === "dashboard") {
        return null;
    }

    // Don't show on study-plans detail/edit pages or programas-ensino detail/edit pages 
    // because they implement their own or user asked to keep the custom one.
    // Wait, study-plans doesn't implement its own? Actually we shouldn't touch study-plans if user just complained about programas-ensino.
    if (pathSegments.length >= 3 && pathSegments[1] === "programas-ensino") {
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
                                    <BreadcrumbPage className="font-bold text-slate-900">
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
