import { put } from "@vercel/blob"
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

    // Upload to Vercel Blob
    const timestamp = Date.now()
    const filename = `cobranca-audio/${timestamp}-${file.name}`

    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: false,
    })

    return NextResponse.json({
      success: true,
      url: blob.url,
      filename: blob.pathname,
    })
  } catch (error) {
    console.error("Erro ao fazer upload do áudio:", error)
    return NextResponse.json({ error: "Erro ao fazer upload do arquivo" }, { status: 500 })
  }
}
