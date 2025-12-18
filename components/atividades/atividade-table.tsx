'use client'

import { useMemo, useState } from 'react'
import type { Atividade, Empresa } from '@/lib/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/utils/date-helpers'
import { getStatusAtividadeLabel, getStatusAtividadeVariant, getPrioridadeLabel, getPrioridadeVariant } from '@/lib/utils/status-helpers'
import { Search, Eye } from 'lucide-react'
import Link from 'next/link'

interface AtividadeTableProps {
  atividades: Atividade[]
  empresas: Empresa[]
  onUpdateAtividade?: (atividade: Atividade) => void
}

export function AtividadeTable({ atividades, empresas, onUpdateAtividade }: AtividadeTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  const filtered = useMemo(() => {
    return atividades.filter((a) => {
      const empresa = empresas.find((e) => e.id === a.empresaId)
      const matchesSearch = 
        empresa?.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.observacao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        empresa?.codigoEmpresa.toString().includes(searchTerm)
      
      const matchesStatus = !statusFilter || a.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [atividades, empresas, searchTerm, statusFilter])

  const statuses = Array.from(new Set(atividades.map((a) => a.status)))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Atividades ({filtered.length})</CardTitle>
        <div className="flex gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex gap-1">
            {statuses.map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
              >
                {getStatusAtividadeLabel(status)}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 font-medium">Data</th>
                <th className="text-left p-2 font-medium">Código</th>
                <th className="text-left p-2 font-medium">Empresa</th>
                <th className="text-left p-2 font-medium">Responsável</th>
                <th className="text-left p-2 font-medium">Telefone</th>
                <th className="text-left p-2 font-medium">Tipo</th>
                <th className="text-left p-2 font-medium">Status</th>
                <th className="text-left p-2 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-4 text-muted-foreground">
                    Nenhuma atividade encontrada
                  </td>
                </tr>
              ) : (
                filtered.map((atividade) => {
                  const empresa = empresas.find((e) => e.id === atividade.empresaId)
                  return (
                    <tr key={atividade.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 text-xs">
                        {atividade.dataExecucao ? formatDate(atividade.dataExecucao) : 
                          atividade.diaRecorrente ? `dia ${atividade.diaRecorrente}` : '-'}
                      </td>
                      <td className="p-2 text-xs font-medium">#{empresa?.codigoEmpresa}</td>
                      <td className="p-2">
                        <p className="font-medium text-sm">{empresa?.razaoSocial}</p>
                      </td>
                      <td className="p-2 text-xs">{empresa?.responsavelPrincipal || '-'}</td>
                      <td className="p-2 text-xs">{atividade.telefoneUsado || empresa?.telefonePrincipal || '-'}</td>
                      <td className="p-2">
                        <p className="text-xs">{atividade.tipoAtividade.replace(/_/g, ' ')}</p>
                      </td>
                      <td className="p-2">
                        <Badge variant={getStatusAtividadeVariant(atividade.status)}>
                          {getStatusAtividadeLabel(atividade.status)}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <Link href={`/atividades/${atividade.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
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
  )
}
