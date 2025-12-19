"use client"

import { useState, useEffect, useMemo } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Plus, Search, Loader2, Pencil, Trash2, Users, Building2, Phone } from "lucide-react"

interface Contato {
    id: string
    empresa_id: string
    nome: string
    telefone: string | null
    cargo: string | null
    created_at: string
    empresa?: {
        razao_social: string
        codigo: string
    }
}

interface Empresa {
    id: string
    razao_social: string
    codigo: string
}

export default function ContatosPage() {
    const [contatos, setContatos] = useState<Contato[]>([])
    const [empresas, setEmpresas] = useState<Empresa[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogAberto, setDialogAberto] = useState(false)
    const [contatoEditando, setContatoEditando] = useState<Contato | null>(null)
    const [busca, setBusca] = useState("")
    const [filtroEmpresa, setFiltroEmpresa] = useState<string>("todas")
    const [salvando, setSalvando] = useState(false)

    // Form state
    const [nome, setNome] = useState("")
    const [telefone, setTelefone] = useState("")
    const [cargo, setCargo] = useState("")
    const [empresaId, setEmpresaId] = useState("")

    const { toast } = useToast()
    const supabase = createClient()

    useEffect(() => {
        carregarDados()
    }, [])

    async function carregarDados() {
        setLoading(true)
        try {
            const [{ data: contatosData }, { data: empresasData }] = await Promise.all([
                supabase
                    .from("contatos")
                    .select(`*, empresa:empresas(razao_social, codigo)`)
                    .order("nome"),
                supabase
                    .from("empresas")
                    .select("id, razao_social, codigo")
                    .eq("ativo", true)
                    .order("razao_social")
            ])

            setContatos(contatosData || [])
            setEmpresas(empresasData || [])
        } catch (error) {
            console.error("Erro ao carregar dados:", error)
            toast({ title: "Erro ao carregar contatos", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    function abrirDialogNovo() {
        setContatoEditando(null)
        setNome("")
        setTelefone("")
        setCargo("")
        setEmpresaId(filtroEmpresa !== "todas" ? filtroEmpresa : "")
        setDialogAberto(true)
    }

    function abrirDialogEditar(contato: Contato) {
        setContatoEditando(contato)
        setNome(contato.nome || "")
        setTelefone(contato.telefone || "")
        setCargo(contato.cargo || "")
        setEmpresaId(contato.empresa_id)
        setDialogAberto(true)
    }

    async function handleSalvar() {
        if (!nome.trim() || !empresaId) {
            toast({ title: "Preencha nome e empresa", variant: "destructive" })
            return
        }

        setSalvando(true)
        try {
            const dados = {
                nome: nome.trim(),
                telefone: telefone.trim() || null,
                cargo: cargo.trim() || null,
                empresa_id: empresaId
            }

            if (contatoEditando) {
                const { error } = await supabase
                    .from("contatos")
                    .update(dados)
                    .eq("id", contatoEditando.id)

                if (error) throw error
                toast({ title: "Contato atualizado!" })
            } else {
                const { error } = await supabase
                    .from("contatos")
                    .insert(dados)

                if (error) throw error
                toast({ title: "Contato criado!" })
            }

            setDialogAberto(false)
            carregarDados()
        } catch (error: any) {
            toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" })
        } finally {
            setSalvando(false)
        }
    }

    async function handleExcluir(id: string) {
        if (!confirm("Tem certeza que deseja excluir este contato?")) return

        try {
            const { error } = await supabase
                .from("contatos")
                .delete()
                .eq("id", id)

            if (error) throw error
            toast({ title: "Contato excluído!" })
            carregarDados()
        } catch (error: any) {
            toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" })
        }
    }

    // Estatísticas
    const stats = useMemo(() => {
        const empresasComContato = new Set(contatos.map(c => c.empresa_id)).size
        return {
            totalContatos: contatos.length,
            empresasComContato,
            mediaContatosPorEmpresa: empresasComContato > 0 ? (contatos.length / empresasComContato).toFixed(1) : 0
        }
    }, [contatos])

    // Filtros
    const contatosFiltrados = useMemo(() => {
        return contatos.filter(c => {
            // Filtro por empresa
            if (filtroEmpresa !== "todas" && c.empresa_id !== filtroEmpresa) return false
            // Filtro por busca
            if (busca) {
                const buscaLower = busca.toLowerCase()
                return (
                    c.nome?.toLowerCase().includes(buscaLower) ||
                    c.empresa?.razao_social?.toLowerCase().includes(buscaLower) ||
                    c.telefone?.includes(busca) ||
                    c.cargo?.toLowerCase().includes(buscaLower)
                )
            }
            return true
        })
    }, [contatos, filtroEmpresa, busca])

    // Empresas que aparecem nos resultados filtrados (para mostrar quando filtra por contato)
    const empresasRelacionadas = useMemo(() => {
        if (!busca) return []
        const ids = new Set(contatosFiltrados.map(c => c.empresa_id))
        return empresas.filter(e => ids.has(e.id))
    }, [contatosFiltrados, empresas, busca])

    return (
        <AppLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-[#1e3a5f]">Contatos</h1>
                        <p className="text-muted-foreground">Gerencie os contatos das empresas</p>
                    </div>
                    <Button onClick={abrirDialogNovo} className="bg-[#1e3a5f] hover:bg-[#162c4b]">
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Contato
                    </Button>
                </div>

                {/* Cards de Estatísticas */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-[#1e3a5f]">Total de Contatos</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-[#1e3a5f]">{stats.totalContatos}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-[#1e3a5f]">Empresas com Contatos</CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-[#1e3a5f]">{stats.empresasComContato}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-[#1e3a5f]">Média por Empresa</CardTitle>
                            <Phone className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-[#1e3a5f]">{stats.mediaContatosPorEmpresa}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filtros */}
                <Card className="border-slate-200 shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex flex-col gap-4 md:flex-row md:items-end">
                            <div className="flex-1 max-w-md">
                                <Label className="mb-2 block text-sm font-medium">Buscar Contato</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Nome, telefone, cargo..."
                                        value={busca}
                                        onChange={(e) => setBusca(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div className="w-full md:w-[300px]">
                                <Label className="mb-2 block text-sm font-medium">Filtrar por Empresa</Label>
                                <Select value={filtroEmpresa} onValueChange={setFiltroEmpresa}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Todas as empresas" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todas">Todas as empresas</SelectItem>
                                        {empresas.map((emp) => (
                                            <SelectItem key={emp.id} value={emp.id}>
                                                {emp.codigo} - {emp.razao_social}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {(busca || filtroEmpresa !== "todas") && (
                                <Button
                                    variant="outline"
                                    onClick={() => { setBusca(""); setFiltroEmpresa("todas") }}
                                    className="whitespace-nowrap"
                                >
                                    Limpar Filtros
                                </Button>
                            )}
                        </div>

                        {/* Info de empresas relacionadas quando busca por contato */}
                        {busca && empresasRelacionadas.length > 0 && (
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <p className="text-sm text-[#1e3a5f] font-medium mb-1">
                                    Empresas relacionadas a "{busca}":
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {empresasRelacionadas.slice(0, 10).map(emp => (
                                        <span
                                            key={emp.id}
                                            className="text-xs bg-white px-2 py-1 rounded border cursor-pointer hover:bg-slate-50"
                                            onClick={() => { setFiltroEmpresa(emp.id); setBusca("") }}
                                        >
                                            {emp.codigo} - {emp.razao_social}
                                        </span>
                                    ))}
                                    {empresasRelacionadas.length > 10 && (
                                        <span className="text-xs text-muted-foreground">
                                            +{empresasRelacionadas.length - 10} mais
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Tabela */}
                <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead className="font-semibold text-[#1e3a5f]">Nome</TableHead>
                                        <TableHead className="font-semibold text-[#1e3a5f]">Empresa</TableHead>
                                        <TableHead className="font-semibold text-[#1e3a5f]">Telefone</TableHead>
                                        <TableHead className="font-semibold text-[#1e3a5f]">Cargo</TableHead>
                                        <TableHead className="w-[100px] font-semibold text-[#1e3a5f]">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {contatosFiltrados.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
                                                Nenhum contato encontrado
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        contatosFiltrados.map((contato) => (
                                            <TableRow key={contato.id}>
                                                <TableCell className="font-medium">{contato.nome}</TableCell>
                                                <TableCell>
                                                    <div
                                                        className="flex items-center gap-2 cursor-pointer hover:text-[#1e3a5f]"
                                                        onClick={() => { setFiltroEmpresa(contato.empresa_id); setBusca("") }}
                                                    >
                                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                                        <span>{contato.empresa?.razao_social || "-"}</span>
                                                        <span className="text-xs text-muted-foreground">({contato.empresa?.codigo})</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{contato.telefone || "-"}</TableCell>
                                                <TableCell>{contato.cargo || "-"}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 hover:scale-110 transition-transform"
                                                            onClick={() => abrirDialogEditar(contato)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-500 hover:scale-110 hover:bg-red-50 transition-all"
                                                            onClick={() => handleExcluir(contato.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Resumo dos resultados */}
                <p className="text-sm text-muted-foreground">
                    Exibindo {contatosFiltrados.length} de {contatos.length} contatos
                    {filtroEmpresa !== "todas" && ` • Filtrando por empresa`}
                </p>

                {/* Dialog Criar/Editar */}
                <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{contatoEditando ? "Editar Contato" : "Novo Contato"}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Empresa *</Label>
                                <Select value={empresaId} onValueChange={setEmpresaId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione a empresa" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {empresas.map((emp) => (
                                            <SelectItem key={emp.id} value={emp.id}>
                                                {emp.codigo} - {emp.razao_social}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Nome *</Label>
                                <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do contato" />
                            </div>
                            <div className="space-y-2">
                                <Label>Telefone</Label>
                                <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(00) 00000-0000" />
                            </div>
                            <div className="space-y-2">
                                <Label>Cargo</Label>
                                <Input value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Ex: Sócio, Financeiro..." />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogAberto(false)}>Cancelar</Button>
                            <Button onClick={handleSalvar} disabled={salvando} className="bg-[#1e3a5f] hover:bg-[#162c4b]">
                                {salvando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                {contatoEditando ? "Salvar" : "Criar"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    )
}
