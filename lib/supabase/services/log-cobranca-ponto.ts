import { createClient } from "@/lib/supabase/client"
import type { LogCobrancaPonto, EmpresaCobrancaPontoView, TipoMensagem } from "@/lib/supabase/types"

const supabase = createClient()

// Obter competência atual (formato: 2025-01)
function getCompetenciaAtual(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

// Criar log de cobrança
export async function criarLogCobranca(
  empresa: EmpresaCobrancaPontoView,
  mensagem: string,
  tipoMensagem: TipoMensagem,
  arquivoAudioUrl?: string,
  dataCobranca?: string,
): Promise<LogCobrancaPonto | null> {
  const telefoneDestino = empresa.telefone_cobranca || empresa.telefone || ""

  const { data, error } = await supabase
    .from("log_cobranca_ponto")
    .insert({
      empresa_cobranca_id: empresa.id,
      empresa_id: empresa.empresa_id,
      telefone_destino: telefoneDestino,
      mensagem: mensagem,
      tipo_mensagem: tipoMensagem,
      arquivo_url: arquivoAudioUrl,
      status_envio: "PENDENTE",
      competencia: getCompetenciaAtual(),
      data_cobranca: dataCobranca || null,
    })
    .select()
    .single()

  if (error) {
    console.error("Erro ao criar log de cobrança:", error)
    return null
  }

  return data as any
}

// Atualizar status do log após resposta do webhook
export async function atualizarLogCobranca(
  logId: string,
  status: "ENVIANDO" | "ENVIADO" | "ERRO",
  webhookResposta?: Record<string, unknown>,
  webhookErro?: string,
): Promise<boolean> {
  const updateData: Record<string, unknown> = {
    status_envio: status,
  }

  if (status === "ENVIANDO") {
    updateData.enviado_em = new Date().toISOString()
  }

  if (webhookResposta) {
    updateData.webhook_response = webhookResposta
  }

  if (webhookErro) {
    updateData.erro_mensagem = webhookErro
  }

  const { error } = await supabase.from("log_cobranca_ponto").update(updateData).eq("id", logId)

  if (error) {
    console.error("Erro ao atualizar log de cobrança:", error)
    return false
  }

  return true
}

export async function buscarLogsPorCompetencia(competencia?: string): Promise<LogCobrancaPonto[]> {
  const comp = competencia || getCompetenciaAtual()

  // Buscar apenas os logs
  const { data: logs, error: logsError } = await supabase
    .from("log_cobranca_ponto")
    .select(`
      id,
      empresa_cobranca_id,
      empresa_id,
      telefone_destino,
      mensagem,
      tipo_mensagem,
      arquivo_url,
      status_envio,
      enviado_em,
      webhook_response,
      erro_mensagem,
      competencia,
      data_cobranca,
      created_at,
      updated_at
    `)
    .eq("competencia", comp)
    .order("created_at", { ascending: false })

  if (logsError) {
    console.error("Erro ao buscar logs:", logsError)
    return []
  }

  if (!logs || logs.length === 0) {
    return []
  }

  // Buscar IDs únicos de empresas
  const empresaIds = [...new Set(logs.map((l) => l.empresa_id).filter(Boolean))]

  // Buscar dados das empresas separadamente
  const { data: empresas } = await supabase
    .from("empresas")
    .select("id, codigo, razao_social, responsavel")
    .in("id", empresaIds)

  // Buscar dados de empresa_cobranca separadamente
  const empresaCobrancaIds = [...new Set(logs.map((l) => l.empresa_cobranca_id).filter(Boolean))]
  const { data: empresasCobranca } = await supabase
    .from("empresas_cobranca_ponto")
    .select("id, dia_cobranca")
    .in("id", empresaCobrancaIds)

  // Criar mapas para lookup
  const empresasMap = new Map((empresas || []).map((e) => [e.id, e]))
  const empresasCobrancaMap = new Map((empresasCobranca || []).map((e) => [e.id, e]))

  return logs.map((item: any) => {
    const empresa = empresasMap.get(item.empresa_id)
    const empresaCobranca = empresasCobrancaMap.get(item.empresa_cobranca_id)

    return {
      id: item.id,
      empresa_cobranca_id: item.empresa_cobranca_id,
      empresa_id: item.empresa_id,
      empresa_codigo: empresa?.codigo || "",
      empresa_nome: empresa?.razao_social || "",
      responsavel: empresa?.responsavel,
      telefone_destino: item.telefone_destino,
      dia_cobranca: empresaCobranca?.dia_cobranca || 0,
      mensagem_enviada: item.mensagem,
      tipo_mensagem: item.tipo_mensagem,
      arquivo_audio_url: item.arquivo_url,
      status_envio: item.status_envio,
      webhook_enviado_em: item.enviado_em,
      webhook_resposta: item.webhook_response,
      webhook_erro: item.erro_mensagem,
      competencia: item.competencia,
      data_cobranca: item.data_cobranca,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }
  })
}

export async function buscarLogsPorEmpresa(empresaCobrancaId: string): Promise<LogCobrancaPonto[]> {
  const { data: logs, error: logsError } = await supabase
    .from("log_cobranca_ponto")
    .select(`
      id,
      empresa_cobranca_id,
      empresa_id,
      telefone_destino,
      mensagem,
      tipo_mensagem,
      arquivo_url,
      status_envio,
      enviado_em,
      webhook_response,
      erro_mensagem,
      competencia,
      data_cobranca,
      created_at,
      updated_at
    `)
    .eq("empresa_cobranca_id", empresaCobrancaId)
    .order("created_at", { ascending: false })

  if (logsError) {
    console.error("Erro ao buscar logs da empresa:", logsError)
    return []
  }

  if (!logs || logs.length === 0) {
    return []
  }

  // Buscar dados das empresas
  const empresaIds = [...new Set(logs.map((l) => l.empresa_id).filter(Boolean))]
  const { data: empresas } = await supabase
    .from("empresas")
    .select("id, codigo, razao_social, responsavel")
    .in("id", empresaIds)

  // Buscar dados de empresa_cobranca
  const { data: empresasCobranca } = await supabase
    .from("empresas_cobranca_ponto")
    .select("id, dia_cobranca")
    .eq("id", empresaCobrancaId)

  const empresasMap = new Map((empresas || []).map((e) => [e.id, e]))
  const empresaCobranca = empresasCobranca?.[0]

  return logs.map((item: any) => {
    const empresa = empresasMap.get(item.empresa_id)

    return {
      id: item.id,
      empresa_cobranca_id: item.empresa_cobranca_id,
      empresa_id: item.empresa_id,
      empresa_codigo: empresa?.codigo || "",
      empresa_nome: empresa?.razao_social || "",
      responsavel: empresa?.responsavel,
      telefone_destino: item.telefone_destino,
      dia_cobranca: empresaCobranca?.dia_cobranca || 0,
      mensagem_enviada: item.mensagem,
      tipo_mensagem: item.tipo_mensagem,
      arquivo_audio_url: item.arquivo_url,
      status_envio: item.status_envio,
      webhook_enviado_em: item.enviado_em,
      webhook_resposta: item.webhook_response,
      webhook_erro: item.erro_mensagem,
      competencia: item.competencia,
      data_cobranca: item.data_cobranca,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }
  })
}

// Estatísticas de cobrança por competência
export async function getEstatisticasCobranca(competencia?: string) {
  const comp = competencia || getCompetenciaAtual()

  const { data, error } = await supabase.from("log_cobranca_ponto").select("status_envio").eq("competencia", comp)

  if (error) {
    console.error("Erro ao buscar estatísticas:", error)
    return { total: 0, enviados: 0, erros: 0, aguardando: 0 }
  }

  const logs = data || []
  return {
    total: logs.length,
    enviados: logs.filter((l) => l.status_envio === "ENVIADO").length,
    erros: logs.filter((l) => l.status_envio === "ERRO").length,
    aguardando: logs.filter((l) => l.status_envio === "PENDENTE" || l.status_envio === "ENVIANDO").length,
  }
}
