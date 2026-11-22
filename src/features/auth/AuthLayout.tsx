import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { LanguageSwitch } from '@/components/layout/LanguageSwitch'

export function AuthLayout({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string
  title: string
  subtitle: string
  children: ReactNode
}) {
  const { t } = useTranslation()
  return (
    <main className="min-h-screen grid lg:grid-cols-[1.05fr_0.95fr] bg-gradient-to-br from-mist-50 via-white to-indigo-50/40">
      <section className="relative hidden lg:flex flex-col justify-between bg-slate-900 text-white p-12 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.4),transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.2),transparent_50%)]" />
        <div className="relative flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-semibold shadow-lg shadow-indigo-900/40">
            O
          </div>
          <div>
            <p className="font-semibold">{t('brand.name')}</p>
            <p className="text-sm text-slate-400">{t('brand.admin')}</p>
          </div>
        </div>
        <div className="relative max-w-md space-y-4">
          <p className="text-xs uppercase tracking-[0.22em] text-indigo-300">{eyebrow}</p>
          <h1 className="text-4xl font-semibold leading-tight">{t('brand.tagline')}</h1>
          <p className="text-slate-400 text-sm leading-relaxed">{t('page.login.subtitle')}</p>
        </div>
        <p className="relative text-sm text-slate-500">{t('brand.name')}</p>
      </section>
      <section className="flex flex-col justify-center p-5 sm:p-10 min-h-screen lg:min-h-0">
        <div className="lg:hidden mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center font-semibold">
              O
            </div>
            <div>
              <p className="font-semibold text-slate-900">{t('brand.name')}</p>
              <p className="text-xs text-slate-500">{t('brand.admin')}</p>
            </div>
          </div>
          <LanguageSwitch />
        </div>
        <div className="w-full max-w-md mx-auto">
          <div className="hidden lg:flex justify-end mb-8">
            <LanguageSwitch />
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/95 backdrop-blur-sm shadow-card p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">{eyebrow}</p>
            <h2 className="text-2xl font-semibold text-slate-900 mt-2">{title}</h2>
            <p className="text-sm text-slate-500 mt-1 mb-6">{subtitle}</p>
            {children}
          </div>
        </div>
      </section>
    </main>
  )
}
