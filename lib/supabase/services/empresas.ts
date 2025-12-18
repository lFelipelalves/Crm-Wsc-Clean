import { createBrowserClient } from "@/lib/supabase/client"
import type { Empresa } from "@/lib/supabase/types"

export async function getEmpresas() {
  const supabase = createBrowserClient()

  const { data, error } = await supabase.from("empresas").select("*").order("codigo", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching empresas:", error)
    throw error
  }

  return data as Empresa[]
}

export async function getEmpresaById(id: string) {
  const supabase = createBrowserClient()

  const { data, error } = await supabase.from("empresas").select("*").eq("id", id).single()

  if (error) {
    console.error("[v0] Error fetching empresa:", error)
    throw error
  }

  return data as Empresa
}

export async function createEmpresa(empresa: Omit<Empresa, "id" | "created_at" | "updated_at">) {
  const supabase = createBrowserClient()

  const { data, error } = await supabase.from("empresas").insert([empresa]).select().single()

  if (error) {
    console.error("[v0] Error creating empresa:", error)
    throw error
  }

  return data as Empresa
}

export async function updateEmpresa(id: string, updates: Partial<Empresa>) {
  const supabase = createBrowserClient()

  const { data, error } = await supabase.from("empresas").update(updates).eq("id", id).select().single()

  if (error) {
    console.error("[v0] Error updating empresa:", error)
    throw error
  }

  return data as Empresa
}

export async function deleteEmpresa(id: string) {
  const supabase = createBrowserClient()

  const { error } = await supabase.from("empresas").update({ ativo: false }).eq("id", id)

  if (error) {
    console.error("[v0] Error deleting empresa:", error)
    throw error
  }

  return true
}
