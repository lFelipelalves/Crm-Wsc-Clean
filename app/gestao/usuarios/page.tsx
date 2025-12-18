"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { useUserRole } from "@/hooks/use-user-role"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Plus, UserCog, User, Shield, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function GestaoUsuariosPage() {
    const { role, loading: roleLoading } = useUserRole()
    const router = useRouter()
    const { toast } = useToast()

    const [users, setUsers] = useState<any[]>([])
    const [loadingData, setLoadingData] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)

    // Form State
    const [newUser, setNewUser] = useState({
        name: "",
        email: "",
        password: "",
        role: "user"
    })
    const [creating, setCreating] = useState(false)

    useEffect(() => {
        if (!roleLoading) {
            if (role !== 'admin') {
                router.push('/')
                return
            }
            fetchUsers()
        }
    }, [role, roleLoading])

    async function fetchUsers() {
        setLoadingData(true)
        const supabase = createClient()
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            toast({ title: "Erro ao buscar usuários", variant: "destructive", description: error.message })
        } else {
            setUsers(data || [])
        }
        setLoadingData(false)
    }

    async function handleCreateUser() {
        if (!newUser.name || !newUser.email || !newUser.password) {
            toast({ title: "Preencha todos os campos", variant: "destructive" })
            return
        }

        setCreating(true)
        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "Erro ao criar usuário")
            }

            toast({ title: "Usuário criado com sucesso!" })
            setDialogOpen(false)
            setNewUser({ name: "", email: "", password: "", role: "user" })
            fetchUsers()

        } catch (error: any) {
            toast({ title: "Erro", variant: "destructive", description: error.message })
        } finally {
            setCreating(false)
        }
    }

    if (roleLoading || role !== 'admin') return null

    return (
        <AppLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Gestão de Usuários</h1>
                        <p className="text-muted-foreground">Adicione e gerencie o acesso ao sistema</p>
                    </div>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Novo Usuário
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Nome Completo</Label>
                                    <Input
                                        value={newUser.name}
                                        onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                        placeholder="Ex: João da Silva"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>E-mail</Label>
                                    <Input
                                        value={newUser.email}
                                        onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                        placeholder="joao@wsc.com.br"
                                        type="email"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Senha Temporária</Label>
                                    <Input
                                        value={newUser.password}
                                        onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                        type="text"
                                        placeholder="Senha inicial"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Permissão</Label>
                                    <Select
                                        value={newUser.role}
                                        onValueChange={v => setNewUser({ ...newUser, role: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="user">Usuário (DP)</SelectItem>
                                            <SelectItem value="admin">Administrador</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                                <Button onClick={handleCreateUser} disabled={creating}>
                                    {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Criar Usuário
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Usuários Cadastrados</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loadingData ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Permissão</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map(user => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.nome}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {user.role === 'admin' ? <Shield className="h-4 w-4 text-primary" /> : <User className="h-4 w-4 text-muted-foreground" />}
                                                    <span className="capitalize">{user.role === "admin" ? "Administrador" : "Usuário (DP)"}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {user.ativo ? 'Ativo' : 'Inativo'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {/* Future: Delete/Edit */}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    )
}
