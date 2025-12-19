'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Building2, ChevronDown, FileText, DollarSign, Receipt, FileCheck, Users, LogOut, UserCog, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useUserRole } from '@/hooks/use-user-role'

const mainNav = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Empresas', href: '/empresas', icon: Building2 },
  { name: 'Contatos', href: '/contatos', icon: Users },
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

  return (
    <div className="flex h-screen w-64 flex-col bg-[#1e3a5f] text-white overflow-y-auto border-r border-[#1e3a5f]">
      {/* Logo Area */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-white/10">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-white text-[#1e3a5f]">
          <Zap className="h-4 w-4" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white tracking-tight">WSC System</h1>
          <p className="text-[10px] text-blue-200 font-medium">Enterprise Edition</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-6">
        {/* Main Navigation */}
        <div className="space-y-1">
          {mainNav.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200',
                isActive(item.href)
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-blue-100 hover:bg-white/5 hover:text-white'
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 transition-colors",
                isActive(item.href) ? "text-blue-300" : "text-blue-300/70 group-hover:text-blue-300"
              )} />
              {item.name}
            </Link>
          ))}
        </div>

        {/* Atividades Section */}
        <div className="pt-6">
          <div className="px-3 mb-2">
            <h3 className="text-xs font-semibold text-blue-300/50 uppercase tracking-wider">
              Atividades
            </h3>
          </div>
          <div className="space-y-0.5">
            {atividadesNav
              .filter(item => {
                if (role === 'admin') return true
                if (role === 'user') return item.href === '/atividades/cobranca-ponto-fiscal'
                return false
              })
              .map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200',
                    isActive(item.href)
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'text-blue-100 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <item.icon className={cn(
                    "h-4 w-4 transition-colors",
                    isActive(item.href) ? "text-blue-300" : "text-blue-300/70 group-hover:text-blue-300"
                  )} />
                  <span className="truncate">{item.name}</span>
                </Link>
              ))}
          </div>
        </div>

        {/* Gestão Section - Only for Admins */}
        {!loading && role === 'admin' && (
          <div className="pt-6">
            <div className="px-3 mb-2">
              <h3 className="text-xs font-semibold text-blue-300/50 uppercase tracking-wider">
                Gestão
              </h3>
            </div>
            <div className="space-y-0.5">
              {gestaoNav.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200',
                    isActive(item.href)
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'text-blue-100 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <item.icon className={cn(
                    "h-4 w-4 transition-colors",
                    isActive(item.href) ? "text-blue-300" : "text-blue-300/70 group-hover:text-blue-300"
                  )} />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-4">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-2 text-blue-200 hover:text-white hover:bg-white/10"
        >
          <LogOut className="h-4 w-4" />
          Sair do Sistema
        </Button>
      </div>
    </div>
  )
}
