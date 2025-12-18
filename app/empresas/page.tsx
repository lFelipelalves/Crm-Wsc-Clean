"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { EmpresaTable } from "@/components/empresas/empresa-table"
import { EmpresaFormDialog } from "@/components/empresas/empresa-form-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getEmpresas } from "@/lib/supabase/services/empresas"
import type { Empresa } from "@/lib/supabase/types"
import { Plus } from "lucide-react"

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNewDialog, setShowNewDialog] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await getEmpresas()
      setEmpresas(data)
    } catch (error) {
      console.error("[v0] Failed to load empresas:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const ativas = empresas.filter((e) => e.ativo).length
  const inativas = empresas.filter((e) => !e.ativo).length

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Empresas</h1>
            <p className="text-muted-foreground">Gerencie o cadastro de empresas clientes</p>
          </div>
          <Button onClick={() => setShowNewDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Empresa
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{empresas.length}</div>
              <p className="text-xs text-muted-foreground">Total de empresas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-success">{ativas}</div>
              <p className="text-xs text-muted-foreground">Empresas ativas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-muted-foreground">{inativas}</div>
              <p className="text-xs text-muted-foreground">Empresas inativas</p>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">Carregando dados...</CardContent>
          </Card>
        ) : (
          <EmpresaTable empresas={empresas} onUpdate={loadData} />
        )}

        <EmpresaFormDialog open={showNewDialog} onOpenChange={setShowNewDialog} onSuccess={loadData} />
      </div>
    </AppLayout>
  )
}
