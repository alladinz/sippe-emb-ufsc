"use client";

import { authClient } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";
import { useState } from "react";
import { swalLoading, MySwal } from "@/lib/swal";

export function LogoutButton() {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);

    const handleLogout = async () => {
        swalLoading("Saindo do sistema...");
        setIsPending(true);
        try {
            await authClient.signOut({
                fetchOptions: {
                    onSuccess: () => {
                        MySwal.close();
                        router.push("/login");
                        router.refresh();
                    },
                },
            });
        } catch (error) {
            console.error("Logout failed:", error);
            MySwal.close();
            setIsPending(false);
        }
    };

    return (
        <Button 
            variant="ghost" 
            size="sm" 
            className="text-slate-500 hover:text-red-600 hover:bg-red-50"
            onClick={handleLogout}
            disabled={isPending}
        >
            {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
                <LogOut className="w-4 h-4 mr-2" />
            )}
            Sair
        </Button>
    );
}
