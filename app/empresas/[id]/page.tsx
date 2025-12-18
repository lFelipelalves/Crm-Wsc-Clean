import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { Building2, Phone, User, Mail, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function EmpresaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: empresa } = await supabase
    .from("empresas")
    .select("*")
    .eq("id", id)
    .single()

  if (!empresa) {
    notFound()
  }

  const contatos: any[] = [] // Não há tabela de contatos ainda no Supabase

  const getTipoContatoLabel = (tipo: string) => {
    switch (tipo) {
      case 'DP':
        return 'Departamento Pessoal'
      case 'FINANCEIRO':
        return 'Financeiro'
      case 'SOCIETARIO':
        return 'Societário'
      default:
        return tipo
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/empresas">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Detalhes da Empresa</h1>
            <p className="text-muted-foreground">{empresa.razao_social}</p>
          </div>
          <Badge variant={empresa.ativo ? 'default' : 'outline'}>
            {empresa.ativo ? 'Ativa' : 'Inativa'}
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Informações da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Código</p>
              <p className="font-mono text-lg font-medium">{empresa.codigo}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">CNPJ</p>
              <p className="font-mono text-lg font-medium">{empresa.cnpj || 'Não informado'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Razão Social</p>
              <p className="text-lg font-medium">{empresa.razao_social}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Telefone Principal</p>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <p className="text-lg font-medium">{empresa.telefone || 'Não informado'}</p>
              </div>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground">Responsável Principal</p>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <p className="text-lg font-medium">{empresa.responsavel || 'Não informado'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contatos</CardTitle>
            <CardDescription>
              Lista de contatos cadastrados para esta empresa
            </CardDescription>
          </CardHeader>
          <CardContent>
            {contatos.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum contato cadastrado
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {contatos.map((contato) => (
                  <Card key={contato.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{contato.nome}</CardTitle>
                        <Badge variant="outline" className="ml-2">
                          {getTipoContatoLabel(contato.tipoContato)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{contato.telefone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{contato.email}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
