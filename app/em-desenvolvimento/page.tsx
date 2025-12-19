import { AppLayout } from '@/components/layout/app-layout'
import { Hammer, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function MaintenancePage() {
    return (
        <AppLayout>
            <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="relative">
                    <div className="absolute -inset-4 bg-amber-500/20 blur-2xl rounded-full" />
                    <Hammer className="h-24 w-24 text-amber-500 relative animate-bounce" />
                </div>

                <div className="text-center space-y-4 max-w-md">
                    <h1 className="text-4xl font-extrabold tracking-tight">Página em Manutenção</h1>
                    <p className="text-muted-foreground text-lg text-balance">
                        Estamos trabalhando duro para trazer esta funcionalidade para você o mais breve possível.
                        Fique ligado para novidades!
                    </p>
                </div>

                <Link href="/">
                    <Button variant="default" size="lg" className="shadow-lg hover:shadow-xl transition-all">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar para o Dashboard
                    </Button>
                </Link>
            </div>
        </AppLayout>
    )
}
