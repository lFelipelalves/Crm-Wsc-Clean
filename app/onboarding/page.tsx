'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { AtividadeTable } from '@/components/atividades/atividade-table'
import { Card, CardContent } from '@/components/ui/card'
import { getAtividadesByTipo, getEmpresas } from '@/lib/services/api'
import type { Atividade, Empresa, TipoAtividade } from '@/lib/types'
import { getTipoAtividadeLabel } from '@/lib/utils/status-helpers'

export default function OnboardingPage() {
  const [atividades, setAtividades] = useState<Atividade[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const [atividadesData, empresasData] = await Promise.all([
          getAtividadesByTipo('ONBOARDING'),
          getEmpresas(),
        ])
        setAtividades(atividadesData)
        setEmpresas(empresasData)
      } catch (error) {
        console.error('[v0] Failed to load onboarding data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Onboarding</h1>
          <p className="text-muted-foreground">
            Acompanhe o processo de integração de novos clientes
          </p>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Carregando dados...
            </CardContent>
          </Card>
        ) : atividades.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhum onboarding encontrado
            </CardContent>
          </Card>
        ) : (
          <AtividadeTable atividades={atividades} empresas={empresas} />
        )}
      </div>
    </AppLayout>
  )
}
