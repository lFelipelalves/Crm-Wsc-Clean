"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export type UserRole = "admin" | "user" | null

export function useUserRole() {
  const [role, setRole] = useState<UserRole>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRole() {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setRole(null)
          return
        }

        const { data: usuario } = await supabase
          .from("usuarios")
          .select("role")
          .eq("auth_id", user.id)
          .single()

        setRole((usuario?.role as UserRole) || "user")
      } catch (error) {
        console.error("Error fetching user role:", error)
        setRole("user") // Default to user on error for safety
      } finally {
        setLoading(false)
      }
    }

    fetchRole()
  }, [])

  return { role, loading, isAdmin: role === "admin" }
}
