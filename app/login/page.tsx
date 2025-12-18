'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Lock, Mail } from 'lucide-react'

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

      document.cookie = 'auth-token=authenticated; path=/; max-age=86400; SameSite=None; Secure'

      router.push('/')
      router.refresh()
    } catch (err: any) {
      console.error(err)
      setError(err.message === 'Invalid login credentials' ? 'Usuário ou senha incorretos' : 'Erro ao fazer login: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-screen w-screen overflow-hidden relative flex">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Crie_um_robozinho_202511171711_p1m2g-lY9MwnLMtihFw9KZjYDuQSemNHSMPe.mp4" type="video/mp4" />
      </video>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/70" />

      {/* Small Beta Badge - Top Right */}
      <div className="absolute top-4 right-4 z-50">
        <Badge variant="outline" className="bg-amber-500/90 text-white border-amber-400 px-3 py-1 text-xs font-medium">
          Beta
        </Badge>
      </div>

      {/* Branding - Bottom Left */}
      <div className="absolute bottom-12 left-8 z-20 max-w-xl space-y-4">
        <div className="space-y-2">
          <h1 className="text-5xl font-bold text-white drop-shadow-2xl">
            WSC Contabilidade
          </h1>
          <p className="text-xl text-white/80 font-light">
            Controle de Atividades Automáticas
          </p>
        </div>
      </div>

      {/* Login Card - Right Side */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md flex items-center justify-center p-8 z-10">
        <Card className="w-full shadow-2xl border-0 bg-white/95 backdrop-blur-md">
          <CardHeader className="space-y-2 pb-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Bem-vindo
            </CardTitle>
            <CardDescription className="text-base text-gray-600">
              Entre com suas credenciais para acessar
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-semibold text-gray-700">
                  E-mail
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="username"
                    type="email"
                    placeholder="seu@email.com"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                    className="h-12 text-base pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="h-12 text-base pl-10"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded text-red-700 text-sm font-medium">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all"
                disabled={isLoading}
              >
                {isLoading ? 'Entrando...' : 'Acessar Sistema'}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-center text-xs text-gray-500">
                © 2025 WSC Contabilidade • Todos os direitos reservados
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
