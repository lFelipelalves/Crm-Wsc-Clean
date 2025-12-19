"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import type { Empresa } from "@/lib/supabase/types"
import { EmpresaFormDialog } from "./empresa-form-dialog"
import { Pencil, Search, Eye, Trash2 } from "lucide-react"

import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { deleteEmpresa } from "@/lib/supabase/services/empresas"
import { useToast } from "@/hooks/use-toast"

interface EmpresaTableProps {
  empresas: Empresa[]
  onUpdate: () => void
}

export function EmpresaTable({ empresas, onUpdate }: EmpresaTableProps) {
  const [search, setSearch] = useState("")
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null)
  const [empresaToDelete, setEmpresaToDelete] = useState<Empresa | null>(null)
  const { toast } = useToast()

  const handleDelete = (empresa: Empresa) => {
    setEmpresaToDelete(empresa)
  }

  const confirmDelete = async () => {
    if (!empresaToDelete) return
    try {
      await deleteEmpresa(empresaToDelete.id)
      toast({ title: "Empresa excluída com sucesso" })
      onUpdate()
    } catch (error) {
      toast({ title: "Erro ao excluir empresa", variant: "destructive" })
    } finally {
      setEmpresaToDelete(null)
    }
  }

  const filteredEmpresas = empresas.filter((empresa) => {
    const searchLower = search.toLowerCase()
    return (
      empresa.razao_social?.toLowerCase().includes(searchLower) ||
      empresa.codigo?.toString().includes(searchLower) ||
      empresa.cnpj?.toLowerCase().includes(searchLower) ||
      empresa.responsavel?.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por empresa, código, CNPJ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[1000px]">
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[80px] font-semibold text-[#1e3a5f]">Código</TableHead>
                <TableHead className="min-w-[200px] font-semibold text-[#1e3a5f]">Razão Social</TableHead>
                <TableHead className="w-[160px] font-semibold text-[#1e3a5f]">CNPJ</TableHead>
                <TableHead className="w-[120px] font-semibold text-[#1e3a5f]">Telefone</TableHead>
                <TableHead className="w-[140px] font-semibold text-[#1e3a5f]">Responsável</TableHead>
                <TableHead className="w-[80px] text-center font-semibold text-[#1e3a5f]">Status</TableHead>
                <TableHead className="w-[140px] font-semibold text-[#1e3a5f]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmpresas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground h-24">
                    Nenhuma empresa encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmpresas.map((empresa) => (
                  <TableRow key={empresa.id}>
                    <TableCell className="font-mono">{empresa.codigo}</TableCell>
                    <TableCell className="font-medium">{empresa.razao_social}</TableCell>
                    <TableCell className="font-mono text-muted-foreground">{empresa.cnpj || "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{empresa.telefone || "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{empresa.responsavel || "-"}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={empresa.ativo ? "default" : "outline"}>{empresa.ativo ? "Ativa" : "Inativa"}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Link href={`/empresas/${empresa.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedEmpresa(empresa)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(empresa)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {selectedEmpresa && (
        <EmpresaFormDialog
          open={!!selectedEmpresa}
          onOpenChange={(open) => !open && setSelectedEmpresa(null)}
          empresa={selectedEmpresa}
          onSuccess={onUpdate}
        />
      )}

      <AlertDialog open={!!empresaToDelete} onOpenChange={(open: boolean) => !open && setEmpresaToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Empresa?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desativar a empresa <b>{empresaToDelete?.razao_social}</b>?
              Ela não poderá mais ser utilizada em novas cobranças.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
