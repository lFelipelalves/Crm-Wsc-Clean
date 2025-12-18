"use client"

import { CommandItem } from "@/components/ui/command"

import { useState, useEffect } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { AudioUpload } from "@/components/cobranca-ponto/audio-upload"
import {
  Plus,
  Search,
  Loader2,
  Trash2,
  RefreshCw,
  Building2,
  CheckCircle,
  Clock,
  AlertCircle,
  Send,
  FileText,
  History,
  Phone,
  ChevronsUpDown,
  Check,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useUserRole } from "@/hooks/use-user-role"

import {
  getEmpresasCobrancaPonto,
  getEmpresasDisponiveis,
  adicionarEmpresaCobrancaPonto,
  removerEmpresaCobrancaPonto,
  atualizarStatusPonto,
  resetarTodosStatus,
  getEstatisticas,
} from "@/lib/supabase/services/empresas-cobranca-ponto"

import { buscarLogsPorCompetencia } from "@/lib/supabase/services/log-cobranca-ponto"

import type {
  Empresa,
  EmpresaCobrancaPontoView,
  StatusEnvio,
  StatusPonto,
  LogCobrancaPonto,
  TipoMensagem,
} from "@/lib/supabase/types"

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface ProgressoEnvioItem {
  empresa_id: string
  empresa_nome: string
  log_id: string
  status: "aguardando" | "enviando" | "sucesso" | "erro"
  mensagemErro?: string
}

