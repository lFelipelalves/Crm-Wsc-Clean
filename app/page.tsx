import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { AlertCircle, Clock, CheckCircle2, TrendingUp, Building2, Activity, PieChart, FileText, Calendar, Users, Hammer } from 'lucide-react'
import { getAtividades, getOnboardings, getFechamentos } from '@/lib/services/api'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/server'

function DevelopmentPlaceholder({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed rounded-xl bg-muted/30 space-y-4">
      <Hammer className="h-12 w-12 text-muted-foreground animate-bounce" />
      <div className="text-center">
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="text-muted-foreground">Esta funcionalidade está em desenvolvimento.</p>
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch real companies from Supabase
  const { data: companiesRaw, error: companiesError } = await supabase
    .from("empresas")
    .select("*")
    .or("excluida.is.null,excluida.eq.false")
    .order("codigo", { ascending: true })

  if (companiesError) {
    console.error("Error fetching companies:", companiesError)
  }

  const empresas = companiesRaw || []

  const [atividades, onboardings, fechamentos] = await Promise.all([
    getAtividades(),
    getOnboardings(),
    getFechamentos(),
  ])

  const totalAtividades = atividades.length
  const feitosGeral = atividades.filter((a) => a.status === 'FEITO').length
  const progressoGeral = totalAtividades > 0 ? Math.round((feitosGeral / totalAtividades) * 100) : 0

  // Filter activities by group
  const pontoAtividades = atividades.filter(a => a.tipoAtividade === 'COBRANCA_PONTO_FISCAL')

  const renderMetrics = (acts: typeof atividades, title: string) => {
    const atrasados = acts.filter((a) => a.status === 'ATRASADO').length
    const pendentes = acts.filter((a) => a.status === 'PENDENTE_CLIENTE').length
    const emAndamento = acts.filter((a) => a.status === 'EM_ANDAMENTO').length
    const feitos = acts.filter((a) => a.status === 'FEITO').length
    const total = acts.length
    const progresso = total > 0 ? Math.round((feitos / total) * 100) : 0

    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-red-500 shadow-sm transition-all hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5" />
                Atrasados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{atrasados}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500 shadow-sm transition-all hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                Pendente Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{pendentes}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500 shadow-sm transition-all hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Activity className="h-3.5 w-3.5" />
                Em Progresso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{emAndamento}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500 shadow-sm transition-all hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Concluídos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{feitos}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Progresso - {title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxa de Conclusão</span>
                <span className="font-bold">{progresso}%</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5">
                <div
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-2.5 rounded-full transition-all duration-700"
                  style={{ width: `${progresso}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Total de {total} atividades identificadas para este departamento
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex items-start justify-between border-b pb-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-700 to-indigo-500 bg-clip-text text-transparent">
              Visão Geral
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              Gestão inteligente de atividades WSC
            </p>
          </div>
          <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
            PRODUÇÃO BETA
          </Badge>
        </div>

        <Tabs defaultValue="geral" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 h-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1">
            <TabsTrigger value="geral" className="data-[state=active]:bg-white data-[state=active]:shadow-sm py-2">
              <PieChart className="h-4 w-4 mr-2" /> Geral
            </TabsTrigger>
            <TabsTrigger value="ponto" className="data-[state=active]:bg-white data-[state=active]:shadow-sm py-2">
              <Clock className="h-4 w-4 mr-2" /> Ponto
            </TabsTrigger>
            <TabsTrigger value="fiscal" className="data-[state=active]:bg-white data-[state=active]:shadow-sm py-2">
              <FileText className="h-4 w-4 mr-2" /> Fiscal
            </TabsTrigger>
            <TabsTrigger value="contabil" className="data-[state=active]:bg-white data-[state=active]:shadow-sm py-2">
              <Activity className="h-4 w-4 mr-2" /> Contábil
            </TabsTrigger>
            <TabsTrigger value="onboarding" className="data-[state=active]:bg-white data-[state=active]:shadow-sm py-2">
              <Building2 className="h-4 w-4 mr-2" /> Onboarding
            </TabsTrigger>
            <TabsTrigger value="fechamento" className="data-[state=active]:bg-white data-[state=active]:shadow-sm py-2">
              <Calendar className="h-4 w-4 mr-2" /> Fechamento
            </TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="space-y-6 animate-in fade-in-50 duration-500">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="overflow-hidden hover:translate-y-[-2px] transition-transform">
                <CardHeader className="bg-blue-50/30 pb-4 border-b border-blue-100/30 backdrop-blur-sm">
                  <CardTitle className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Total de Clientes
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="text-4xl font-black text-slate-800">{empresas.length}</div>
                  <p className="text-xs text-slate-500 font-medium mt-2">Cadastrados no sistema</p>
                </CardContent>
              </Card>

              <Card className="overflow-hidden hover:translate-y-[-2px] transition-transform">
                <CardHeader className="bg-emerald-50/30 pb-4 border-b border-emerald-100/30 backdrop-blur-sm">
                  <CardTitle className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Clientes Ativos
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="text-4xl font-black text-slate-800">{empresas.filter(e => e.ativo).length}</div>
                  <p className="text-xs text-slate-500 font-medium mt-2">Operação normal</p>
                </CardContent>
              </Card>

              <Card className="overflow-hidden hover:translate-y-[-2px] transition-transform">
                <CardHeader className="bg-slate-50/30 pb-4 border-b border-slate-100/30 backdrop-blur-sm">
                  <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Clientes Inativos
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="text-4xl font-black text-slate-800">{empresas.filter(e => !e.ativo).length}</div>
                  <p className="text-xs text-slate-500 font-medium mt-2">Sem movimentação</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-500" />
                    Atividades Recentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground italic">
                    Nenhuma atividade recente para exibir.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Desempenho Semanal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-32 flex items-center justify-center border-2 border-dashed rounded-lg bg-muted/20">
                    <PieChart className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ponto" className="animate-in slide-in-from-right-2 duration-300">
            {renderMetrics(pontoAtividades, "Cobrança de Ponto")}
          </TabsContent>

          <TabsContent value="fiscal" className="animate-in slide-in-from-right-2 duration-300">
            <DevelopmentPlaceholder title="Departamento Fiscal" />
          </TabsContent>

          <TabsContent value="contabil" className="animate-in slide-in-from-right-2 duration-300">
            <DevelopmentPlaceholder title="Departamento Contábil" />
          </TabsContent>

          <TabsContent value="onboarding" className="animate-in slide-in-from-right-2 duration-300">
            <DevelopmentPlaceholder title="Onboarding" />
          </TabsContent>

          <TabsContent value="fechamento" className="animate-in slide-in-from-right-2 duration-300">
            <DevelopmentPlaceholder title="Fechamento Mensal" />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}


