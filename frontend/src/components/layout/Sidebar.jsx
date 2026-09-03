import { NavLink } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { useLogout } from '@/hooks/useAuth'
import { useCompanySettings } from '@/hooks/useUsers'
import clsx from 'clsx'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard',     icon: DashboardIcon },
  { to: '/pipeline',  label: 'Pipeline',      icon: PipelineIcon },
  { to: '/clients',   label: 'Clientes',      icon: ClientsIcon },
  { to: '/tasks',     label: 'Tareas',        icon: TasksIcon },
  { to: '/facturas',  label: 'Facturas',      icon: FacturasIcon, roles: ['owner', 'admin'] },
  { to: '/settings',  label: 'Configuración', icon: SettingsIcon,  roles: ['owner', 'admin', 'admin_usuario'] },
]

export default function Sidebar() {
  const user = useAuthStore(s => s.user)
  const dark = useThemeStore(s => s.dark)
  const handleLogout = useLogout()
  const { data: company } = useCompanySettings()

  const visibleItems = NAV_ITEMS.filter(
    item => !item.roles || item.roles.includes(user?.role)
  )

  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase()

  return (
    <aside className="w-60 bg-white dark:bg-[#111111] border-r border-gray-100 dark:border-gray-900 flex flex-col h-screen fixed left-0 top-0 z-30">

      {/* Logo / Brand */}
      <div className="px-5 py-5 border-b border-gray-100 dark:border-gray-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 shadow-apple-sm bg-wolf-600 flex items-center justify-center">
            {company?.logo_file_url ? (
              <img
                src={company.logo_file_url}
                alt={company.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white text-sm font-bold tracking-tight">
                {(company?.name?.[0] || 'C').toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="text-[11px] font-bold text-wolf-600 dark:text-wolf-400 uppercase tracking-widest leading-none">
              IQ-CRM
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-none mt-0.5">
              {company?.name || 'CRM'}
            </p>
            <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-0.5 leading-none">
              {company?.tagline || 'Powered by IQ Data'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {visibleItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-wolf-50 dark:bg-wolf-900/20 text-wolf-700 dark:text-wolf-300'
                  : 'text-gray-500 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className={clsx(
                  'flex-shrink-0 transition-colors',
                  isActive ? 'text-wolf-600 dark:text-wolf-400' : 'text-gray-400 dark:text-gray-600'
                )}>
                  <Icon size={17} />
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + Footer */}
      <div className="border-t border-gray-100 dark:border-gray-900 p-3 space-y-3">
        {/* User info */}
        <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-default">
          <div className="w-8 h-8 rounded-full bg-wolf-100 dark:bg-wolf-900/40 flex items-center justify-center flex-shrink-0">
            <span className="text-wolf-700 dark:text-wolf-300 text-xs font-semibold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate leading-none">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-[11px] text-gray-400 dark:text-gray-600 capitalize mt-0.5 leading-none">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="flex-shrink-0 p-1 text-gray-300 dark:text-gray-700 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <LogoutIcon size={14} />
          </button>
        </div>

        {/* IQ Data branding */}
        <div className="px-2 pb-3 pt-1">
          <div className="border-t border-gray-100 dark:border-gray-900 pt-3 flex flex-col items-center gap-1">
            <img
              src={dark ? '/iqdata-dark.png' : '/iqdata-light.png'}
              alt="IQ Data"
              className="h-20 w-auto object-contain"
            />
            <p className="text-[10px] text-gray-300 dark:text-gray-700 font-medium">
              Desarrollado por IQ DATA
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}

/* ── SVG Icons ── */
function DashboardIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}

function PipelineIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  )
}

function ClientsIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function TasksIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  )
}

function FacturasIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <line x1="10" y1="9" x2="8" y2="9"/>
    </svg>
  )
}

function BillingIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  )
}

function InvoicingIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}

function SettingsIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function LogoutIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}
