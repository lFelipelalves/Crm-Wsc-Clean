// Tipos para o Supabase

export type StatusEnvio = "AGUARDANDO" | "ENVIANDO" | "ENVIADO" | "ERRO"
export type StatusPonto = "PENDENTE" | "RECEBIDO" | "NAO_RECEBIDO"
export type StatusLista = "ATIVA" | "FINALIZADA" | "CANCELADA"
export type TipoMensagem = "TEXTO" | "AUDIO"

export interface Empresa {
  id: string
  codigo: string
  razao_social: string
  cnpj?: string
  responsavel?: string
  telefone?: string
  email?: string
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface EmpresaCobrancaPonto {
  id: string
  empresa_id: string
  dia_cobranca: number // 1 ou 25
  telefone_cobranca?: string // Telefone específico para cobrança
  status_ponto: StatusPonto
  observacoes?: string
  ultima_cobranca?: string
  ativo: boolean
  created_at: string
  updated_at: string
  // Join com empresa
  empresa?: Empresa
}

export interface EmpresaCobrancaPontoView {
  id: string
  empresa_id: string
  codigo: string
  razao_social: string
  responsavel?: string
  telefone?: string
  telefone_cobranca?: string // Telefone específico para cobrança
  dia_cobranca: number
  status_ponto: StatusPonto
  observacoes?: string
  ultima_cobranca?: string
}

export interface LogCobrancaPonto {
  id: string
  empresa_cobranca_id: string
  empresa_id: string
  empresa_codigo: string
  empresa_nome: string
  responsavel?: string
  telefone_destino: string
  dia_cobranca: number
  mensagem_enviada?: string
  tipo_mensagem: TipoMensagem
  arquivo_audio_url?: string
  status_envio: StatusEnvio
  webhook_enviado_em?: string
  webhook_resposta?: Record<string, unknown>
  webhook_erro?: string
  competencia: string
  data_cobranca?: string
  created_at: string
  updated_at: string
}

export interface ListaCobranca {
  id: string
  nome: string
  tipo: string
  competencia?: string
  filtro_dia_01: boolean
  filtro_dia_25: boolean
  filtro_pendentes: boolean
  status: StatusLista
  total_empresas: number
  total_enviados: number
  mensagem_padrao?: string
  tipo_mensagem_padrao?: TipoMensagem
  arquivo_audio_url?: string
  created_at: string
  updated_at: string
}

export interface ProgressoEnvio {
  empresa_id: string
  empresa_nome: string
  status: "aguardando" | "enviando" | "sucesso" | "erro"
  mensagem?: string
}

export interface CriarCobrancaPayload {
  empresa_cobranca_id: string
  mensagem: string
  tipo_mensagem: TipoMensagem
  arquivo_audio_url?: string
  data_cobranca?: string
}
