import { useAlerts } from '@/hooks/useKPIs'
import { useThemeStore } from '@/store/themeStore'
import { useCompanySettings } from '@/hooks/useUsers'

export default function Topbar({ title }) {
  const { data: alertData } = useAlerts()
  const alertCount = alertData?.total || 0
  const { dark, toggle } = useThemeStore()
  const { data: company } = useCompanySettings()

  return (
    <header className="h-14 bg-white/80 dark:bg-[#111111]/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-900 flex items-center justify-between px-6 sticky top-0 z-20">
      <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 tracking-tight">{title}</h2>

      <div className="flex items-center gap-2">
        {alertCount > 0 && (
          <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 text-xs font-medium px-2.5 py-1 rounded-full border border-red-100 dark:border-red-900/50">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            {alertCount} alerta{alertCount > 1 ? 's' : ''}
          </div>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggle}
          title={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/8 transition-all duration-200"
        >
          {dark ? <SunIcon /> : <MoonIcon />}
        </button>

        {/* Company logo — circular */}
        <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-wolf-600 flex items-center justify-center ring-2 ring-gray-100 dark:ring-gray-800">
          {company?.logo_file_url ? (
            <img
              src={company.logo_file_url}
              alt={company?.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-white text-sm font-bold">
              {(company?.name?.[0] || 'W').toUpperCase()}
            </span>
          )}
        </div>
      </div>
    </header>
  )
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}
