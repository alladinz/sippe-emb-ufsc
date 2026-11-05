"use client";

import { authClient } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
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
            case 'comissao': return "bg-indigo-100 text-indigo-700";
            case 'professor':
            default: return "bg-blue-100 text-blue-700";
        }
    };
    
    const roleStyles = getRoleStyles(roleId || 'professor');

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-slate-100/80 data-[state=open]:bg-slate-100/90 transition-all h-auto border border-transparent focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-[#023E8A] focus-visible:ring-offset-2"
                >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${roleStyles}`}>
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
                        <span className="text-xs font-bold text-slate-900 leading-tight">
                            {user.name}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider mt-0.5 ${roleStyles}`}>
                            {roleLabel}
                        </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5 transition-transform duration-200" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                sideOffset={6}
                className="w-56 sm:w-60 p-1.5 rounded-xl border border-slate-200/80 bg-white shadow-lg shadow-slate-900/5 outline-none focus:outline-none"
            >
                <div className="px-3 py-2">
                    <span className="text-xs font-bold text-slate-900 block leading-tight">
                        Minha Conta
                    </span>
                    <span className="text-[11px] font-normal text-slate-500 truncate block mt-1" title={user.email ?? ""}>
                        {user.email || "Sem e-mail cadastrado"}
                    </span>
                </div>
                <DropdownMenuSeparator className="-mx-1.5 my-1 h-px bg-slate-100" />
                <DropdownMenuItem 
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50/80 focus:text-red-700 focus:bg-red-50/80 cursor-pointer transition-colors outline-none"
                    onClick={handleLogout}
                    disabled={isPending}
                >
                    {isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin shrink-0 text-red-600" />
                    ) : (
                        <LogOut className="w-4 h-4 shrink-0 text-red-600" />
                    )}
                    <span>Sair do Sistema</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
