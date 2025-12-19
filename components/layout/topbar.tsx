'use client'

import { useUserRole } from '@/hooks/use-user-role'
import { Bell, User } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export function Topbar() {
    const { role, loading } = useUserRole()

    return (
        <header className="h-14 border-b border-slate-200 bg-white/80 backdrop-blur-sm flex items-center justify-between px-6">
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                    Bem-vindo ao sistema
                </span>
            </div>

            <div className="flex items-center gap-4">
                {/* Notifications */}
                <Popover>
                    <PopoverTrigger asChild>
                        <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors outline-none">
                            <Bell className="h-5 w-5 text-slate-500" />
                            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#1e3a5f]" />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0 mr-4" align="end">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="font-semibold text-sm text-slate-900">Notificações</h3>
                            <span className="text-xs text-slate-500">3 novas</span>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                            {[
                                { title: "Novo cliente cadastrado", time: "Há 5 min", unread: true },
                                { title: "Relatório mensal disponível", time: "Há 2 horas", unread: true },
                                { title: "Atualização do sistema", time: "Há 1 dia", unread: false },
                            ].map((notif, i) => (
                                <div key={i} className={cn(
                                    "px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-100 last:border-0",
                                    notif.unread && "bg-blue-50/50"
                                )}>
                                    <div className="flex justify-between items-start mb-1">
                                        <p className={cn("text-xs font-medium", notif.unread ? "text-[#1e3a5f]" : "text-slate-700")}>
                                            {notif.title}
                                        </p>
                                        {notif.unread && <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5" />}
                                    </div>
                                    <p className="text-[10px] text-slate-400">{notif.time}</p>
                                </div>
                            ))}
                        </div>
                        <div className="p-2 border-t border-slate-100 text-center">
                            <button className="text-xs text-[#1e3a5f] font-medium hover:underline">
                                Marcar todas como lidas
                            </button>
                        </div>
                    </PopoverContent>
                </Popover>

                {/* User Info */}
                <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                    <div className="text-right">
                        <p className="text-sm font-medium text-slate-900">Usuário</p>
                        <p className="text-xs text-slate-500 capitalize">
                            {loading ? '...' : role || 'user'}
                        </p>
                    </div>
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#1e3a5f] to-blue-500 flex items-center justify-center shadow-md">
                        <User className="h-5 w-5 text-white" />
                    </div>
                </div>
            </div>
        </header>
    )
}
