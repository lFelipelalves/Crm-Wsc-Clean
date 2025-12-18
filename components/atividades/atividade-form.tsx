'use client'

import { useState } from 'react'
import type { Atividade, Empresa, ContatoEmpresa } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface AtividadeFormProps {
  atividade: Atividade
  empresa?: Empresa
  contatos?: ContatoEmpresa[]
  onSave?: (atividade: Atividade) => void
}

const TIPOS_ATIVIDADES = [
  'COBRANCA_PONTO_FISCAL',
  'COBRANCA_DOCUMENTO_FISCAL',
  'ENVIO_GUIAS_FISCAL',
  'ENVIO_DOCUMENTOS_CONTABIL',
  'ENVIO_GUIAS_CONTABIL',
  'COBRANCA_RECIBO_ALUGUEL',
  'COBRANCA_FATURAMENTO',
  'ONBOARDING',
  'FECHAMENTO',
]

const STATUS_OPTIONS = [
  'NAO_INICIADO',
  'EM_ANDAMENTO',
  'FEITO',
  'PENDENTE_CLIENTE',
  'ATRASADO',
  'PAUSADO',
  'CANCELADO',
]

const PRIORIDADES = ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA']

export function AtividadeForm({ atividade, empresa, contatos = [], onSave }: AtividadeFormProps) {
  const [formData, setFormData] = useState<Atividade>(atividade)

  const handleChange = (field: keyof Atividade, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    onSave?.(formData)
  }

  const formatTipoAtividade = (tipo: string) => {
    return tipo.split('_').join(' ')
  }

  return (
    <div className="space-y-6">
      {/* Empresa Info */}
      {empresa && (
        <Card>
          <CardHeader>
            <CardTitle>Informações da Empresa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Razão Social</p>
                <p className="font-semibold">{empresa.razaoSocial}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Código</p>
                <p className="font-semibold">#{empresa.codigoEmpresa}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CNPJ</p>
                <p className="font-semibold">{empresa.cnpj || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Responsável</p>
                <p className="font-semibold">{empresa.responsavelPrincipal}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Atividade Details */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhes da Atividade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo de Atividade</Label>
              <Select value={formData.tipoAtividade} onValueChange={(value) => handleChange('tipoAtividade', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_ATIVIDADES.map(tipo => (
                    <SelectItem key={tipo} value={tipo}>
                      {formatTipoAtividade(tipo)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(status => (
                    <SelectItem key={status} value={status}>
                      {status.split('_').join(' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Prioridade</Label>
              <Select value={formData.prioridade} onValueChange={(value) => handleChange('prioridade', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORIDADES.map(prio => (
                    <SelectItem key={prio} value={prio}>
                      {prio}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Responsável Interno</Label>
              <Input
                value={formData.responsavelInterno}
                onChange={(e) => handleChange('responsavelInterno', e.target.value)}
                placeholder="Nome do responsável"
              />
            </div>

            {formData.diaRecorrente !== undefined && (
              <div>
                <Label>Dia Recorrente (1-31)</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.diaRecorrente}
                  onChange={(e) => handleChange('diaRecorrente', parseInt(e.target.value))}
                  placeholder="Ex: 25"
                />
              </div>
            )}

            <div>
              <Label>Data de Execução</Label>
              <Input
                type="date"
                value={formData.dataExecucao ? new Date(formData.dataExecucao).toISOString().split('T')[0] : ''}
                onChange={(e) => handleChange('dataExecucao', e.target.value ? new Date(e.target.value) : undefined)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Selection */}
      {contatos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Telefone Utilizado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={formData.telefoneUsado || ''} onValueChange={(value) => handleChange('telefoneUsado', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar contato" />
              </SelectTrigger>
              <SelectContent>
                {contatos.map(contato => (
                  <SelectItem key={contato.id} value={contato.telefone}>
                    <div className="flex items-center gap-2">
                      <span>{contato.nome}</span>
                      <Badge variant="outline" className="text-xs">{contato.tipoContato}</Badge>
                      <span className="text-muted-foreground">{contato.telefone}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.telefoneUsado && (
              <p className="text-sm text-muted-foreground">Telefone selecionado: {formData.telefoneUsado}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Observações */}
      <Card>
        <CardHeader>
          <CardTitle>Observações</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.observacao || ''}
            onChange={(e) => handleChange('observacao', e.target.value)}
            placeholder="Adicione observações sobre esta atividade..."
            rows={4}
          />
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={handleSave} className="flex-1">
          Salvar Alterações
        </Button>
        <Button variant="outline" className="flex-1">
          Cancelar
        </Button>
      </div>
    </div>
  )
}
