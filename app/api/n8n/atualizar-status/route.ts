import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Endpoint para n8n atualizar status após envio
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { log_id, status_envio, webhook_response, erro_mensagem } = body

    if (!log_id || !status_envio) {
      return NextResponse.json({ error: "log_id e status_envio são obrigatórios" }, { status: 400 })
    }

    const supabase = await createClient()

    // Atualizar log de cobrança
    const { error } = await supabase
      .from("log_cobranca_ponto")
      .update({
        status_envio,
        webhook_response,
        erro_mensagem,
        enviado_em: status_envio === "ENVIADO" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", log_id)

    if (error) {
      console.error("[v0] Erro ao atualizar status:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Status atualizado com sucesso",
    })
  } catch (error) {
    console.error("[v0] Erro inesperado:", error)
    return NextResponse.json({ error: "Erro ao atualizar status" }, { status: 500 })
  }
}
