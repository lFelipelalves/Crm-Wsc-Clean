'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getAtividades, getEmpresas, updateAtividade, createAtividade } from '@/lib/services/api'
import type { Atividade, Empresa } from '@/lib/types'
import { formatDate } from '@/lib/utils/date-helpers'
import { useToast } from '@/hooks/use-toast'

export default function CobrancaPontoPage() {
  const [atividades, setAtividades] = useState<Atividade[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [allAtividades, allEmpresas] = await Promise.all([
        getAtividades(),
        getEmpresas()
      ])
      
      const cobrancaPonto = allAtividades.filter(a => a.tipoAtividade === 'COBRANCA_PONTO_FISCAL')
      setAtividades(cobrancaPonto)
      setEmpresas(allEmpresas)
    } catch (error) {
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar as cobranças de ponto.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(atividadeId: string, newStatus: string) {
    const atividade = atividades.find(a => a.id === atividadeId)
    if (!atividade) return

    try {
      const updated = await updateAtividade(atividadeId, {
        ...atividade,
        status: newStatus as any,
        dataExecucao: newStatus === 'FEITO' ? new Date() : atividade.dataExecucao
      })
      
      setAtividades(prev => prev.map(a => a.id === atividadeId ? updated : a))
      
      toast({
        title: 'Status atualizado',
        description: 'O status da cobrança foi atualizado com sucesso.'
      })
    } catch (error) {
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar o status.',
        variant: 'destructive'
      })
    }
  }

  async function handleAddCobranca() {
    if (empresas.length === 0) return

    try {
      const novaCobranca: Omit<Atividade, 'id'> = {
        empresaId: empresas[0].id,
        tipoAtividade: 'COBRANCA_PONTO_FISCAL',
        status: 'NAO_INICIADO',
        diaRecorrente: 25,
        dataInicio: new Date(),
        responsavelInterno: 'Não atribuído',
        prioridade: 'MEDIA'
      }

      const created = await createAtividade(novaCobranca)
      setAtividades(prev => [...prev, created])
      
      toast({
        title: 'Cobrança criada',
        description: 'Nova cobrança de ponto adicionada.'
      })
    } catch (error) {
      toast({
        title: 'Erro ao criar',
        description: 'Não foi possível criar a cobrança.',
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Cobrança de Ponto</h1>
            <p className="text-muted-foreground mt-1">
              Controle de envio de ponto dos funcionários
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadData}>
              Atualizar
            </Button>
            <Button onClick={handleAddCobranca}>
              Nova Cobrança
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Cobranças ({atividades.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b-2">
                    <th className="text-left p-3 font-semibold text-sm">DATA DA COBRANÇA</th>
                    <th className="text-left p-3 font-semibold text-sm">Empresas</th>
                    <th className="text-left p-3 font-semibold text-sm">Responsável</th>
                    <th className="text-left p-3 font-semibold text-sm">Telefone</th>
                    <th className="text-left p-3 font-semibold text-sm">Enviou o ponto</th>
                  </tr>
                </thead>
                <tbody>
                  {atividades.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center p-8 text-muted-foreground">
                        Nenhuma cobrança cadastrada. Clique em "Nova Cobrança" para adicionar.
                      </td>
                    </tr>
                  ) : (
                    atividades.map((atividade) => {
                      const empresa = empresas.find(e => e.id === atividade.empresaId)
                      
                      return (
                        <tr key={atividade.id} className="border-b hover:bg-muted/30">
                          <td className="p-3">
                            <span className="text-sm">
                              {atividade.dataExecucao ? formatDate(atividade.dataExecucao) : 
                                atividade.diaRecorrente ? `${atividade.diaRecorrente}/11/2025` : '-'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="text-sm font-medium">{empresa?.codigoEmpresa || '-'}</span>
                          </td>
                          <td className="p-3">
                            <span className="text-sm font-medium">{empresa?.responsavelPrincipal || '-'}</span>
                          </td>
                          <td className="p-3">
                            <span className="text-sm">{atividade.telefoneUsado || empresa?.telefonePrincipal || '-'}</span>
                          </td>
                          <td className="p-3">
                            <Select
                              value={atividade.status}
                              onValueChange={(value) => handleStatusChange(atividade.id, value)}
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="NAO_INICIADO">Não Enviado</SelectItem>
                                <SelectItem value="FEITO">Enviado</SelectItem>
                                <SelectItem value="PENDENTE_CLIENTE">Pendente Cliente</SelectItem>
                                <SelectItem value="ATRASADO">Atrasado</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
