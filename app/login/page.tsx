'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { data, error } = await supabase.auth.signInWithPassword({
        email: username,
        password: password
      })

      if (error) {
        throw error
      }

      // Set cookie for middleware (legacy support if needed, but Supabase handles its own session)
      // We keep this to satisfy the existing middleware logic which checks for 'auth-token'
      document.cookie = 'auth-token=authenticated; path=/; max-age=86400'

      router.push('/')
      router.refresh() // Ensure server components re-run
    } catch (err: any) {
      console.error(err)
      setError(err.message === 'Invalid login credentials' ? 'Usuário ou senha incorretos' : 'Erro ao fazer login: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-screen w-screen overflow-hidden relative flex">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Crie_um_robozinho_202511171711_p1m2g-lY9MwnLMtihFw9KZjYDuQSemNHSMPe.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay for better readability */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />

      <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
        <Badge className="px-20 py-16 text-8xl bg-amber-500/95 text-white font-black shadow-2xl border-8 border-amber-600 rounded-3xl animate-pulse">
          Em Desenvolvimento
        </Badge>
      </div>

      {/* Text content - bottom left */}
      <div className="absolute bottom-12 left-8 z-20 max-w-xl space-y-4">
        <h1 className="text-5xl font-bold text-white drop-shadow-2xl text-balance">
          Controle Atividades Automáticas
        </h1>
      </div>

      {/* Login card - right side */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md flex items-center justify-center p-8 z-10">
        <Card className="w-full shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-2 pb-6">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Bem-vindo de volta
            </CardTitle>
            <CardDescription className="text-base text-gray-600">
              Entre com suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-semibold text-gray-700">
                  E-mail
                </Label>
                <Input
                  id="username"
                  type="email"
                  placeholder="seu@email.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  className="h-12 text-base"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="h-12 text-base"
                  required
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded text-red-700 text-sm font-medium">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold"
                disabled={isLoading}
              >
                {isLoading ? 'Entrando...' : 'Entrar no Sistema'}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-center text-sm text-gray-500">
                Sistema WSC Contabilidade
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
