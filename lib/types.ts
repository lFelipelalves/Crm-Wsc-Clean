export type TipoAtividade = 
  | "COBRANCA_PONTO_FISCAL"
  | "COBRANCA_DOCUMENTO_FISCAL"
  | "ENVIO_GUIAS_FISCAL"
  | "ENVIO_DOCUMENTOS_CONTABIL"
  | "ENVIO_GUIAS_CONTABIL"
  | "COBRANCA_RECIBO_ALUGUEL"
  | "COBRANCA_FATURAMENTO"
  | "ONBOARDING"
  | "FECHAMENTO"

export type StatusAtividade = 
  | "NAO_INICIADO" 
  | "EM_ANDAMENTO" 
  | "FEITO" 
  | "PENDENTE_CLIENTE" 
  | "ATRASADO"
  | "PAUSADO"
  | "CANCELADO"

export type StatusTarefa = 
  | "ABERTA" 
  | "EM_ANDAMENTO" 
  | "CONCLUIDA" 
  | "BLOQUEADA"

export type TipoTarefa = 
  | "DOCUMENTO" 
  | "CADASTRO" 
  | "CONFIGURACAO_SISTEMA"

export type TipoContato = 
  | "DP" 
  | "FINANCEIRO" 
  | "SOCIETARIO"

export interface Empresa {
  id: string
  codigoEmpresa: number
  razaoSocial: string
  cnpj?: string
  telefonePrincipal: string
  responsavelPrincipal: string
  ativo: boolean
}

export interface ContatoEmpresa {
  id: string
  empresaId: string
  nome: string
  telefone: string
  email: string
  tipoContato: TipoContato
}

export interface Atividade {
  id: string
  empresaId: string
  tipoAtividade: TipoAtividade
  status: StatusAtividade
  diaRecorrente?: number // Dia do mês para atividades recorrentes (1-31)
  dataInicio?: Date // Data quando a atividade pode ser iniciada
  dataExecucao?: Date // Data quando foi realizada/cobrada
  responsavelInterno: string
  telefoneUsado?: string
  observacao?: string
  prioridade: "BAIXA" | "MEDIA" | "ALTA" | "CRITICA"
}

export interface OnboardingCliente {
  id: string
  empresaId: string
  dataEntrada: Date
  responsavelInterno: string
  status: StatusAtividade
}

export interface OnboardingTarefa {
  id: string
  onboardingId: string
  tituloTarefa: string
  descricaoOpcional?: string
  prazo: Date
  statusTarefa: StatusTarefa
  tipoTarefa: TipoTarefa
}

export interface FechamentoMensal {
  id: string
  empresaId: string
  mes: number // 0-11
  ano: number
  statusPrimeiroFechamento: StatusAtividade
  statusSegundoFechamento: StatusAtividade
  statusTerceiroFechamento: StatusAtividade
  statusProLabore: StatusAtividade
  observacao?: string
}
