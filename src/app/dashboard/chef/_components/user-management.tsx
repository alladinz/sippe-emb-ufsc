"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { 
    TableContainer,
    TableShell,
    TableToolbar,
    TablePagination,
    TableEmptyState,
    TableBulkActions,
    TableFilters
    } from "@/components/table";
    import { useTable } from "@/hooks/table/useTable";
    import { Button } from "@/components/ui/button";
    import { Input } from "@/components/ui/input";
    import { Label } from "@/components/ui/label";
    import { 
        Dialog, 
        DialogContent, 
        DialogDescription, 
        DialogFooter, 
        DialogHeader, 
        DialogTitle, 
        DialogTrigger 
    } from "@/components/ui/dialog";
    import { 
        Select, 
        SelectContent, 
        SelectItem, 
        SelectTrigger, 
        SelectValue 
    } from "@/components/ui/select";
import { UserPlus, Trash2, Loader2, UserCog, Mail, Check, X, MoreHorizontal, Edit2, FilterX } from "lucide-react";
import { addUserAction, deleteUserAccountAction, updateUserAccessAction, bulkDeleteUsersAction } from "../actions";
import { confirmDialog, toastError, toastSuccess, toastWarning } from "@/lib/swal";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

interface User {
    id: string;
    name: string | null;
    email: string | null;
    status: string | null;
}

interface Member {
    id: string;
    userId: string;
    user: User;
    role: string;
    organizationId: string | null;
}

interface UserManagementProps {
    members: Member[]; // Initial data from server
    organizations: { id: string, name: string, slug?: string | null }[];
}

