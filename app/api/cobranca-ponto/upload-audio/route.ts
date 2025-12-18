import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo foi enviado" }, { status: 400 })
    }

    if (!file.type.startsWith("audio/")) {
      return NextResponse.json({ error: "O arquivo deve ser um áudio" }, { status: 400 })
    }

    // Limit to 25MB
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: "Arquivo muito grande (máximo 25MB)" }, { status: 400 })
    }

    // Create Supabase client
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceRoleKey) {
      console.error("SUPABASE_SERVICE_ROLE_KEY não está configurada no .env.local")
      return NextResponse.json({
        error: "Erro de configuração no servidor",
        details: { message: "Chave Service Role não encontrada. Verifique o arquivo .env.local" }
      }, { status: 500 })
    }

    // Create a plain Supabase client with Service Role (Admin)
    // We don't use the SSR version here to avoid cookie interference
    const { createClient: createBaseClient } = await import("@supabase/supabase-js")

    const supabase = createBaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log("[STORAGE] Iniciando upload com Service Role. Prefixo da chave:", serviceRoleKey.substring(0, 10))

    // Generate unique filename
    const timestamp = Date.now()
    const ext = file.name.split('.').pop() || 'mp3'
    const filename = `cobranca-audio/${timestamp}.${ext}`

    // Convert File to ArrayBuffer then to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("audios")
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (error) {
      console.error("Erro ao fazer upload para Supabase:", error)
      return NextResponse.json({
        error: "Erro ao fazer upload do arquivo para o storage",
        details: error
      }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("audios")
      .getPublicUrl(filename)

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: filename,
    })
  } catch (error) {
    console.error("Erro ao fazer upload do áudio:", error)
    return NextResponse.json({ error: "Erro ao fazer upload do arquivo" }, { status: 500 })
  }
}
