import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/useAuth'
import { navGroups } from './nav'

export function Sidebar({
  collapsed,
  onToggle,
  onNavigate,
}: {
  collapsed: boolean
  onToggle: () => void
  onNavigate?: () => void
}) {
  const { t } = useTranslation()
  const location = useLocation()
  const auth = useAuth()
  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      children: group.children.filter((child) => !child.anyOf.length || auth.hasAnyPermission(child.anyOf)),
    }))
    .filter((group) => group.children.length)

  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    const group = navGroups.find((item) =>
      item.children.some((child) => child.to === location.pathname || (child.to !== '/' && location.pathname.startsWith(child.to))),
    )
    if (group) setExpanded((prev) => new Set(prev).add(group.id))
  }, [location.pathname])

  return (
    <aside
      className={`${collapsed ? 'w-[4.25rem]' : 'w-60'} flex flex-col transition-all duration-300 ease-in-out h-full max-h-[calc(100vh-2rem)] rounded-2xl border border-white/70 bg-white/95 backdrop-blur-xl shadow-card overflow-hidden`}
    >
      <div className="flex items-center gap-3 h-16 px-4 border-b border-slate-100/80">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shrink-0 shadow-sm">
          <span className="text-white font-bold text-sm">O</span>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-semibold text-neutral-900 text-lg tracking-tight leading-tight">{t('brand.name')}</p>
            <p className="text-xs text-neutral-500 truncate">{t('brand.admin')}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleGroups.map((group) => {
          const Icon = group.icon
          const isOpen = expanded.has(group.id)
          const hasActiveChild = group.children.some(
            (child) => location.pathname === child.to || (child.to !== '/' && location.pathname.startsWith(`${child.to}/`)),
          )
          const isSingleChild = group.children.length === 1

          if (isSingleChild) {
            const child = group.children[0]
            return (
              <NavLink
                key={group.id}
                to={child.to}
                end={child.to === '/'}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative ${
                    isActive ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-900'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" strokeWidth={2} />
                {!collapsed && <span>{t(group.children[0].labelKey)}</span>}
                {collapsed && (
                  <span className="absolute start-20 px-2 py-1 rounded-md bg-neutral-900 text-white text-xs opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                    {t(child.labelKey)}
                  </span>
                )}
              </NavLink>
            )
          }

          return (
            <div key={group.id} className="relative">
              <button
                type="button"
                onClick={() =>
                  setExpanded((prev) => {
                    const next = new Set(prev)
                    if (next.has(group.id)) next.delete(group.id)
                    else next.add(group.id)
                    return next
                  })
                }
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                  hasActiveChild ? 'text-neutral-900' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" strokeWidth={2} />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-start">{t(group.labelKey)}</span>
                    <ChevronRight className={`w-4 h-4 shrink-0 text-neutral-400 transition-transform duration-200 rtl:rotate-180 ${isOpen ? 'ltr:rotate-90 rtl:-rotate-90' : ''}`} />
                  </>
                )}
                {collapsed && (
                  <span className="absolute start-20 px-2 py-1 rounded-md bg-neutral-900 text-white text-xs opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                    {t(group.labelKey)}
                  </span>
                )}
              </button>
              {!collapsed && (
                <div className={`overflow-hidden transition-all duration-200 ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="ms-5 ps-5 border-s border-neutral-200 space-y-0.5 mt-0.5">
                    {group.children.map((child) => (
                      <NavLink
                        key={child.id}
                        to={child.to}
                        onClick={onNavigate}
                        className={({ isActive }) =>
                          `w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                            isActive ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-900'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-white' : 'bg-neutral-300'}`} />
                            {t(child.labelKey)}
                          </>
                        )}
                      </NavLink>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div className="p-3 border-t border-neutral-200">
        <button
          type="button"
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
        >
          <ChevronLeft className={`w-5 h-5 transition-transform duration-300 rtl:rotate-180 ${collapsed ? 'rotate-180 rtl:rotate-0' : ''}`} />
          {!collapsed && <span className="text-sm font-medium">{t('common.collapse')}</span>}
        </button>
      </div>
    </aside>
  )
}