export function UserManagement({ members: initialMembers, organizations }: UserManagementProps) {
    const [isPending, startTransition] = useTransition();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingEmailId, setEditingEmailId] = useState<string | null>(null);
    const [tempEmail, setTempEmail] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    
    // Use our new hook
    const {
        page, limit, search, filters, selectedIds, density,
        setPage, setLimit, setSearch, setFilters, toggleSelect, toggleSelectAll, clearSelection
    } = useTable({ id: 'user-management', initialLimit: 20 });

    const [members, setMembers] = useState<Member[]>(initialMembers);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            params.set("page", page.toString());
            params.set("limit", limit.toString());
            if (filters.status) params.set("status", (filters.status as string));

            const res = await fetch(`/api/admin/usuarios?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            
            const flattened: Member[] = [];
            data.usuarios.forEach((u: { id: string, name: string, email: string, status: string, members: Member[] }) => {
                if (u.members && u.members.length > 0) {
                    u.members.forEach((m: Member) => {
                        flattened.push({
                            ...m,
                            user: {
                                id: u.id,
                                name: u.name,
                                email: u.email,
                                status: u.status
                            }
                        });
                    });
                } else {
                    flattened.push({
                        id: `no-mem-${u.id}`,
                        userId: u.id,
                        user: {
                            id: u.id,
                            name: u.name,
                            email: u.email,
                            status: u.status
                        },
                        role: 'none',
                        organizationId: null
                    });
                }
            });

            setMembers(flattened);
            setTotal(data.total);
        } catch (error) {
            console.error(error);
            toastError("Erro ao carregar usuários");
        } finally {
            setIsLoading(false);
        }
    }, [page, limit, filters.status]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Form state
    const [newEmail, setNewEmail] = useState("");
    const [newName, setNewName] = useState("");
    const [newRole, setNewRole] = useState("professor");
    const [newOrgId, setNewOrgId] = useState("");

    const deptoOrg = organizations.find(o => o.slug === "departamento");
    const isDeptoRole = newRole === "chefe" || newRole === "secretario";

    // Adjust Org selection when role changes
    const onRoleChange = (role: string) => {
        setNewRole(role);
        if (role === "chefe" || role === "secretario") {
            if (deptoOrg) {
                setNewOrgId(deptoOrg.id);
            } else {
                setNewOrgId("temp-depto");
            }
        } else if (role === "professor") {
            setNewOrgId(""); // Optional
        }
    };

    const filteredMembers = members.filter(m => {
        const matchesSearch = 
            m.user.name?.toLowerCase().includes(search.toLowerCase()) ||
            m.user.email?.toLowerCase().includes(search.toLowerCase());
        
        return matchesSearch;
    });

    useEffect(() => {
        fetch('/api/admin/usuarios?count=true&status=pending_email')
            .then(r => r.json())
            .then(() => { /* globalPendingCount not used in UI yet */ })
            .catch(console.error);
    }, [members]);

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        
        const confirmed = await confirmDialog(
            "Excluir múltiplos usuários?",
            `Tem certeza que deseja excluir permanentemente ${selectedIds.length} usuários selecionados e todos os seus dados?`,
            "Excluir Permanentemente",
            "Cancelar",
            true
        );

        if (!confirmed) return;

        startTransition(async () => {
            try {
                await bulkDeleteUsersAction(selectedIds);
                clearSelection();
                toastSuccess(`${selectedIds.length} usuários excluídos.`);
                fetchUsers();
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : "Erro desconhecido";
                toastError("Erro ao excluir usuários: " + message);
            }
        });
    };

    const handleAddUser = () => {
        if (!newEmail || !newName || !newRole) {
            toastWarning("Preencha todos os campos obrigatórios (E-mail, Nome, Papel)");
            return;
        }

        if (newRole === "coordenador" && !newOrgId) {
            toastWarning("Coordenadores devem ter uma graduação selecionada.");
            return;
        }

        startTransition(async () => {
            try {
                const orgIdToPass = newOrgId === "temp-depto" ? undefined : (newOrgId || undefined);
                await addUserAction(newEmail, newName, newRole, orgIdToPass);
                setIsAddDialogOpen(false);
                setNewEmail("");
                setNewName("");
                setNewRole("professor");
                setNewOrgId("");
                toastSuccess("Usuário adicionado com sucesso");
                fetchUsers();
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : "Erro desconhecido";
                toastError("Erro ao adicionar usuário: " + message);
            }
        });
    };

    const handleRemove = async (userId: string) => {
        const confirmed = await confirmDialog(
            "Excluir usuário permanentemente?",
            "Esta ação removerá o usuário e todos os seus dados vinculados (planos, notificações, etc.) permanentemente. O e-mail ficará disponível para novo cadastro.",
            "Excluir Permanentemente",
            "Cancelar",
            true
        );

        if (!confirmed) return;
        
        startTransition(async () => {
            try {
                await deleteUserAccountAction(userId);
                toastSuccess("Usuário excluído com sucesso");
                fetchUsers();
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : "Erro desconhecido";
                toastError("Erro ao excluir: " + message);
            }
        });
    };

    const handleUpdateEmail = async (userId: string) => {
        if (!tempEmail || !tempEmail.includes("@")) {
            toastWarning("Insira um e-mail válido");
            return;
        }

        try {
            const response = await fetch(`/api/admin/usuarios/${userId}`, {
                method: "PATCH",
                body: JSON.stringify({ email: tempEmail, status: "active" }),
                headers: { "Content-Type": "application/json" }
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text);
            }

            toastSuccess("E-mail cadastrado. Professor pode acessar o sistema.");
            setEditingEmailId(null);
            setTempEmail("");
            fetchUsers();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Erro desconhecido";
            toastError(message || "Erro ao atualizar e-mail");
        }
    };

    const handleRoleChange = async (id: string, role: string, userName: string, orgId?: string) => {
        const confirmed = await confirmDialog(
            "Alterar acesso?",
            `Tem certeza que deseja alterar os dados de acesso de ${userName}?`,
            "Confirmar alteração",
            "Cancelar",
            false
        );

        if (!confirmed) {
            return;
        }

        startTransition(async () => {
            try {
                await updateUserAccessAction(id, role, orgId);
                toastSuccess("Acesso atualizado com sucesso");
                fetchUsers();
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : "Erro desconhecido";
                toastError("Erro ao atualizar acesso: " + message);
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-900 text-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-brand-blue/20 rounded-lg">
                        <UserCog className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Gestão de Usuários</h2>
                        <p className="text-indigo-300 text-sm">
                            Gerencie acessos, papéis e permissões do sistema.
                        </p>
                    </div>
                </div>
                
                <div className="flex gap-2">
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-brand-blue hover:bg-brand-blue/90 h-10">
                                <UserPlus className="w-4 h-4 mr-2" />
                                Novo Usuário
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                                <DialogDescription>
                                    O usuário será criado se ainda não existir no sistema.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label>Nome Completo</Label>
                                    <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ex: João Silva" />
                                </div>
                                <div className="space-y-2">
                                    <Label>E-mail</Label>
                                    <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="usuario@ufsc.br" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Papel</Label>
                                        <Select value={newRole} onValueChange={onRoleChange}>
                                            <SelectTrigger className="w-full truncate">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="professor">Professor</SelectItem>
                                                <SelectItem value="coordenador">Coordenador</SelectItem>
                                                <SelectItem value="secretario">Secretário</SelectItem>
                                                <SelectItem value="chefe">Chefe</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Curso/Depto {newRole === "professor" && "(Opcional)"}</Label>
                                        <Select 
                                            value={newOrgId} 
                                            onValueChange={setNewOrgId}
                                            disabled={isDeptoRole}
                                        >
                                            <SelectTrigger className="w-full truncate">
                                                <SelectValue placeholder={isDeptoRole ? "Departamento" : "Selecione..."} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {isDeptoRole && !deptoOrg ? (
                                                    <SelectItem value="temp-depto">Departamento</SelectItem>
                                                ) : (
                                                    organizations.map(org => (
                                                        <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button>
                                <Button onClick={handleAddUser} disabled={isPending}>
                                    {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                                    Adicionar
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <TableShell>
                <TableToolbar 
                    title="Usuários"
                    count={total}
                    searchValue={search}
                    onSearchChange={setSearch}
                    onClearSearch={() => setSearch("")}
                    onToggleFilters={() => setShowFilters(!showFilters)}
                    showFilters={showFilters}
                />

                <TableFilters isOpen={showFilters}>
                    <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-slate-500 font-bold">Status da Conta</Label>
                        <Select 
                            value={(filters.status as string) || "all"} 
                            onValueChange={(val) => setFilters({ ...filters, status: val === "all" ? undefined : val })}
                        >
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="Todos os status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="pending_email">E-mail Pendente</SelectItem>
                                <SelectItem value="active">Ativo</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {Object.keys(filters).length > 0 && (
                        <div className="flex items-end">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setFilters({})}
                                className="h-9 text-slate-500 hover:text-slate-900 gap-2"
                            >
                                <FilterX className="w-4 h-4" />
                                Limpar Filtros
                            </Button>
                        </div>
                    )}
                </TableFilters>

                <div className="px-4 pb-2">
                    <TableBulkActions 
                        selectedCount={selectedIds.length}
                        onClearSelection={clearSelection}
                        actions={
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={handleBulkDelete}
                                className="text-white hover:bg-white/10 gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Excluir Selecionados
                            </Button>
                        }
                    />
                </div>
                
                <TableContainer density={density}>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">
                                    <Checkbox 
                                        checked={filteredMembers.length > 0 && selectedIds.length === filteredMembers.length}
                                        onCheckedChange={() => toggleSelectAll(filteredMembers.map(m => m.user.id))}
                                    />
                                </TableHead>
                                <TableHead>Usuário</TableHead>
                                <TableHead>Curso / Departamento</TableHead>
                                <TableHead>Papel</TableHead>
                                <TableHead className="text-right w-12">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-48 text-center">
                                        <div className="flex flex-col items-center gap-2 text-slate-400">
                                            <Loader2 className="w-8 h-8 animate-spin" />
                                            <p className="text-sm">Carregando usuários...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredMembers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="p-0">
                                        <TableEmptyState 
                                            title="Nenhum usuário encontrado"
                                            description="Não encontramos nenhum usuário com os filtros aplicados."
                                            actionLabel="Limpar filtros"
                                            onAction={() => { setFilters({}); setSearch(""); }}
                                        />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredMembers.map((m) => (
                                    <TableRow key={m.id} className={cn("transition-colors", selectedIds.includes(m.user.id) ? "bg-slate-50" : "hover:bg-slate-50/50")}>
                                        <TableCell>
                                            <Checkbox 
                                                checked={selectedIds.includes(m.user.id)}
                                                onCheckedChange={() => toggleSelect(m.user.id)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-900">{m.user.name}</span>
                                                {m.user.status === 'pending_email' && editingEmailId !== m.user.id ? (
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] text-amber-600 font-bold uppercase italic bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                                                            E-mail pendente
                                                        </span>
                                                        <Button 
                                                            variant="link" 
                                                            size="sm" 
                                                            onClick={() => {
                                                                setEditingEmailId(m.user.id);
                                                                setTempEmail("");
                                                            }}
                                                            className="h-auto p-0 text-[10px] font-bold text-amber-700 underline"
                                                        >
                                                            Adicionar e-mail
                                                        </Button>
                                                    </div>
                                                ) : editingEmailId === m.user.id ? (
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <Input 
                                                            value={tempEmail} 
                                                            onChange={e => setTempEmail(e.target.value)} 
                                                            placeholder="e-mail do professor"
                                                            className="h-7 text-xs w-48 bg-white"
                                                            autoFocus
                                                        />
                                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={() => handleUpdateEmail(m.user.id)}>
                                                            <Check className="w-4 h-4" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400" onClick={() => setEditingEmailId(null)}>
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                                        <Mail className="w-3 h-3" />
                                                        {m.user.email}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Select 
                                                value={(m.organizationId as string) || "all"} 
                                                onValueChange={(val) => handleRoleChange(m.id, m.role, (m.user.name as string), val)}
                                                disabled={isPending}
                                            >
                                                <SelectTrigger className="h-8 w-[180px] text-xs truncate">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {organizations.map(org => (
                                                        <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Select 
                                                    value={(m.role as string) || "all"} 
                                                    onValueChange={(val) => handleRoleChange(m.id, val, (m.user.name as string), (m.organizationId as string))}
                                                    disabled={isPending}
                                                >
                                                    <SelectTrigger className="h-8 w-[140px] text-xs truncate">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="professor">Professor</SelectItem>
                                                        <SelectItem value="coordenador">Coordenador</SelectItem>
                                                        <SelectItem value="secretario">Secretário</SelectItem>
                                                        <SelectItem value="chefe">Chefe</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => {
                                                        setEditingEmailId(m.user.id);
                                                        setTempEmail(m.user.email || "");
                                                    }}>
                                                        <Edit2 className="w-4 h-4 mr-2" />
                                                        Editar e-mail
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem 
                                                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                        onClick={() => handleRemove(m.user.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Excluir conta
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination 
                    total={total}
                    page={page}
                    limit={limit}
                    onPageChange={setPage}
                    onLimitChange={setLimit}
                />
            </TableShell>
        </div>
    );
}
