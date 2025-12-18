import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { AlertCircle, Clock, CheckCircle2, Users, TrendingUp, Building2, Activity } from 'lucide-react'
import { getAtividades, getOnboardings, getEmpresas } from '@/lib/supabase/services/api'
import { Badge } from '@/components/ui/badge'

export default async function DashboardPage() {
  const [empresas, atividades, onboardings] = await Promise.all([
    getEmpresas(),
    getAtividades(),
    getOnboardings(),
  ])

  // Calculate metrics by status
  const atrasados = atividades.filter((a) => a.status === 'ATRASADO').length
  const pendentesCliente = atividades.filter((a) => a.status === 'PENDENTE_CLIENTE').length
  const emAndamento = atividades.filter((a) => a.status === 'EM_ANDAMENTO').length
  const feitos = atividades.filter((a) => a.status === 'FEITO').length

  // Onboarding metrics
  const onboardingEmAndamento = onboardings.filter((o) => o.status === 'EM_ANDAMENTO').length
  const onboardingConcluido = onboardings.filter((o) => o.status === 'FEITO').length

  // Critical activities
  const criticas = atividades
    .filter((a) => a.prioridade === 'CRITICA' || a.status === 'ATRASADO')
    .sort((a, b) => {
      if (a.status === 'ATRASADO' && b.status !== 'ATRASADO') return -1
      if (a.status !== 'ATRASADO' && b.status === 'ATRASADO') return 1
      return 0
    })
    .slice(0, 5)

  const totalAtividades = atividades.length
  const progressoPercentual = totalAtividades > 0 ? Math.round((feitos / totalAtividades) * 100) : 0

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header with subtle dev badge */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
              Visão Geral
            </h1>
            <p className="text-muted-foreground mt-2">
              Acompanhe o desempenho e status das atividades em tempo real
            </p>
          </div>
          <Badge variant="outline" className="text-xs px-2 py-1">
            Beta
          </Badge>
        </div>

        {/* Hero Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Atrasados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">{atrasados}</div>
              <p className="text-xs text-muted-foreground mt-1">Requerem atenção imediata</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Aguardando Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{pendentesCliente}</div>
              <p className="text-xs text-muted-foreground mt-1">Pendentes de retorno</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Em Progresso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{emAndamento}</div>
              <p className="text-xs text-muted-foreground mt-1">Atividades ativas</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Concluídos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{feitos}</div>
              <p className="text-xs text-muted-foreground mt-1">Finalizados este mês</p>
            </CardContent>
          </Card>
        </div>

        {/* Progress Overview */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Progresso Geral
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Taxa de Conclusão</span>
                  <span className="font-semibold">{progressoPercentual}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${progressoPercentual}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total de Atividades</p>
                  <p className="text-2xl font-bold">{totalAtividades}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Empresas Ativas</p>
                  <p className="text-2xl font-bold">{empresas.filter(e => e.ativo).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Onboarding
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <span className="text-sm font-medium">Em Andamento</span>
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{onboardingEmAndamento}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <span className="text-sm font-medium">Concluídos</span>
                  <span className="text-xl font-bold text-green-600 dark:text-green-400">{onboardingConcluido}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Critical Activities */}
        {criticas.length > 0 && (
          <Card className="border-red-200 dark:border-red-900">
            <CardHeader className="bg-red-50 dark:bg-red-950/20">
              <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertCircle className="h-5 w-5" />
                Atividades Críticas ({criticas.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {criticas.map((atividade) => {
                  const empresa = empresas.find((e) => e.id === atividade.empresaId)
                  return (
                    <div key={atividade.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{empresa?.razaoSocial}</p>
                        <p className="text-xs text-muted-foreground mt-1">{atividade.observacao || 'Sem observações'}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={atividade.status === 'ATRASADO' ? 'destructive' : 'outline'}>
                          {atividade.status}
                        </Badge>
                        {atividade.prioridade === 'CRITICA' && (
                          <Badge variant="destructive">CRÍTICA</Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
