import { Sidebar } from './sidebar'
import { Topbar } from './topbar'

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-200">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6 bg-slate-200/50">
          {children}
        </main>
      </div>
    </div>
  )
}
