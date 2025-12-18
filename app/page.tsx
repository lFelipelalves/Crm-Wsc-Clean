import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { AlertCircle, Clock, CheckCircle2, Users, TrendingUp } from 'lucide-react'
import { getAtividades, getOnboardings, getEmpresas } from '@/lib/services/api'
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

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Controle central de todas as atividades
          </p>
        </div>

        {/* Main Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                Atrasados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{atrasados}</div>
              <p className="text-xs text-muted-foreground">requerem atenção</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                Pendente Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendentesCliente}</div>
              <p className="text-xs text-muted-foreground">aguardando retorno</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                Em Andamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{emAndamento}</div>
              <p className="text-xs text-muted-foreground">em progresso</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Concluídos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{feitos}</div>
              <p className="text-xs text-muted-foreground">mês atual</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-500" />
                Empresas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{empresas.filter(e => e.ativo).length}</div>
              <p className="text-xs text-muted-foreground">ativas</p>
            </CardContent>
          </Card>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Onboarding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Em Andamento</span>
                <span className="font-semibold">{onboardingEmAndamento}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Concluído</span>
                <span className="font-semibold">{onboardingConcluido}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Total Atividades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{atividades.length}</div>
              <p className="text-xs text-muted-foreground">registradas</p>
            </CardContent>
          </Card>
        </div>

        {/* Critical Activities */}
        {criticas.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Atividades Críticas e Atrasadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {criticas.map((atividade) => {
                  const empresa = empresas.find((e) => e.id === atividade.empresaId)
                  return (
                    <div key={atividade.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{empresa?.razaoSocial}</p>
                        <p className="text-xs text-muted-foreground">{atividade.observacao || 'Sem observações'}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">{atividade.prioridade}</Badge>
                        <Badge>{atividade.status}</Badge>
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
