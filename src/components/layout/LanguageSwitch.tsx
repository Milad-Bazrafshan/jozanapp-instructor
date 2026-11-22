import { useTranslation } from 'react-i18next'
import { LANGUAGE_KEY } from '@/i18n'

export function LanguageSwitch() {
  const { i18n, t } = useTranslation()
  const language = i18n.language.startsWith('en') ? 'en' : 'fa'

  async function setLanguage(next: 'fa' | 'en') {
    localStorage.setItem(LANGUAGE_KEY, next)
    await i18n.changeLanguage(next)
  }

  return (
    <div className="flex items-center bg-slate-100 rounded-xl p-0.5" role="group" aria-label={t('common.language')}>
      {(['fa', 'en'] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => void setLanguage(code)}
          className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            language === code ? 'bg-white text-indigo-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {code === 'fa' ? t('common.persian') : t('common.english')}
        </button>
      ))}
    </div>
  )
}
