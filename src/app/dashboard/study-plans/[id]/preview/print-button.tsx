"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function PrintButton() {
    return (
        <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 no-print"
            onClick={() => window.print()}
        >
            <Printer className="w-4 h-4" />
            Baixar PDF / Imprimir
        </Button>
    );
}