export default function CobrancaPontoFiscalPage() {
  // Estados principais
  const [empresasCobranca, setEmpresasCobranca] = useState<EmpresaCobrancaPontoView[]>([])
  const [empresasDisponiveis, setEmpresasDisponiveis] = useState<Empresa[]>([])
  const [logsCobranca, setLogsCobranca] = useState<LogCobrancaPonto[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingAcao, setLoadingAcao] = useState(false)
  const [estatisticas, setEstatisticas] = useState({
    total: 0,
    aguardando: 0,
    enviado: 0,
    erro: 0,
    pendente: 0,
    recebido: 0,
    naoRecebido: 0,
  })

  // Filtros
  const [busca, setBusca] = useState("")
  const [filtroDia, setFiltroDia] = useState<"todos" | "dia01" | "dia25">("todos")
  const [filtroStatusPonto, setFiltroStatusPonto] = useState<string>("todos")

  // Dialogs
  const [dialogAdicionarAberto, setDialogAdicionarAberto] = useState(false)
  const [dialogResetAberto, setDialogResetAberto] = useState(false)
  const [dialogRemoverAberto, setDialogRemoverAberto] = useState(false)
  const [dialogProgressoAberto, setDialogProgressoAberto] = useState(false)
  const [empresaParaRemover, setEmpresaParaRemover] = useState<EmpresaCobrancaPontoView | null>(null)
  const [confirmacaoReset, setConfirmacaoReset] = useState("")

  // Form adicionar empresa
  const [empresaSelecionada, setEmpresaSelecionada] = useState("")
  const [diaCobrancaSelecionado, setDiaCobrancaSelecionado] = useState<number>(25)
  const [telefoneCobranca, setTelefoneCobranca] = useState("")
  const [buscaEmpresaDisponivel, setBuscaEmpresaDisponivel] = useState("")

  // Criar cobrança
  const [empresasSelecionadasCobranca, setEmpresasSelecionadasCobranca] = useState<string[]>([])
  const [mensagemCobranca, setMensagemCobranca] = useState(
    "Olá! Solicitamos o envio do ponto dos funcionários referente ao mês atual. Por favor, envie o mais breve possível. Obrigado!",
  )
  const [tipoMensagem, setTipoMensagem] = useState<TipoMensagem>("TEXTO")
  const [progressoEnvio, setProgressoEnvio] = useState<ProgressoEnvioItem[]>([])
  const [enviandoCobrancas, setEnviandoCobrancas] = useState(false)
  const [arquivoAudioUrl, setArquivoAudioUrl] = useState<string>("")
  const [modoEnvio, setModoEnvio] = useState<"agora" | "agendar">("agora")
  const [dataAgendamento, setDataAgendamento] = useState<string>("")
  const [horaAgendamento, setHoraAgendamento] = useState<string>("14:00")

  // Tab atual
  const [tabAtual, setTabAtual] = useState("empresas")

  // Estado para polling
  const [pollingAtivo, setPollingAtivo] = useState(false)

  const { toast } = useToast()
  const { role, loading: roleLoading } = useUserRole()

  useEffect(() => {
    carregarDados()
  }, [])

  useEffect(() => {
    if (tabAtual === "historico") {
      carregarLogs()
    }
  }, [tabAtual])

  useEffect(() => {
    if (dialogAdicionarAberto) {
      carregarEmpresasDisponiveis()
    }
  }, [dialogAdicionarAberto])

  useEffect(() => {
    if (!pollingAtivo) return

    const interval = setInterval(async () => {
      await carregarDados()
      await carregarLogs()
    }, 5000) // Atualiza a cada 5 segundos

    return () => clearInterval(interval)
  }, [pollingAtivo])

  useEffect(() => {
    if (tabAtual !== "historico") return

    // Carrega imediatamente
    carregarLogs()

    // Polling a cada 3 segundos
    const interval = setInterval(() => {
      carregarLogs()
    }, 3000)

    return () => clearInterval(interval)
  }, [tabAtual])

  async function carregarDados() {
    setLoading(true)
    try {
      const [empresas, stats] = await Promise.all([getEmpresasCobrancaPonto(), getEstatisticas()])
      setEmpresasCobranca(empresas)
      setEstatisticas(stats)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados do servidor.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function carregarLogs() {
    try {
      const logs = await buscarLogsPorCompetencia()
      setLogsCobranca(logs)
    } catch (error) {
      console.error("Erro ao carregar logs:", error)
    }
  }

  async function carregarEmpresasDisponiveis() {
    try {
      const empresas = await getEmpresasDisponiveis()
      setEmpresasDisponiveis(empresas)
    } catch (error) {
      console.error("Erro ao carregar empresas disponíveis:", error)
    }
  }

  async function handleAdicionarEmpresa() {
    if (!empresaSelecionada) {
      toast({
        title: "Selecione uma empresa",
        description: "É necessário selecionar uma empresa para adicionar.",
        variant: "destructive",
      })
      return
    }

    setLoadingAcao(true)
    try {
      const sucesso = await adicionarEmpresaCobrancaPonto(
        empresaSelecionada,
        diaCobrancaSelecionado,
        telefoneCobranca || undefined,
      )
      if (sucesso) {
        toast({ title: "Empresa adicionada com sucesso!" })
        setDialogAdicionarAberto(false)
        setEmpresaSelecionada("")
        setTelefoneCobranca("")
        setDiaCobrancaSelecionado(25)
        await carregarDados()
      } else {
        toast({ title: "Erro ao adicionar empresa", variant: "destructive" })
      }
    } finally {
      setLoadingAcao(false)
    }
  }

  async function handleRemoverEmpresa() {
    if (!empresaParaRemover) return

    setLoadingAcao(true)
    try {
      const sucesso = await removerEmpresaCobrancaPonto(empresaParaRemover.id)
      if (sucesso) {
        toast({ title: "Empresa removida com sucesso!" })
        setDialogRemoverAberto(false)
        setEmpresaParaRemover(null)
        await carregarDados()
      } else {
        toast({ title: "Erro ao remover empresa", variant: "destructive" })
      }
    } finally {
      setLoadingAcao(false)
    }
  }

  async function handleAtualizarStatusPonto(id: string, status: StatusPonto) {
    console.log("[v0] handleAtualizarStatusPonto chamado:", { id, status })
    const sucesso = await atualizarStatusPonto(id, status)
    console.log("[v0] Resultado da atualização:", sucesso)
    if (sucesso) {
      setEmpresasCobranca((prev) => prev.map((e) => (e.id === id ? { ...e, status_ponto: status } : e)))
      const stats = await getEstatisticas()
      setEstatisticas(stats)
    }
  }

  async function handleResetarTudo() {
    if (confirmacaoReset.toLowerCase() !== "confirmar") {
      toast({
        title: "Digite 'confirmar' para resetar",
        description: "Você precisa digitar a palavra 'confirmar' para executar esta ação.",
        variant: "destructive",
      })
      return
    }

    setLoadingAcao(true)
    try {
      const sucesso = await resetarTodosStatus()
      if (sucesso) {
        toast({ title: "Todos os status foram resetados!" })
        setDialogResetAberto(false)
        setConfirmacaoReset("")
        await carregarDados()
      } else {
        toast({ title: "Erro ao resetar status", variant: "destructive" })
      }
    } finally {
      setLoadingAcao(false)
    }
  }

  function handleSelecionarEmpresaCobranca(empresaId: string, checked: boolean) {
    if (checked) {
      setEmpresasSelecionadasCobranca((prev) => [...prev, empresaId])
    } else {
      setEmpresasSelecionadasCobranca((prev) => prev.filter((id) => id !== empresaId))
    }
  }

  function handleSelecionarTodas(checked: boolean) {
    if (checked) {
      const idsDisponiveis = empresasFiltradas.filter((e) => e.telefone_cobranca || e.telefone).map((e) => e.id)
      setEmpresasSelecionadasCobranca(idsDisponiveis)
    } else {
      setEmpresasSelecionadasCobranca([])
    }
  }

  async function handleCriarCobranca() {
    if (empresasSelecionadasCobranca.length === 0) {
      toast({
        title: "Selecione empresas",
        description: "Selecione pelo menos uma empresa para criar a cobrança.",
        variant: "destructive",
      })
      return
    }

    if (!mensagemCobranca.trim() && tipoMensagem === "TEXTO") {
      toast({
        title: "Digite uma mensagem",
        description: "A mensagem de cobrança é obrigatória.",
        variant: "destructive",
      })
      return
    }

    if (modoEnvio === "agendar" && !dataAgendamento) {
      toast({
        title: "Selecione a data",
        description: "Escolha uma data para agendar a cobrança.",
        variant: "destructive",
      })
      return
    }

    setEnviandoCobrancas(true)

    try {
      let dataCobranca: string | undefined = undefined
      if (modoEnvio === "agendar") {
        dataCobranca = `${dataAgendamento}T${horaAgendamento}:00`
      }

      const response = await fetch("/api/cobranca-ponto/disparar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresas_ids: empresasSelecionadasCobranca,
          mensagem: mensagemCobranca,
          tipo_mensagem: tipoMensagem,
          arquivo_audio_url: tipoMensagem === "AUDIO" ? arquivoAudioUrl : undefined,
          data_cobranca: dataCobranca,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Cobranças criadas!",
          description:
            modoEnvio === "agendar"
              ? `${result.logs_criados} cobranças foram agendadas para ${dataAgendamento} às ${horaAgendamento}.`
              : `${result.logs_criados} cobranças foram criadas e serão processadas pelo n8n.`,
        })

        setEmpresasSelecionadasCobranca([])
        setPollingAtivo(true)

        setTimeout(() => setPollingAtivo(false), 600000)

        await carregarDados()
        await carregarLogs()
      } else {
        toast({
          title: "Erro ao criar cobranças",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro de conexão",
        description: "Não foi possível criar as cobranças.",
        variant: "destructive",
      })
    } finally {
      setEnviandoCobrancas(false)
    }
  }

  const empresasFiltradas = empresasCobranca.filter((empresa) => {
    const matchBusca =
      busca === "" ||
      empresa.razao_social.toLowerCase().includes(busca.toLowerCase()) ||
      empresa.codigo.toLowerCase().includes(busca.toLowerCase()) ||
      empresa.responsavel?.toLowerCase().includes(busca.toLowerCase())

    const matchDia =
      filtroDia === "todos" ||
      (filtroDia === "dia01" && empresa.dia_cobranca === 1) ||
      (filtroDia === "dia25" && empresa.dia_cobranca === 25)

    const matchStatusPonto = filtroStatusPonto === "todos" || empresa.status_ponto === filtroStatusPonto

    return matchBusca && matchDia && matchStatusPonto
  })

  const empresasDisponiveisFiltradas = empresasDisponiveis.filter(
    (e) =>
      buscaEmpresaDisponivel === "" ||
      e.razao_social.toLowerCase().includes(buscaEmpresaDisponivel.toLowerCase()) ||
      e.codigo.toLowerCase().includes(buscaEmpresaDisponivel.toLowerCase()),
  )

  const progressoTotal =
    progressoEnvio.length > 0
      ? (progressoEnvio.filter((p) => p.status === "sucesso" || p.status === "erro").length / progressoEnvio.length) *
      100
      : 0

  function getStatusEnvioBadge(status: StatusEnvio | string | undefined | null, webhookResponse?: any) {
    let normalizedStatus = (status || "").toUpperCase()

    // Se o webhook_response indica sucesso, considerar como enviado
    if (webhookResponse) {
      const responseStr =
        typeof webhookResponse === "string"
          ? webhookResponse.toUpperCase()
          : JSON.stringify(webhookResponse).toUpperCase()
      if (responseStr.includes("SUCESSO") || responseStr.includes("SUCCESS")) {
        normalizedStatus = "SUCESSO"
      }
    }

    const variants: Record<
      string,
      { variant: "default" | "secondary" | "destructive" | "outline"; label: string; className?: string }
    > = {
      PENDENTE: { variant: "secondary", label: "Pendente" },
      AGUARDANDO: { variant: "secondary", label: "Aguardando" },
      ENVIANDO: { variant: "outline", label: "Enviando" },
      ENVIADO: { variant: "default", label: "Enviado", className: "bg-green-500 hover:bg-green-600 text-white" },
      SUCESSO: { variant: "default", label: "Enviado", className: "bg-green-500 hover:bg-green-600 text-white" },
      ERRO: { variant: "destructive", label: "Erro" },
      FALHA: { variant: "destructive", label: "Erro" },
    }
    return variants[normalizedStatus] || { variant: "secondary" as const, label: status || "Desconhecido" }
  }

  function getStatusPontoBadge(status: StatusPonto) {
    const variants: Record<
      StatusPonto,
      { variant: "default" | "secondary" | "destructive" | "outline"; label: string }
    > = {
      PENDENTE: { variant: "outline", label: "Pendente" },
      RECEBIDO: { variant: "default", label: "Recebido" },
      NAO_RECEBIDO: { variant: "destructive", label: "Não Recebido" },
    }
    return variants[status]
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Cobrança de Ponto Fiscal</h1>
            <p className="text-muted-foreground">Gerencie as cobranças de ponto das empresas</p>
          </div>
          {role === 'admin' && (
            <Button variant="destructive" onClick={() => setDialogResetAberto(true)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Resetar Tudo
            </Button>
          )}
        </div>

        {/* Cards de estatísticas */}
        <div className="grid gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Empresas</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estatisticas.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Enviados</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{estatisticas.enviado}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Aguardando</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{estatisticas.aguardando}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ponto Recebido</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{estatisticas.recebido}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={tabAtual} onValueChange={setTabAtual}>
          <TabsList>
            <TabsTrigger value="empresas">
              <Building2 className="mr-2 h-4 w-4" />
              Empresas
            </TabsTrigger>
            {role === 'admin' && (
              <TabsTrigger value="criar-cobranca">
                <Send className="mr-2 h-4 w-4" />
                Criar Cobrança
              </TabsTrigger>
            )}
            <TabsTrigger value="historico">
              <History className="mr-2 h-4 w-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          {/* Tab Empresas */}
          <TabsContent value="empresas" className="space-y-4">
            {/* Filtros */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por código, nome ou responsável..."
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={filtroDia} onValueChange={(v) => setFiltroDia(v as typeof filtroDia)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Dia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os dias</SelectItem>
                      <SelectItem value="dia01">Dia 01</SelectItem>
                      <SelectItem value="dia25">Dia 25</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={filtroStatusPonto}
                    onValueChange={(v) => setFiltroStatusPonto(v as typeof filtroStatusPonto)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Status Ponto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="PENDENTE">Pendente</SelectItem>
                      <SelectItem value="RECEBIDO">Recebido</SelectItem>
                      <SelectItem value="NAO_RECEBIDO">Não Recebido</SelectItem>
                    </SelectContent>
                  </Select>
                  {role === 'admin' && (
                    <Button
                      onClick={() => {
                        carregarEmpresasDisponiveis()
                        setDialogAdicionarAberto(true)
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tabela de empresas */}
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">Código</TableHead>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Responsável</TableHead>
                        <TableHead>Telefone Cobrança</TableHead>
                        <TableHead className="w-[80px]">Dia</TableHead>
                        <TableHead className="w-[140px]">Status Ponto</TableHead>
                        <TableHead className="w-[60px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {empresasFiltradas.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            Nenhuma empresa encontrada
                          </TableCell>
                        </TableRow>
                      ) : (
                        empresasFiltradas.map((empresa) => (
                          <TableRow key={empresa.id}>
                            <TableCell className="font-mono">{empresa.codigo}</TableCell>
                            <TableCell className="font-medium">{empresa.razao_social}</TableCell>
                            <TableCell>{empresa.responsavel || "-"}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                {empresa.telefone_cobranca || empresa.telefone || "-"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">Dia {String(empresa.dia_cobranca).padStart(2, "0")}</Badge>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={empresa.status_ponto}
                                onValueChange={(v) => handleAtualizarStatusPonto(empresa.id, v as StatusPonto)}
                              >
                                <SelectTrigger className="h-8">
                                  <Badge variant={getStatusPontoBadge(empresa.status_ponto).variant}>
                                    {getStatusPontoBadge(empresa.status_ponto).label}
                                  </Badge>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="PENDENTE">Pendente</SelectItem>
                                  <SelectItem value="RECEBIDO">Recebido</SelectItem>
                                  <SelectItem value="NAO_RECEBIDO">Não Recebido</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => {
                                  setEmpresaParaRemover(empresa)
                                  setDialogRemoverAberto(true)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Criar Cobrança */}
          <TabsContent value="criar-cobranca" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Configuração da mensagem */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Configuração da Mensagem
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Quando enviar?</Label>
                    <Select value={modoEnvio} onValueChange={(v) => setModoEnvio(v as "agora" | "agendar")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="agora">Enviar Agora</SelectItem>
                        <SelectItem value="agendar">Agendar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {modoEnvio === "agendar" && (
                    <div className="grid gap-4 rounded-lg border p-4">
                      <div className="space-y-2">
                        <Label>Data</Label>
                        <Input
                          type="date"
                          value={dataAgendamento}
                          onChange={(e) => setDataAgendamento(e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Horário</Label>
                        <Input
                          type="time"
                          value={horaAgendamento}
                          onChange={(e) => setHoraAgendamento(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Tipo de Mensagem</Label>
                    <Select value={tipoMensagem} onValueChange={(v) => setTipoMensagem(v as TipoMensagem)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TEXTO">Texto</SelectItem>
                        <SelectItem value="AUDIO">Áudio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {tipoMensagem === "TEXTO" ? (
                    <div className="space-y-2">
                      <Label>Mensagem</Label>
                      <Textarea
                        value={mensagemCobranca}
                        onChange={(e) => setMensagemCobranca(e.target.value)}
                        rows={5}
                        placeholder="Digite a mensagem de cobrança..."
                      />
                    </div>
                  ) : (
                    <AudioUpload onUploadComplete={(url) => setArquivoAudioUrl(url)} maxSize={25} />
                  )}
                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-sm text-muted-foreground">
                      <strong>Empresas selecionadas:</strong> {empresasSelecionadasCobranca.length}
                    </p>
                  </div>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleCriarCobranca}
                    disabled={empresasSelecionadasCobranca.length === 0 || enviandoCobrancas}
                  >
                    {enviandoCobrancas ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {modoEnvio === "agendar" ? "Agendando..." : "Enviando..."}
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        {modoEnvio === "agendar" ? "Agendar Cobrança" : "Criar Cobrança"}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Lista de empresas para selecionar */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Selecionar Empresas
                    </span>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={
                          empresasFiltradas.filter((e) => e.telefone_cobranca || e.telefone).length > 0 &&
                          empresasSelecionadasCobranca.length ===
                          empresasFiltradas.filter((e) => e.telefone_cobranca || e.telefone).length
                        }
                        onCheckedChange={(checked) => handleSelecionarTodas(!!checked)}
                      />
                      <Label className="text-sm font-normal">Selecionar todas</Label>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex gap-2">
                    <Select value={filtroDia} onValueChange={(v) => setFiltroDia(v as typeof filtroDia)}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Filtrar dia" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="dia01">Dia 01</SelectItem>
                        <SelectItem value="dia25">Dia 25</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={filtroStatusPonto}
                      onValueChange={(v) => setFiltroStatusPonto(v as typeof filtroStatusPonto)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="PENDENTE">Pendente</SelectItem>
                        <SelectItem value="RECEBIDO">Recebido</SelectItem>
                        <SelectItem value="NAO_RECEBIDO">Não Recebido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="max-h-[400px] space-y-2 overflow-y-auto">
                    {empresasFiltradas.map((empresa) => {
                      const temTelefone = empresa.telefone_cobranca || empresa.telefone
                      return (
                        <div
                          key={empresa.id}
                          className={`flex items-center gap-3 rounded-lg border p-3 ${!temTelefone ? "opacity-50" : ""
                            }`}
                        >
                          <Checkbox
                            checked={empresasSelecionadasCobranca.includes(empresa.id)}
                            onCheckedChange={(checked) => handleSelecionarEmpresaCobranca(empresa.id, !!checked)}
                            disabled={!temTelefone}
                          />
                          <div className="flex-1">
                            <p className="font-medium">
                              {empresa.codigo} - {empresa.razao_social}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {empresa.responsavel || "Sem responsável"} |{" "}
                              {empresa.telefone_cobranca || empresa.telefone || "Sem telefone"} | Dia{" "}
                              {String(empresa.dia_cobranca).padStart(2, "0")}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Histórico */}
          <TabsContent value="historico" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Cobranças</CardTitle>
              </CardHeader>
              <CardContent>
                {logsCobranca.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Nenhuma cobrança registrada ainda</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Criado em</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Enviado em</TableHead>
                        <TableHead>Mensagem</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logsCobranca.map((log) => {
                        const statusBadge = getStatusEnvioBadge(log.status_envio, log.webhook_resposta)
                        return (
                          <TableRow key={log.id}>
                            <TableCell className="text-sm">
                              {new Date(log.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                            </TableCell>
                            <TableCell className="font-mono">{log.empresa_codigo}</TableCell>
                            <TableCell>{log.empresa_nome}</TableCell>
                            <TableCell>{log.telefone_destino}</TableCell>
                            <TableCell>
                              <Badge variant={statusBadge.variant} className={statusBadge.className}>
                                {statusBadge.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {log.webhook_enviado_em
                                ? new Date(log.webhook_enviado_em).toLocaleString("pt-BR", {
                                  timeZone: "America/Sao_Paulo",
                                })
                                : "-"}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {log.mensagem_enviada || log.mensagem}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog Adicionar Empresa */}
        <Dialog open={dialogAdicionarAberto} onOpenChange={setDialogAdicionarAberto}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Empresa à Cobrança de Ponto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Buscar e Selecionar Empresa</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between bg-transparent">
                      {empresaSelecionada
                        ? empresasDisponiveis.find((e) => e.id === empresaSelecionada)?.razao_social
                        : "Selecione uma empresa"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Buscar empresa..."
                        value={buscaEmpresaDisponivel}
                        onValueChange={setBuscaEmpresaDisponivel}
                      />
                      <CommandList className="max-h-[300px] overflow-y-auto">
                        <CommandEmpty>Nenhuma empresa encontrada.</CommandEmpty>
                        <CommandGroup>
                          {empresasDisponiveisFiltradas.map((empresa) => (
                            <CommandItem
                              key={empresa.id}
                              value={empresa.id}
                              onSelect={(currentValue) => {
                                setEmpresaSelecionada(currentValue === empresaSelecionada ? "" : currentValue)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  empresaSelecionada === empresa.id ? "opacity-100" : "opacity-0",
                                )}
                              />
                              {empresa.codigo} - {empresa.razao_social}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Dia de Cobrança</Label>
                <Select
                  value={String(diaCobrancaSelecionado)}
                  onValueChange={(v) => setDiaCobrancaSelecionado(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Dia 01</SelectItem>
                    <SelectItem value="25">Dia 25</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Telefone para Cobrança (opcional)</Label>
                <Input
                  placeholder="Ex: 5531999887766"
                  value={telefoneCobranca}
                  onChange={(e) => setTelefoneCobranca(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Se não informado, será usado o telefone cadastrado na empresa
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogAdicionarAberto(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAdicionarEmpresa} disabled={loadingAcao}>
                {loadingAcao && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Adicionar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Remover Empresa */}
        <Dialog open={dialogRemoverAberto} onOpenChange={setDialogRemoverAberto}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remover Empresa</DialogTitle>
            </DialogHeader>
            <p>
              Deseja remover a empresa <strong>{empresaParaRemover?.razao_social}</strong> da cobrança de ponto?
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogRemoverAberto(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleRemoverEmpresa} disabled={loadingAcao}>
                {loadingAcao && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Remover
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Reset */}
        <Dialog open={dialogResetAberto} onOpenChange={setDialogResetAberto}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resetar Todos os Status</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Esta ação irá resetar todos os status de envio para &quot;Aguardando&quot; e todos os status de ponto
                para &quot;Pendente&quot;.
              </p>
              <div className="space-y-2">
                <Label>Digite &quot;confirmar&quot; para continuar:</Label>
                <Input
                  value={confirmacaoReset}
                  onChange={(e) => setConfirmacaoReset(e.target.value)}
                  placeholder="confirmar"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogResetAberto(false)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleResetarTudo}
                disabled={loadingAcao || confirmacaoReset.toLowerCase() !== "confirmar"}
              >
                {loadingAcao && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Resetar Tudo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Progresso de Envio */}
        <Dialog
          open={dialogProgressoAberto}
          onOpenChange={(open) => !enviandoCobrancas && setDialogProgressoAberto(open)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Enviando Cobranças</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso geral</span>
                  <span>{Math.round(progressoTotal)}%</span>
                </div>
                <Progress value={progressoTotal} />
              </div>
              <div className="max-h-[300px] space-y-2 overflow-y-auto">
                {progressoEnvio.map((item) => (
                  <div key={item.empresa_id} className="flex items-center justify-between rounded-lg border p-3">
                    <span className="font-medium">{item.empresa_nome}</span>
                    <div className="flex items-center gap-2">
                      {item.status === "aguardando" && <Clock className="h-4 w-4 text-muted-foreground" />}
                      {item.status === "enviando" && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                      {item.status === "sucesso" && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {item.status === "erro" && (
                        <div className="flex items-center gap-1">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <span className="text-xs text-red-500">{item.mensagemErro}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setDialogProgressoAberto(false)} disabled={enviandoCobrancas}>
                {enviandoCobrancas ? "Aguarde..." : "Fechar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}
