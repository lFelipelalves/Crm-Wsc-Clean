import { createClient } from "@/lib/supabase/client"
import type {
  Empresa,
  ListaCobranca,
  CobrancaPonto,
  StatusEnvio,
  StatusResposta,
  CobrancaPontoComEmpresa,
  TipoMensagem,
} from "@/lib/supabase/types"

// ============ EMPRESAS ============

export async function getEmpresas() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("empresas")
    .select("*")
    .eq("ativo", true)
    .order("codigo", { ascending: true })

  if (error) throw error
  return data as Empresa[]
}

export async function getEmpresasByDia(dia: number) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("empresas")
    .select("*")
    .eq("ativo", true)
    .eq("dia_cobranca", dia)
    .order("codigo", { ascending: true })

  if (error) throw error
  return data as Empresa[]
}

export async function createEmpresa(empresa: Omit<Empresa, "id" | "created_at" | "updated_at">) {
  const supabase = createClient()
  const { data, error } = await supabase.from("empresas").insert(empresa).select().single()

  if (error) throw error
  return data as Empresa
}

export async function updateEmpresa(id: string, updates: Partial<Empresa>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("empresas")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as Empresa
}

export async function deleteEmpresa(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from("empresas")
    .update({ ativo: false, updated_at: new Date().toISOString() })
    .eq("id", id)

  if (error) throw error
}

// ============ LISTAS DE COBRANÇA ============

export async function getListas() {
  const supabase = createClient()
  const { data, error } = await supabase.from("listas_cobranca").select("*").order("created_at", { ascending: false })

  if (error) throw error
  return data as ListaCobranca[]
}

export async function getListaAtiva() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("listas_cobranca")
    .select("*")
    .eq("status", "ATIVA")
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== "PGRST116") throw error
  return data as ListaCobranca | null
}

export async function createLista(
  nome: string,
  tipo: string,
  filtros: { dia01: boolean; dia25: boolean; pendentes: boolean },
  mensagemConfig?: { tipo: TipoMensagem; texto?: string; audioUrl?: string },
) {
  const supabase = createClient()

  let query = supabase.from("empresas").select("*").eq("ativo", true)

  if (filtros.dia01 && !filtros.dia25) {
    query = query.eq("dia_cobranca", 1)
  } else if (filtros.dia25 && !filtros.dia01) {
    query = query.eq("dia_cobranca", 25)
  } else if (filtros.dia01 && filtros.dia25) {
    query = query.in("dia_cobranca", [1, 25])
  }

  const { data: empresas, error: empresasError } = await query
  if (empresasError) throw empresasError

  const mesAtual = new Date().toISOString().slice(0, 7)
  const { data: lista, error: listaError } = await supabase
    .from("listas_cobranca")
    .insert({
      nome,
      tipo,
      competencia: mesAtual,
      filtro_dia_01: filtros.dia01,
      filtro_dia_25: filtros.dia25,
      filtro_pendentes: filtros.pendentes,
      status: "ATIVA",
      total_empresas: empresas?.length || 0,
      total_enviados: 0,
      mensagem_padrao: mensagemConfig?.texto,
      tipo_mensagem_padrao: mensagemConfig?.tipo,
      arquivo_audio_url: mensagemConfig?.audioUrl,
    })
    .select()
    .single()

  if (listaError) throw listaError

  if (empresas && empresas.length > 0) {
    const cobrancas = empresas.map((empresa) => ({
      lista_id: lista.id,
      empresa_id: empresa.id,
      status_envio: "AGUARDANDO" as StatusEnvio,
      status_resposta: "PENDENTE" as StatusResposta,
      tentativas: 0,
    }))

    const { error: cobrancasError } = await supabase.from("cobrancas_ponto").insert(cobrancas)

    if (cobrancasError) throw cobrancasError
  }

  return lista as ListaCobranca
}

export async function finalizarLista(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from("listas_cobranca")
    .update({ status: "FINALIZADA", updated_at: new Date().toISOString() })
    .eq("id", id)

  if (error) throw error
}

// ============ COBRANÇAS ============

export async function getCobrancasByLista(listaId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("cobrancas_ponto")
    .select(`
      *,
      empresa:empresas(*)
    `)
    .eq("lista_id", listaId)
    .order("created_at", { ascending: true })

  if (error) throw error
  return data as CobrancaPontoComEmpresa[]
}

