"use client";

import { authClient } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LogOut, ChevronDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { swalLoading, MySwal } from "@/lib/swal";

interface UserMenuProps {
    user: {
        name: string;
        email: string | null;
        image?: string | null;
    };
    roleLabel: string;
    roleId?: string;
}

export function UserMenu({ user, roleLabel, roleId }: UserMenuProps) {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);

    const handleLogout = async () => {
        swalLoading("Saindo...");
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

    const getRoleStyles = (role: string) => {
        switch (role) {
            case 'chefe': return "bg-purple-100 text-purple-700";
            case 'coordenador': return "bg-teal-100 text-teal-700";
            case 'secretario': return "bg-amber-100 text-amber-700";
            case 'professor':
            default: return "bg-blue-100 text-blue-700";
        }
    };
    
    const roleStyles = getRoleStyles(roleId || 'professor');

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-3 px-2 hover:bg-slate-100 transition-all h-auto py-1.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${roleStyles}`}>
                        {user.image ? (
                            <Image 
                                src={user.image} 
                                alt={user.name} 
                                width={32} 
                                height={32} 
                                className="w-full h-full rounded-full object-cover" 
                            />
                        ) : (
                            user.name.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div className="flex flex-col items-start text-left hidden sm:flex">
                        <span className="text-sm font-semibold text-slate-900 leading-none mb-1">
                            {user.name}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleStyles}`}>
                            {roleLabel}
                        </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <div className="px-2 py-1.5 text-xs text-slate-500">
                    {user.email}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                    className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                    onClick={handleLogout}
                    disabled={isPending}
                >
                    {isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                        <LogOut className="w-4 h-4 mr-2" />
                    )}
                    Sair do Sistema
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
