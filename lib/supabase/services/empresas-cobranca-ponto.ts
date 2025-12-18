import { createClient } from "@/lib/supabase/client"
import type { Empresa, EmpresaCobrancaPonto, EmpresaCobrancaPontoView, StatusPonto } from "@/lib/supabase/types"

const supabase = createClient()

// Buscar todas as empresas da cobrança de ponto (com dados da empresa)
export async function getEmpresasCobrancaPonto(): Promise<EmpresaCobrancaPontoView[]> {
  const { data, error } = await supabase
    .from("empresas_cobranca_ponto")
    .select(`
      id,
      empresa_id,
      dia_cobranca,
      telefone_cobranca,
      status_ponto,
      observacoes,
      ultima_cobranca,
      empresa:empresas (
        codigo,
        razao_social,
        responsavel,
        telefone
      )
    `)
    .eq("ativo", true)
    .order("dia_cobranca", { ascending: true })

  if (error) {
    console.error("Erro ao buscar empresas cobrança ponto:", error)
    return []
  }

  // Transformar para o formato da view
  return (data || []).map((item: any) => ({
    id: item.id,
    empresa_id: item.empresa_id,
    codigo: item.empresa?.codigo || "",
    razao_social: item.empresa?.razao_social || "",
    responsavel: item.empresa?.responsavel || "",
    telefone: item.empresa?.telefone || "",
    telefone_cobranca: item.telefone_cobranca || "",
    dia_cobranca: item.dia_cobranca,
    status_ponto: item.status_ponto,
    observacoes: item.observacoes,
    ultima_cobranca: item.ultima_cobranca,
  }))
}

// Buscar empresas filtradas por dia
export async function getEmpresasCobrancaPontoPorDia(dia: number): Promise<EmpresaCobrancaPontoView[]> {
  const { data, error } = await supabase
    .from("empresas_cobranca_ponto")
    .select(`
      id,
      empresa_id,
      dia_cobranca,
      telefone_cobranca,
      status_ponto,
      observacoes,
      ultima_cobranca,
      empresa:empresas (
        codigo,
        razao_social,
        responsavel,
        telefone
      )
    `)
    .eq("ativo", true)
    .eq("dia_cobranca", dia)
    .order("empresa_id", { ascending: true })

  if (error) {
    console.error("Erro ao buscar empresas por dia:", error)
    return []
  }

  return (data || []).map((item: any) => ({
    id: item.id,
    empresa_id: item.empresa_id,
    codigo: item.empresa?.codigo || "",
    razao_social: item.empresa?.razao_social || "",
    responsavel: item.empresa?.responsavel || "",
    telefone: item.empresa?.telefone || "",
    telefone_cobranca: item.telefone_cobranca || "",
    dia_cobranca: item.dia_cobranca,
    status_ponto: item.status_ponto,
    observacoes: item.observacoes,
    ultima_cobranca: item.ultima_cobranca,
  }))
}

// Buscar todas as empresas gerais (para adicionar na cobrança)
export async function getEmpresasGerais(): Promise<Empresa[]> {
  const { data, error } = await supabase
    .from("empresas")
    .select("*")
    .eq("ativo", true)
    .order("razao_social", { ascending: true })

  if (error) {
    console.error("Erro ao buscar empresas gerais:", error)
    return []
  }

  return data || []
}

// Buscar empresas que ainda não estão na cobrança de ponto
export async function getEmpresasDisponiveis(): Promise<Empresa[]> {
  // Primeiro busca as que já estão na cobrança
  const { data: jaAdicionadas } = await supabase.from("empresas_cobranca_ponto").select("empresa_id").eq("ativo", true)

  const idsJaAdicionados = (jaAdicionadas || []).map((e) => e.empresa_id)

  // Busca todas as empresas exceto as já adicionadas
  let query = supabase.from("empresas").select("*").eq("ativo", true).order("razao_social", { ascending: true })

  if (idsJaAdicionados.length > 0) {
    query = query.not("id", "in", `(${idsJaAdicionados.join(",")})`)
  }

  const { data, error } = await query

  if (error) {
    console.error("Erro ao buscar empresas disponíveis:", error)
    return []
  }

  return data || []
}

// Adicionar empresa na cobrança de ponto
export async function adicionarEmpresaCobrancaPonto(
  empresaId: string,
  diaCobranca: number,
  telefoneCobranca?: string,
): Promise<EmpresaCobrancaPonto | null> {
  const insertData: any = {
    empresa_id: empresaId,
    dia_cobranca: diaCobranca,
    status_ponto: "PENDENTE",
    ativo: true,
  }

  if (telefoneCobranca) {
    insertData.telefone_cobranca = telefoneCobranca
  }

  const { data, error } = await supabase.from("empresas_cobranca_ponto").insert(insertData).select().single()

  if (error) {
    console.error("Erro ao adicionar empresa:", error)
    return null
  }

  return data
}

// Remover empresa da cobrança de ponto
export async function removerEmpresaCobrancaPonto(id: string): Promise<boolean> {
  const { error } = await supabase.from("empresas_cobranca_ponto").update({ ativo: false }).eq("id", id)

  if (error) {
    console.error("Erro ao remover empresa:", error)
    return false
  }

  return true
}

// Atualizar status do ponto
export async function atualizarStatusPonto(id: string, status: StatusPonto): Promise<boolean> {
  console.log("[v0] Atualizando status_ponto:", { id, status })

  const { data, error } = await supabase
    .from("empresas_cobranca_ponto")
    .update({ status_ponto: status })
    .eq("id", id)
    .select()

  if (error) {
    console.error("[v0] Erro ao atualizar status ponto:", error)
    return false
  }

  console.log("[v0] Status atualizado com sucesso:", data)
  return true
}

// Atualizar observações
export async function atualizarObservacoes(id: string, observacoes: string): Promise<boolean> {
  const { error } = await supabase.from("empresas_cobranca_ponto").update({ observacoes }).eq("id", id)

  if (error) {
    console.error("Erro ao atualizar observações:", error)
    return false
  }

  return true
}

export async function atualizarTelefoneCobranca(id: string, telefone: string): Promise<boolean> {
  const { error } = await supabase.from("empresas_cobranca_ponto").update({ telefone_cobranca: telefone }).eq("id", id)

  if (error) {
    console.error("Erro ao atualizar telefone:", error)
    return false
  }

  return true
}

// RESET - Voltar todos os status para PENDENTE
export async function resetarTodosStatus(): Promise<boolean> {
  const { error } = await supabase
    .from("empresas_cobranca_ponto")
    .update({
      status_ponto: "PENDENTE",
      ultima_cobranca: null,
    })
    .eq("ativo", true)

  if (error) {
    console.error("Erro ao resetar status:", error)
    return false
  }

  return true
}

// Estatísticas
export async function getEstatisticas() {
  const { data, error } = await supabase.from("empresas_cobranca_ponto").select("status_ponto").eq("ativo", true)

  if (error) {
    console.error("Erro ao buscar estatísticas:", error)
    return {
      total: 0,
      pendente: 0,
      recebido: 0,
      naoRecebido: 0,
    }
  }

  const items = data || []
  return {
    total: items.length,
    pendente: items.filter((e) => e.status_ponto === "PENDENTE").length,
    recebido: items.filter((e) => e.status_ponto === "RECEBIDO").length,
    naoRecebido: items.filter((e) => e.status_ponto === "NAO_RECEBIDO").length,
  }
}
