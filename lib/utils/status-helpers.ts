import type {
  StatusAtividade,
  StatusTarefa,
  TipoAtividade,
} from '../types'

export function getStatusAtividadeLabel(status: StatusAtividade): string {
  const labels: Record<StatusAtividade, string> = {
    NAO_INICIADO: 'Não Iniciado',
    EM_ANDAMENTO: 'Em Andamento',
    FEITO: 'Feito',
    PENDENTE_CLIENTE: 'Pendente Cliente',
    ATRASADO: 'Atrasado',
    PAUSADO: 'Pausado',
    CANCELADO: 'Cancelado',
  }
  return labels[status]
}

export function getStatusAtividadeVariant(status: StatusAtividade): 'default' | 'secondary' | 'destructive' | 'outline' {
  const variants: Record<StatusAtividade, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    NAO_INICIADO: 'outline',
    EM_ANDAMENTO: 'secondary',
    FEITO: 'default',
    PENDENTE_CLIENTE: 'default',
    ATRASADO: 'destructive',
    PAUSADO: 'outline',
    CANCELADO: 'destructive',
  }
  return variants[status]
}

export function getTipoAtividadeLabel(tipo: TipoAtividade): string {
  const labels: Record<TipoAtividade, string> = {
    COBRANCA_PONTO_FISCAL: 'Cobrança de Ponto Fiscal',
    COBRANCA_DOCUMENTO_FISCAL: 'Cobrança de Documento Fiscal',
    ENVIO_GUIAS_FISCAL: 'Envio de Guias Fiscal',
    ENVIO_DOCUMENTOS_CONTABIL: 'Envio de Documentos Contábil',
    ENVIO_GUIAS_CONTABIL: 'Envio de Guias Contábil',
    COBRANCA_RECIBO_ALUGUEL: 'Cobrança de Recibo Aluguel',
    COBRANCA_FATURAMENTO: 'Cobrança de Faturamento',
    ONBOARDING: 'Onboarding',
    FECHAMENTO: 'Fechamento',
  }
  return labels[tipo]
}

export function getPrioridadeLabel(prioridade: string): string {
  const labels: Record<string, string> = {
    BAIXA: 'Baixa',
    MEDIA: 'Média',
    ALTA: 'Alta',
    CRITICA: 'Crítica',
  }
  return labels[prioridade] || prioridade
}

export function getPrioridadeVariant(prioridade: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    BAIXA: 'outline',
    MEDIA: 'secondary',
    ALTA: 'default',
    CRITICA: 'destructive',
  }
  return variants[prioridade] || 'default'
}

export function getStatusTarefaLabel(status: StatusTarefa): string {
  const labels: Record<StatusTarefa, string> = {
    ABERTA: 'Aberta',
    EM_ANDAMENTO: 'Em Andamento',
    CONCLUIDA: 'Concluída',
    BLOQUEADA: 'Bloqueada',
  }
  return labels[status]
}

export function getStatusPontoLabel(enviado: boolean): string {
  return enviado ? 'Enviado' : 'Não Enviado'
}

export function getStatusPontoVariant(enviado: boolean): 'default' | 'destructive' {
  return enviado ? 'default' : 'destructive'
}

export function getStatusFechamentoLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDENTE: 'Pendente',
    EM_ANDAMENTO: 'Em Andamento',
    CONCLUIDO: 'Concluído',
    ATRASADO: 'Atrasado',
  }
  return labels[status] || status
}

export function getStatusFechamentoVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    PENDENTE: 'outline',
    EM_ANDAMENTO: 'secondary',
    CONCLUIDO: 'default',
    ATRASADO: 'destructive',
  }
  return variants[status] || 'default'
}

export function getStatusProLaboreLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDENTE: 'Pendente',
    PROCESSADO: 'Processado',
    PAGO: 'Pago',
    ATRASADO: 'Atrasado',
  }
  return labels[status] || status
}

export function getStatusProLaboreVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    PENDENTE: 'outline',
    PROCESSADO: 'secondary',
    PAGO: 'default',
    ATRASADO: 'destructive',
  }
  return variants[status] || 'default'
}