export async function updateStatusEnvio(id: string, status: StatusEnvio, observacoes?: string) {
  const supabase = createClient()

  const updates: Partial<CobrancaPonto> = {
    status_envio: status,
    updated_at: new Date().toISOString(),
  }

  if (status === "ENVIADO") {
    updates.data_envio = new Date().toISOString()
  }

  if (observacoes !== undefined) {
    updates.observacoes = observacoes
  }

  const { data, error } = await supabase.from("cobrancas_ponto").update(updates).eq("id", id).select().single()

  if (error) throw error
  await atualizarContadorLista((data as CobrancaPonto).lista_id)

  return data as CobrancaPonto
}

export async function updateStatusResposta(id: string, status: StatusResposta) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("cobrancas_ponto")
    .update({
      status_resposta: status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as CobrancaPonto
}

export async function updateCobrancasEmMassa(
  ids: string[],
  statusEnvio: StatusEnvio,
  mensagem?: string,
  tipoMensagem?: TipoMensagem,
) {
  const supabase = createClient()

  const updates: Partial<CobrancaPonto> = {
    status_envio: statusEnvio,
    updated_at: new Date().toISOString(),
  }

  if (statusEnvio === "ENVIADO") {
    updates.data_envio = new Date().toISOString()
    updates.mensagem_enviada = mensagem
    updates.tipo_mensagem = tipoMensagem
  }

  const { data, error } = await supabase.from("cobrancas_ponto").update(updates).in("id", ids).select()

  if (error) throw error

  if (data && data.length > 0) {
    await atualizarContadorLista((data[0] as CobrancaPonto).lista_id)
  }

  return data as CobrancaPonto[]
}

export async function updateCobrancaDisparo(
  id: string,
  statusEnvio: StatusEnvio,
  mensagem?: string,
  tipoMensagem?: TipoMensagem,
) {
  const supabase = createClient()

  const updates: Partial<CobrancaPonto> = {
    status_envio: statusEnvio,
    tentativas: 1,
    updated_at: new Date().toISOString(),
  }

  if (statusEnvio === "ENVIADO") {
    updates.data_envio = new Date().toISOString()
    updates.mensagem_enviada = mensagem
    updates.tipo_mensagem = tipoMensagem
  }

  const { data, error } = await supabase.from("cobrancas_ponto").update(updates).eq("id", id).select().single()

  if (error) throw error
  return data as CobrancaPonto
}

async function atualizarContadorLista(listaId: string) {
  const supabase = createClient()

  const { count, error } = await supabase
    .from("cobrancas_ponto")
    .select("*", { count: "exact", head: true })
    .eq("lista_id", listaId)
    .eq("status_envio", "ENVIADO")

  if (error) throw error

  await supabase
    .from("listas_cobranca")
    .update({ total_enviados: count || 0, updated_at: new Date().toISOString() })
    .eq("id", listaId)
}

// ============ RESET MENSAL ============

export async function resetarCobrancasMensal() {
  const supabase = createClient()

  const hoje = new Date()
  if (hoje.getDate() < 8) {
    throw new Error("O reset só pode ser feito após o dia 8 do mês")
  }

  await supabase
    .from("listas_cobranca")
    .update({ status: "FINALIZADA", updated_at: new Date().toISOString() })
    .eq("status", "ATIVA")

  return true
}

export async function verificarResetAutomatico() {
  const hoje = new Date()
  const diaDoMes = hoje.getDate()

  if (diaDoMes >= 8) {
    const mesAtual = hoje.toISOString().slice(0, 7)
    const supabase = createClient()

    const { data: listaExistente } = await supabase
      .from("listas_cobranca")
      .select("id")
      .eq("competencia", mesAtual)
      .eq("status", "ATIVA")
      .limit(1)
      .single()

    if (!listaExistente) {
      await resetarCobrancasMensal()
      return true
    }
  }

  return false
}

// ============ RESET COMPLETO ============

export async function resetarTodosStatus() {
  const supabase = createClient()

  // 1. Finaliza todas as listas ativas
  const { error: listaError } = await supabase
    .from("listas_cobranca")
    .update({ status: "FINALIZADA", updated_at: new Date().toISOString() })
    .eq("status", "ATIVA")

  if (listaError) throw listaError

  // 2. Deleta todas as cobranças (para recomeçar do zero)
  const { error: cobrancasError } = await supabase
    .from("cobrancas_ponto")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000") // Deleta tudo

  if (cobrancasError) throw cobrancasError

  return true
}

export async function getOrCreateCobrancaParaEmpresa(empresaId: string) {
  const supabase = createClient()

  // Verifica se existe lista ativa
  const { data: listaAtiva } = await supabase
    .from("listas_cobranca")
    .select("id")
    .eq("status", "ATIVA")
    .limit(1)
    .single()

  // Se não tem lista ativa, cria uma lista temporária
  let listaId = listaAtiva?.id

  if (!listaId) {
    const mesAtual = new Date().toISOString().slice(0, 7)
    const { data: novaLista, error: listaError } = await supabase
      .from("listas_cobranca")
      .insert({
        nome: `Lista ${mesAtual}`,
        tipo: "COBRANCA_PONTO_FISCAL",
        competencia: mesAtual,
        status: "ATIVA",
        filtro_dia_01: true,
        filtro_dia_25: true,
        filtro_pendentes: false,
        total_empresas: 0,
        total_enviados: 0,
      })
      .select()
      .single()

    if (listaError) throw listaError
    listaId = novaLista.id
  }

  // Verifica se já existe cobrança para essa empresa nessa lista
  const { data: cobrancaExistente } = await supabase
    .from("cobrancas_ponto")
    .select("*")
    .eq("lista_id", listaId)
    .eq("empresa_id", empresaId)
    .limit(1)
    .single()

  if (cobrancaExistente) {
    return cobrancaExistente as CobrancaPonto
  }

  // Se não existe, cria nova cobrança
  const { data: novaCobranca, error: cobrancaError } = await supabase
    .from("cobrancas_ponto")
    .insert({
      lista_id: listaId,
      empresa_id: empresaId,
      status_envio: "AGUARDANDO",
      status_resposta: "PENDENTE",
      tentativas: 0,
    })
    .select()
    .single()

  if (cobrancaError) throw cobrancaError
  return novaCobranca as CobrancaPonto
}

export async function updateStatusEmpresa(
  empresaId: string,
  statusEnvio?: StatusEnvio,
  statusResposta?: StatusResposta,
) {
  const supabase = createClient()

  // Primeiro garante que existe uma cobrança para essa empresa
  const cobranca = await getOrCreateCobrancaParaEmpresa(empresaId)

  const updates: Partial<CobrancaPonto> = {
    updated_at: new Date().toISOString(),
  }

  if (statusEnvio !== undefined) {
    updates.status_envio = statusEnvio
    if (statusEnvio === "ENVIADO") {
      updates.data_envio = new Date().toISOString()
    }
  }

  if (statusResposta !== undefined) {
    updates.status_resposta = statusResposta
  }

  const { data, error } = await supabase.from("cobrancas_ponto").update(updates).eq("id", cobranca.id).select().single()

  if (error) throw error
  return data as CobrancaPonto
}

export async function getStatusTodasEmpresas() {
  const supabase = createClient()

  // Busca a lista ativa
  const { data: listaAtiva } = await supabase
    .from("listas_cobranca")
    .select("id")
    .eq("status", "ATIVA")
    .limit(1)
    .single()

  if (!listaAtiva) {
    return {} as Record<string, { envio: StatusEnvio; resposta: StatusResposta; cobranca_id: string }>
  }

  // Busca todas as cobranças da lista ativa
  const { data: cobrancas, error } = await supabase
    .from("cobrancas_ponto")
    .select("empresa_id, status_envio, status_resposta, id")
    .eq("lista_id", listaAtiva.id)

  if (error) throw error

  const statusMap: Record<string, { envio: StatusEnvio; resposta: StatusResposta; cobranca_id: string }> = {}

  cobrancas?.forEach((c) => {
    statusMap[c.empresa_id] = {
      envio: c.status_envio as StatusEnvio,
      resposta: c.status_resposta as StatusResposta,
      cobranca_id: c.id,
    }
  })

  return statusMap
}
