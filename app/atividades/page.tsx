'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { AtividadeTable } from '@/components/atividades/atividade-table'
import { getAtividades, getEmpresas } from '@/lib/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Loader2 } from 'lucide-react'
import type { TipoAtividade, Atividade, Empresa } from '@/lib/types'
import Link from 'next/link'

const TIPOS_ATIVIDADES: { value: TipoAtividade; label: string }[] = [
  { value: 'COBRANCA_PONTO_FISCAL', label: 'Cobrança Ponto Fiscal' },
  { value: 'COBRANCA_DOCUMENTO_FISCAL', label: 'Cobrança Documento Fiscal' },
  { value: 'ENVIO_GUIAS_FISCAL', label: 'Envio Guias Fiscal' },
  { value: 'ENVIO_DOCUMENTOS_CONTABIL', label: 'Envio Documentos Contábil' },
  { value: 'ENVIO_GUIAS_CONTABIL', label: 'Envio Guias Contábil' },
  { value: 'COBRANCA_RECIBO_ALUGUEL', label: 'Cobrança Recibo Aluguel' },
  { value: 'COBRANCA_FATURAMENTO', label: 'Cobrança Faturamento' },
  { value: 'ONBOARDING', label: 'Onboarding' },
  { value: 'FECHAMENTO', label: 'Fechamento' },
]

export default function AtividadesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<TipoAtividade | 'TODOS'>('TODOS')
  const [statusFilter, setStatusFilter] = useState('TODOS')
  const [atividades, setAtividades] = useState<Atividade[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [atividadesData, empresasData] = await Promise.all([
          getAtividades(),
          getEmpresas(),
        ])
        setAtividades(atividadesData)
        setEmpresas(empresasData)
      } catch (error) {
        console.error('[v0] Error loading atividades:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const filtered = atividades.filter((a) => {
    const empresa = empresas.find((e) => e.id === a.empresaId)
    const matchesSearch = empresa?.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'TODOS' || a.tipoAtividade === selectedType
    const matchesStatus = statusFilter === 'TODOS' || a.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Carregando atividades...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Todas as Atividades</h1>
            <p className="text-muted-foreground">Gerencie todas as atividades do escritório</p>
          </div>
          <Link href="/atividades/nova">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Atividade
            </Button>
          </Link>
        </div>

        <div className="flex gap-4 flex-col sm:flex-row">
          <Input
            placeholder="Buscar por empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Select
            value={selectedType}
            onValueChange={(value) => setSelectedType(value as TipoAtividade | 'TODOS')}
          >
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos os tipos</SelectItem>
              {TIPOS_ATIVIDADES.map((tipo) => (
                <SelectItem key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos</SelectItem>
              <SelectItem value="NAO_INICIADO">Não Iniciado</SelectItem>
              <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
              <SelectItem value="FEITO">Feito</SelectItem>
              <SelectItem value="ATRASADO">Atrasado</SelectItem>
              <SelectItem value="PENDENTE_CLIENTE">Pendente Cliente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <AtividadeTable atividades={filtered} empresas={empresas} />
      </div>
    </AppLayout>
  )
}
