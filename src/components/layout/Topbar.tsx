import { Menu } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/useAuth'
import { initials } from '@/lib/format'
import { shellCard } from '@/components/ui/Shell'
import { pageMeta } from './nav'
import { LanguageSwitch } from './LanguageSwitch'

export function Topbar({ onMobileToggle }: { onMobileToggle: () => void }) {
  const { t } = useTranslation()
  const location = useLocation()
  const auth = useAuth()
  const exact = pageMeta[location.pathname]
  const prefix = Object.keys(pageMeta)
    .filter((path) => path !== '/' && location.pathname.startsWith(path))
    .sort((a, b) => b.length - a.length)[0]
  const meta = exact || (prefix ? pageMeta[prefix] : pageMeta['/'])
  const user = auth.session?.user

  return (
    <header className={`${shellCard} shrink-0 h-16 flex items-center px-4 md:px-6 gap-4`}>
      <button
        type="button"
        onClick={onMobileToggle}
        className="lg:hidden p-2 rounded-xl hover:bg-indigo-50 text-slate-600"
        aria-label="Menu"
      >
        <Menu className="w-5 h-5" />
      </button>
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-semibold text-slate-900 truncate">{t(meta.titleKey)}</h1>
        <p className="text-xs text-slate-500 truncate hidden sm:block">{t(meta.subtitleKey)}</p>
      </div>
      <LanguageSwitch />
      {user && (
        <div className="flex items-center gap-3 ps-3 border-s border-slate-200/80">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
            {initials(user.fullName || user.email)}
          </div>
          <div className="hidden sm:block min-w-0">
            <p className="text-sm font-medium text-slate-900 leading-tight truncate">{user.fullName}</p>
            <p className="text-xs text-slate-500 truncate" dir="ltr">
              {user.email}
            </p>
          </div>
        </div>
      )}
    </header>
  )
}
