'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Building2, ChevronDown, FileText, DollarSign, Receipt, FileCheck, Users, LogOut, UserCog } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useUserRole } from '@/hooks/use-user-role'

const mainNav = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Empresas', href: '/empresas', icon: Building2 },
]

const atividadesNav = [
  { name: 'Cobrança de Ponto Fiscal', href: '/atividades/cobranca-ponto-fiscal', icon: DollarSign },
  { name: 'Cobrança de Documento Fiscal', href: '/em-desenvolvimento', icon: Receipt },
  { name: 'Envio de Guias Fiscal', href: '/em-desenvolvimento', icon: FileCheck },
  { name: 'Envio de Documentos Contábil', href: '/em-desenvolvimento', icon: FileText },
  { name: 'Envio de Guias Contábil', href: '/em-desenvolvimento', icon: FileCheck },
  { name: 'Cobrança de Recibo Aluguel', href: '/em-desenvolvimento', icon: DollarSign },
  { name: 'Cobrança de Faturamento', href: '/em-desenvolvimento', icon: DollarSign },
]

const gestaoNav = [
  { name: 'Onboarding', href: '/onboarding', icon: Users },
  { name: 'Usuários', href: '/gestao/usuarios', icon: UserCog },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [atividadesOpen, setAtividadesOpen] = useState(true)
  const [gestaoOpen, setGestaoOpen] = useState(true)
  const { role, loading } = useUserRole()

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const handleLogout = () => {
    document.cookie = 'auth-token=; path=/; max-age=0'
    router.push('/login')
  }

  // Se estiver carregando, mostra skeleton ou nada (opcional)
  // Mas para UX é melhor renderizar o básico e depois atualizar

  return (
    <div className="flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground overflow-y-auto">
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <h1 className="text-lg font-semibold text-balance">WSC Contabilidade</h1>
      </div>

      <nav className="flex-1 space-y-2 px-3 py-4">
        {/* Main Navigation */}
        {mainNav.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive(item.href)
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50'
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </Link>
        ))}

        {/* Atividades Section */}
        <div className="pt-4">
          <button
            onClick={() => setAtividadesOpen(!atividadesOpen)}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 transition-colors"
          >
            <span>Atividades</span>
            <ChevronDown
              className={cn(
                'h-4 w-4 transition-transform',
                atividadesOpen && 'rotate-180'
              )}
            />
          </button>
          {atividadesOpen && (
            <div className="space-y-1 pl-2">
              {atividadesNav
                .filter(item => {
                  // Admin sees everything
                  if (role === 'admin') return true
                  // User (DP) only sees 'Cobrança de Ponto Fiscal'
                  if (role === 'user') return item.href === '/atividades/cobranca-ponto-fiscal'
                  return false
                })
                .map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                      isActive(item.href)
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/30'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                ))}
            </div>
          )}
        </div>

        {/* Gestão Section - Only for Admins */}
        {!loading && role === 'admin' && (
          <div className="pt-4">
            <button
              onClick={() => setGestaoOpen(!gestaoOpen)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 transition-colors"
            >
              <span>Gestão</span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform',
                  gestaoOpen && 'rotate-180'
                )}
              />
            </button>
            {gestaoOpen && (
              <div className="space-y-1 pl-2">
                {gestaoNav.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                      isActive(item.href)
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/30'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      <div className="border-t border-sidebar-border p-4 space-y-3">
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-destructive hover:text-destructive-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
        <p className="text-xs text-sidebar-foreground/50">Controle WSC v2.0</p>
      </div>
    </div>
  )
}
