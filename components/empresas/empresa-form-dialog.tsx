"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import type { Empresa } from "@/lib/supabase/types"
import { createEmpresa, updateEmpresa } from "@/lib/supabase/services/empresas"

interface EmpresaFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  empresa?: Empresa
  onSuccess: () => void
}

export function EmpresaFormDialog({ open, onOpenChange, empresa, onSuccess }: EmpresaFormDialogProps) {
  const isEdit = !!empresa
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    codigo: empresa?.codigo?.toString() || "",
    razao_social: empresa?.razao_social || "",
    cnpj: empresa?.cnpj || "",
    telefone: empresa?.telefone || "",
    responsavel: empresa?.responsavel || "",
    ativo: empresa?.ativo ?? true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const empresaData = {
        codigo: Number.parseInt(formData.codigo),
        razao_social: formData.razao_social,
        cnpj: formData.cnpj || null,
        telefone: formData.telefone,
        responsavel: formData.responsavel,
        ativo: formData.ativo,
      }

      if (isEdit && empresa?.id) {
        await updateEmpresa(empresa.id, empresaData)
      } else {
        await createEmpresa(empresaData)
      }

      onSuccess()
      onOpenChange(false)

      if (!isEdit) {
        setFormData({
          codigo: "",
          razao_social: "",
          cnpj: "",
          telefone: "",
          responsavel: "",
          ativo: true,
        })
      }
    } catch (error) {
      console.error("[v0] Failed to save empresa:", error)
      alert("Erro ao salvar empresa. Verifique se o código não está duplicado.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Empresa" : "Nova Empresa"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Atualize os dados da empresa" : "Cadastre uma nova empresa no sistema"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="codigo">Código da Empresa *</Label>
                <Input
                  id="codigo"
                  type="number"
                  required
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  placeholder="1001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  placeholder="00.000.000/0000-00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="razao">Razão Social *</Label>
              <Input
                id="razao"
                required
                value={formData.razao_social}
                onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
                placeholder="Nome da empresa"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone Principal *</Label>
                <Input
                  id="telefone"
                  required
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(11) 98765-4321"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsavel">Responsável Principal *</Label>
                <Input
                  id="responsavel"
                  required
                  value={formData.responsavel}
                  onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                  placeholder="Nome do responsável"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
              />
              <Label htmlFor="ativo">Empresa ativa</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : isEdit ? "Atualizar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
