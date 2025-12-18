import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Endpoint para n8n buscar cobranças pendentes
export async function GET() {
  try {
    const supabase = await createClient()

    // Chamar a function Postgres
    const { data, error } = await supabase.rpc("buscar_cobrancas_pendentes")

    if (error) {
      console.error("[v0] Erro ao buscar cobranças pendentes:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      total: data?.length || 0,
      cobrancas: data || [],
    })
  } catch (error) {
    console.error("[v0] Erro inesperado:", error)
    return NextResponse.json({ error: "Erro ao buscar cobranças" }, { status: 500 })
  }
}
