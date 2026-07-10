import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

const PAGE_TITLES = {
  '/dashboard':  'Dashboard',
  '/pipeline':   'Pipeline',
  '/clients':    'Clientes',
  '/tasks':      'Tareas',
  '/billing':    'Cobros',
  '/invoicing':  'Facturación',
  '/settings':   'Configuración',
}

export default function Layout() {
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] || 'IQ Data CRM'

  return (
    <div className="flex h-screen bg-[#f5f5f7] dark:bg-[#000000]">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-60 min-h-screen overflow-hidden">
        <Topbar title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
