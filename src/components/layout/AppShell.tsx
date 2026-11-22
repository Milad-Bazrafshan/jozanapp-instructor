import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-mist-50 via-white to-indigo-50/40">
      <div className="flex min-h-screen p-3 md:p-4 gap-3 md:gap-4">
        <div className="hidden lg:block shrink-0 self-stretch">
          <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
        </div>

        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex p-3">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <div className="relative h-[calc(100vh-1.5rem)]">
              <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <Topbar onMobileToggle={() => setMobileOpen(true)} />
          <main className="flex-1 overflow-y-auto overflow-x-hidden pt-3 md:pt-4">
            <div className="max-w-[1400px] w-full mx-auto px-1 md:px-2 pb-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
