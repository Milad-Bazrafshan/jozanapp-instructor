import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Building2,
  Globe2,
  Languages,
  LogOut,
  Mail,
  Shield,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { organizationApi } from '@/api/organization'
import { queryKeys } from '@/api/queryKeys'
import { useAuth } from '@/auth/useAuth'
import { LanguageSwitch } from '@/components/layout/LanguageSwitch'
import { Button } from '@/components/ui/Button'
import { PageSpinner } from '@/components/ui/Spinner'
import { PageStack, ShellCard, shellInset } from '@/components/ui/Shell'
import { initials, useLocale } from '@/lib/format'

function InfoRow({ icon: Icon, label, value, ltr }: { icon: typeof Mail; label: string; value: string; ltr?: boolean }) {
  return (
    <div className={`${shellInset} flex items-start gap-3 px-4 py-3`}>
      <span className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className={`text-sm font-medium text-slate-900 mt-0.5 truncate ${ltr ? 'ltr-field' : ''}`} dir={ltr ? 'ltr' : undefined}>
          {value}
        </p>
      </div>
    </div>
  )
}

export function SettingsPage() {
  const { t } = useTranslation()
  const { dir } = useLocale()
  const auth = useAuth()
  const orgQuery = useQuery({
    queryKey: queryKeys.organization,
    queryFn: organizationApi.current,
    enabled: auth.hasPermission('ORGANIZATION_READ'),
  })
  const user = auth.session?.user
  const org = orgQuery.data

  const roles = useMemo(() => {
    const map = new Map<string, string>()
    for (const grant of user?.grants ?? []) {
      map.set(grant.roleId, grant.roleName)
    }
    return [...map.values()]
  }, [user?.grants])

  if (orgQuery.isLoading && auth.hasPermission('ORGANIZATION_READ')) {
    return <PageSpinner label={t('common.loading')} />
  }

  return (
    <PageStack className="max-w-3xl space-y-6">
      <ShellCard className="relative overflow-hidden p-6 md:p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/15 via-violet-400/10 to-transparent pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white text-2xl font-bold flex items-center justify-center shadow-lg shadow-indigo-200/60 shrink-0">
            {initials(user?.fullName || user?.email || '?')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-700 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              {t('common.profile')}
            </p>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">{user?.fullName || t('common.dash')}</h1>
            <p className="text-sm text-slate-600 mt-1">{t('settings.profileLead')}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 border border-slate-200/80 px-3 py-1 text-xs font-medium text-slate-700">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                {user?.tenantName}
              </span>
              {roles.slice(0, 3).map((role) => (
                <span key={role} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-xs font-medium text-indigo-800">
                  <Shield className="w-3.5 h-3.5" />
                  {role}
                </span>
              ))}
              {roles.length > 3 ? (
                <span className="text-xs text-slate-500 self-center">+{roles.length - 3}</span>
              ) : null}
            </div>
          </div>
        </div>
      </ShellCard>

      <ShellCard className="p-5 md:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <UserRound className="w-5 h-5 text-indigo-600" />
          <h2 className="font-semibold text-slate-900">{t('settings.accountSection')}</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <InfoRow icon={Mail} label={t('common.email')} value={user?.email ?? t('common.dash')} ltr />
          <InfoRow icon={Globe2} label={t('settings.tenantSlug')} value={user?.tenantSlug ?? t('common.dash')} ltr />
        </div>
        {roles.length ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500">{t('settings.roles')}</p>
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => (
                <span key={role} className={`${shellInset} px-3 py-1.5 text-sm text-slate-800`}>
                  {role}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </ShellCard>

      {org ? (
        <ShellCard className="p-5 md:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <h2 className="font-semibold text-slate-900">{t('settings.organization')}</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <InfoRow icon={Building2} label={t('settings.organization')} value={org.tenantName} />
            <InfoRow icon={UserRound} label={t('settings.institution')} value={org.institutionName} />
            <InfoRow icon={Globe2} label={t('settings.timezone')} value={org.timezone} ltr />
            <InfoRow icon={Shield} label={t('common.status')} value={t(`status.${org.tenantStatus}`, { defaultValue: org.tenantStatus })} />
          </div>
        </ShellCard>
      ) : null}

      <ShellCard className="p-5 md:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Languages className="w-5 h-5 text-indigo-600" />
          <h2 className="font-semibold text-slate-900">{t('settings.appearance')}</h2>
        </div>
        <p className="text-sm text-slate-600">{t('settings.languageHelp')}</p>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <LanguageSwitch />
          <p className="text-xs text-slate-500">{dir === 'rtl' ? t('settings.rtlActive') : t('settings.ltrActive')}</p>
        </div>
      </ShellCard>

      <ShellCard className="p-5 md:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-rose-100/80">
        <div>
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <LogOut className="w-5 h-5 text-rose-600" />
            {t('settings.session')}
          </h2>
          <p className="text-sm text-slate-600 mt-1">{t('settings.logoutHint')}</p>
        </div>
        <Button variant="danger" onClick={() => void auth.logout()}>
          {t('common.logout')}
        </Button>
      </ShellCard>
    </PageStack>
  )
}
