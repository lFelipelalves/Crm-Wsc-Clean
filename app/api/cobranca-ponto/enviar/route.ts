import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/client"

const WEBHOOK_URL = "https://n8n.srv793536.hstgr.cloud/webhook/cobrancaponto"
const WEBHOOK_TIMEOUT = 30000 // 30 segundos

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { log_id, empresa_codigo, empresa_nome, responsavel, telefone, mensagem, tipo_mensagem, arquivo_audio_url } =
      body

    if (!log_id || !telefone) {
      return NextResponse.json({ error: "log_id e telefone são obrigatórios" }, { status: 400 })
    }

    const supabase = createClient()

    // 1. Atualizar status para ENVIANDO
    await supabase
      .from("log_cobranca_ponto")
      .update({
        status_envio: "ENVIANDO",
        enviado_em: new Date().toISOString(),
      })
      .eq("id", log_id)

    // 2. Preparar payload para o webhook
    const webhookPayload = {
      log_id,
      empresa_codigo,
      empresa_nome,
      responsavel,
      telefone,
      mensagem: tipo_mensagem === "TEXTO" ? mensagem : undefined,
      tipo_mensagem,
      arquivo_audio_url: tipo_mensagem === "AUDIO" ? arquivo_audio_url : undefined,
      timestamp: new Date().toISOString(),
    }

    // 3. Se não tem WEBHOOK_URL, simular sucesso (desenvolvimento)
    if (!WEBHOOK_URL) {
      // Simular delay de envio
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Atualizar como sucesso
      await supabase
        .from("log_cobranca_ponto")
        .update({
          status_envio: "ENVIADO",
          webhook_response: { simulated: true, success: true },
        })
        .eq("id", log_id)

      // Atualizar status_envio da empresa_cobranca_ponto
      const { data: logData } = await supabase
        .from("log_cobranca_ponto")
        .select("empresa_cobranca_id")
        .eq("id", log_id)
        .single()

      if (logData?.empresa_cobranca_id) {
        await supabase
          .from("empresas_cobranca_ponto")
          .update({
            status_envio: "ENVIADO",
            ultima_cobranca: new Date().toISOString(),
          })
          .eq("id", logData.empresa_cobranca_id)
      }

      return NextResponse.json({
        success: true,
        simulated: true,
        message: "Webhook simulado (WEBHOOK_URL não configurado)",
      })
    }

    // 4. Enviar para webhook real
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT)

    try {
      const webhookResponse = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(webhookPayload),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const responseData = await webhookResponse.json().catch(() => ({}))

      if (webhookResponse.ok) {
        // Sucesso
        await supabase
          .from("log_cobranca_ponto")
          .update({
            status_envio: "ENVIADO",
            webhook_response: responseData,
          })
          .eq("id", log_id)

        // Atualizar empresa_cobranca_ponto
        const { data: logData } = await supabase
          .from("log_cobranca_ponto")
          .select("empresa_cobranca_id")
          .eq("id", log_id)
          .single()

        if (logData?.empresa_cobranca_id) {
          await supabase
            .from("empresas_cobranca_ponto")
            .update({
              status_envio: "ENVIADO",
              ultima_cobranca: new Date().toISOString(),
            })
            .eq("id", logData.empresa_cobranca_id)
        }

        return NextResponse.json({ success: true, data: responseData })
      } else {
        // Erro do webhook
        await supabase
          .from("log_cobranca_ponto")
          .update({
            status_envio: "ERRO",
            webhook_response: responseData,
            erro_mensagem: `HTTP ${webhookResponse.status}`,
          })
          .eq("id", log_id)

        // Atualizar empresa_cobranca_ponto com erro
        const { data: logData } = await supabase
          .from("log_cobranca_ponto")
          .select("empresa_cobranca_id")
          .eq("id", log_id)
          .single()

        if (logData?.empresa_cobranca_id) {
          await supabase
            .from("empresas_cobranca_ponto")
            .update({ status_envio: "ERRO" })
            .eq("id", logData.empresa_cobranca_id)
        }

        return NextResponse.json({ success: false, error: `HTTP ${webhookResponse.status}` }, { status: 500 })
      }
    } catch (fetchError) {
      clearTimeout(timeoutId)

      const errorMessage = fetchError instanceof Error ? fetchError.message : "Erro desconhecido"

      // Atualizar como erro
      await supabase
        .from("log_cobranca_ponto")
        .update({
          status_envio: "ERRO",
          erro_mensagem: errorMessage,
        })
        .eq("id", log_id)

      // Atualizar empresa_cobranca_ponto com erro
      const { data: logData } = await supabase
        .from("log_cobranca_ponto")
        .select("empresa_cobranca_id")
        .eq("id", log_id)
        .single()

      if (logData?.empresa_cobranca_id) {
        await supabase
          .from("empresas_cobranca_ponto")
          .update({ status_envio: "ERRO" })
          .eq("id", logData.empresa_cobranca_id)
      }

      return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
    }
  } catch (error) {
    console.error("Erro na API de cobrança:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
