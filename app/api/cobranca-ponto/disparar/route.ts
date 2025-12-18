import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/client"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { empresas_ids, mensagem, tipo_mensagem, arquivo_audio_url, data_cobranca } = body

    if (!empresas_ids || empresas_ids.length === 0) {
      return NextResponse.json({ error: "empresas_ids é obrigatório" }, { status: 400 })
    }

    const supabase = createClient()

    const { data: empresas, error: empresasError } = await supabase
      .from("empresas_cobranca_ponto")
      .select(`
        id,
        empresa_id,
        dia_cobranca,
        telefone_cobranca,
        status_ponto,
        observacoes,
        ultima_cobranca,
        ativo,
        empresas (
          id,
          codigo,
          razao_social,
          responsavel,
          telefone
        )
      `)
      .in("id", empresas_ids)

    if (empresasError || !empresas) {
      console.error("Erro ao buscar empresas:", empresasError)
      return NextResponse.json({ error: "Erro ao buscar empresas" }, { status: 500 })
    }

    // Criar logs para todas as empresas selecionadas
    const logsParaInserir = empresas.map((empresa: any) => ({
      empresa_cobranca_id: empresa.id,
      empresa_id: empresa.empresa_id,
      telefone_destino: empresa.telefone_cobranca || empresa.empresas?.telefone || "",
      mensagem: tipo_mensagem === "TEXTO" ? mensagem : null,
      tipo_mensagem,
      arquivo_url: tipo_mensagem === "AUDIO" ? arquivo_audio_url : null,
      status_envio: "PENDENTE",
      competencia: new Date().toISOString().slice(0, 7),
      data_cobranca: data_cobranca || null,
    }))

    const { data: logs, error: logsError } = await supabase.from("log_cobranca_ponto").insert(logsParaInserir).select()

    if (logsError) {
      console.error("Erro ao criar logs:", logsError)
      return NextResponse.json({ error: "Erro ao criar logs de cobrança" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      logs_criados: logs?.length || 0,
      message: data_cobranca
        ? "Cobranças agendadas com sucesso. O n8n processará os envios no horário configurado."
        : "Cobranças criadas com sucesso. O n8n processará os envios.",
    })
  } catch (error) {
    console.error("Erro na API de disparo:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
