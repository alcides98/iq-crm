import { useState } from 'react'
import { useKPIs, useAlerts } from '@/hooks/useKPIs'
import { useUsers } from '@/hooks/useUsers'
import { formatGS, formatDate } from '@/utils/format'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { useThemeStore } from '@/store/themeStore'
import { useNavigate } from 'react-router-dom'

const PHASE_LABELS = {
  nueva: 'Nueva', diagnostico: 'Diagnóstico', propuesta: 'Propuesta',
  replanteo: 'Replanteo', perdida: 'Perdida', ganada: 'Ganada',
}

const COLORS = ['#364fc7', '#f59e0b', '#f97316', '#8b5cf6', '#10b981', '#ef4444']

function KPICard({ label, value, sub, accent = 'blue' }) {
  const accents = {
    blue:   { dot: 'bg-blue-500',   text: 'text-blue-600 dark:text-blue-400' },
    green:  { dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
    amber:  { dot: 'bg-amber-500',  text: 'text-amber-600 dark:text-amber-400' },
    red:    { dot: 'bg-red-500',    text: 'text-red-600 dark:text-red-400' },
    purple: { dot: 'bg-purple-500', text: 'text-purple-600 dark:text-purple-400' },
  }
  const a = accents[accent] || accents.blue
  return (
    <div className="card p-5 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${a.dot}`} />
        <p className="text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wide">{label}</p>
      </div>
      <p className={`text-2xl font-bold tracking-tight ${a.text}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-600">{sub}</p>}
    </div>
  )
}

const ALERT_ICONS = {
  overdue_tasks:    '⚠️',
  followups:        '📅',
  installments_due: '💳',
}

const ALERT_COLORS = {
  overdue_tasks:    'bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900/50 text-red-800 dark:text-red-300',
  followups:        'bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/50 text-amber-800 dark:text-amber-300',
  installments_due: 'bg-orange-50 dark:bg-orange-950/30 border-orange-100 dark:border-orange-900/50 text-orange-800 dark:text-orange-300',
}

const ALERT_ITEM_COLORS = {
  overdue_tasks:    'text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-200',
  followups:        'text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200',
  installments_due: 'text-orange-700 dark:text-orange-400 hover:text-orange-900 dark:hover:text-orange-200',
}

function FilterBar({ filters, onChange, users }) {
  return (
    <div className="card p-4 flex flex-wrap items-center gap-3">
      <span className="text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wide">Filtros</span>
      <select
        className="input py-1.5 text-sm w-44"
        value={filters.assigned_to}
        onChange={e => onChange({ ...filters, assigned_to: e.target.value })}
      >
        <option value="">Todos los usuarios</option>
        {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
      </select>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 dark:text-gray-600">Desde</span>
        <input
          type="date"
          className="input py-1.5 text-sm"
          value={filters.date_from}
          onChange={e => onChange({ ...filters, date_from: e.target.value })}
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 dark:text-gray-600">Hasta</span>
        <input
          type="date"
          className="input py-1.5 text-sm"
          value={filters.date_to}
          onChange={e => onChange({ ...filters, date_to: e.target.value })}
        />
      </div>
      {(filters.assigned_to || filters.date_from || filters.date_to) && (
        <button
          onClick={() => onChange({ assigned_to: '', date_from: '', date_to: '' })}
          className="text-xs text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        >
          ✕ Limpiar filtros
        </button>
      )}
    </div>
  )
}

export default function Dashboard() {
  const [filters, setFilters] = useState({ assigned_to: '', date_from: '', date_to: '' })
  const activeFilters = Object.fromEntries(Object.entries(filters).filter(([, v]) => v))

  const { data: kpis, isLoading } = useKPIs(activeFilters)
  const { data: alertData } = useAlerts()
  const { data: usersRaw = [] } = useUsers()
  const dark = useThemeStore(s => s.dark)
  const navigate = useNavigate()

  const users = Array.isArray(usersRaw) ? usersRaw : (usersRaw?.results || [])

  const chartColors = {
    text: dark ? '#6b7280' : '#9ca3af',
    tooltip: dark ? '#1c1c1e' : '#fff',
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-7 h-7 border-[3px] border-wolf-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const phaseData = (kpis?.deals_by_phase || []).map(d => ({
    name: PHASE_LABELS[d.phase] || d.phase,
    total: d.total || 0,
    count: d.count,
  }))

  const phaseCountData = (kpis?.deals_by_phase_count || []).map(d => ({
    name: PHASE_LABELS[d.phase] || d.phase,
    count: d.count,
  }))

  const tasksByClientData = (kpis?.tasks_by_client || []).map(d => ({
    name: d.deal__client__company_name || 'Sin cliente',
    count: d.count,
  }))

  const tasksByUserData = (kpis?.tasks_by_user || []).map(d => ({
    name: `${d.assigned_to__first_name || ''} ${d.assigned_to__last_name || ''}`.trim() || 'Sin asignar',
    count: d.count,
  }))

  return (
    <div className="space-y-5">
      {/* Filtros */}
      <FilterBar filters={filters} onChange={setFilters} users={users} />

      {/* Alertas */}
      {alertData?.alerts?.length > 0 && (
        <div className="space-y-3">
          {alertData.alerts.map((alert, i) => (
            <div key={i} className={`border rounded-2xl p-4 ${ALERT_COLORS[alert.type] || ALERT_COLORS.overdue_tasks}`}>
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-sm flex items-center gap-2">
                  <span>{ALERT_ICONS[alert.type]}</span>
                  {alert.message}
                </p>
                <button
                  onClick={() => navigate(alert.url)}
                  className="text-xs font-medium underline opacity-70 hover:opacity-100 transition-opacity"
                >
                  Ver todos →
                </button>
              </div>
              <ul className="space-y-1 mt-2">
                {(alert.items || []).map((item, j) => (
                  <li key={j}>
                    <button
                      onClick={() => navigate(alert.url)}
                      className={`text-left w-full text-xs flex items-center gap-2 py-0.5 transition-colors ${ALERT_ITEM_COLORS[alert.type]}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0 mt-0.5" />
                      <span className="font-medium">{item.name}</span>
                      {item.linked_name && <span className="opacity-70">· {item.linked_name}</span>}
                      {item.client_name && <span className="opacity-70">· {item.client_name}</span>}
                      {item.deal_name && <span className="opacity-70">· {item.deal_name}</span>}
                      {item.due_date && (
                        <span className={`ml-auto flex-shrink-0 font-medium ${item.is_today ? 'opacity-100' : 'opacity-60'}`}>
                          {item.is_today ? 'hoy' : formatDate(item.due_date)}
                        </span>
                      )}
                      {item.next_followup && (
                        <span className={`ml-auto flex-shrink-0 font-medium ${item.is_today ? 'opacity-100' : 'opacity-60'}`}>
                          {item.is_today ? 'hoy' : formatDate(item.next_followup)}
                        </span>
                      )}
                      {item.amount && (
                        <span className="ml-auto flex-shrink-0 font-medium">{formatGS(item.amount)}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Pipeline total" value={formatGS(kpis?.pipeline_total)} sub={`${kpis?.active_deals_count || 0} negociaciones activas`} accent="blue" />
        <KPICard label="Forecast ponderado" value={formatGS(kpis?.forecast_weighted)} sub="Ponderado por probabilidad" accent="green" />
        <KPICard label="Conversión" value={`${kpis?.conversion_rate || 0}%`} sub={`${kpis?.won_deals_count || 0} negocios ganados`} accent="amber" />
        <KPICard label="Ticket promedio" value={formatGS(kpis?.avg_ticket)} accent="purple" />
      </div>

      {/* Gráficos fila 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Pipeline por fase — monto</h3>
          {phaseData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={phaseData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: chartColors.text }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: chartColors.text }} tickFormatter={v => formatGS(v)} width={80} axisLine={false} tickLine={false} />
                <Tooltip formatter={v => formatGS(v)} contentStyle={{ background: chartColors.tooltip, border: 'none', borderRadius: '12px', fontSize: 12, boxShadow: '0 4px 16px rgba(0,0,0,.1)' }} />
                <Bar dataKey="total" fill="#364fc7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px]">
              <p className="text-gray-400 dark:text-gray-600 text-sm">Sin datos de pipeline</p>
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Servicios ganados</h3>
          {kpis?.services_ranking?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={kpis.services_ranking} dataKey="count" nameKey="service_type" cx="50%" cy="50%" outerRadius={72} innerRadius={30}>
                  {kpis.services_ranking.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: chartColors.tooltip, border: 'none', borderRadius: '12px', fontSize: 12, boxShadow: '0 4px 16px rgba(0,0,0,.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px]">
              <p className="text-gray-400 dark:text-gray-600 text-sm">Sin negocios ganados aún</p>
            </div>
          )}
        </div>
      </div>

      {/* Gráficos fila 2 — nuevos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Negociaciones por fase — cantidad</h3>
          {phaseCountData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={phaseCountData} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: chartColors.text }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: chartColors.text }} axisLine={false} tickLine={false} width={72} />
                <Tooltip contentStyle={{ background: chartColors.tooltip, border: 'none', borderRadius: '12px', fontSize: 12, boxShadow: '0 4px 16px rgba(0,0,0,.1)' }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px]">
              <p className="text-gray-400 dark:text-gray-600 text-sm">Sin datos</p>
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Tareas por cliente</h3>
          {tasksByClientData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={tasksByClientData} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: chartColors.text }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: chartColors.text }} axisLine={false} tickLine={false} width={80} />
                <Tooltip contentStyle={{ background: chartColors.tooltip, border: 'none', borderRadius: '12px', fontSize: 12, boxShadow: '0 4px 16px rgba(0,0,0,.1)' }} />
                <Bar dataKey="count" fill="#10b981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px]">
              <p className="text-gray-400 dark:text-gray-600 text-sm">Sin tareas por cliente</p>
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Tareas por usuario</h3>
          {tasksByUserData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={tasksByUserData} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: chartColors.text }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: chartColors.text }} axisLine={false} tickLine={false} width={80} />
                <Tooltip contentStyle={{ background: chartColors.tooltip, border: 'none', borderRadius: '12px', fontSize: 12, boxShadow: '0 4px 16px rgba(0,0,0,.1)' }} />
                <Bar dataKey="count" fill="#f59e0b" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px]">
              <p className="text-gray-400 dark:text-gray-600 text-sm">Sin tareas asignadas</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom KPIs */}
      <div className="grid grid-cols-2 gap-4">
        <KPICard label="Tareas vencidas" value={kpis?.overdue_tasks_count || 0} accent="red" />
        <KPICard label="Cobros pendientes" value={formatGS(kpis?.pending_billing)} accent="amber" />
      </div>
    </div>
  )
}
