import { useState } from 'react'
import { useFacturas, useFacturaResumen, useCreateFactura, useUpdateFactura, useDeleteFactura } from '@/hooks/useBilling'
import { useClients } from '@/hooks/useClients'
import { formatGS, formatDate } from '@/utils/format'
import { PageSpinner } from '@/components/ui/Spinner'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

// ── Colores por estado ────────────────────────────────────────────────────────
const ESTADO_CONFIG = {
  facturado: { label: 'Facturado',  cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  pendiente: { label: 'Pendiente',  cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  cobrado:   { label: 'Cobrado',    cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
}

// ── Tarjeta de resumen ────────────────────────────────────────────────────────
function SummaryCard({ label, value, sub, color }) {
  const colors = {
    blue:   'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10',
    green:  'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10',
    amber:  'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10',
    red:    'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10',
  }
  const textColors = {
    blue:  'text-blue-700 dark:text-blue-300',
    green: 'text-green-700 dark:text-green-300',
    amber: 'text-amber-700 dark:text-amber-300',
    red:   'text-red-700 dark:text-red-300',
  }
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-xl font-bold leading-none ${textColors[color]}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

// ── Badge días de atraso ──────────────────────────────────────────────────────
function AtrasoBadge({ dias, estado }) {
  if (estado === 'cobrado') return <span className="text-gray-400 text-xs">—</span>
  if (dias === 0) {
    const today = new Date()
    return <span className="text-xs text-gray-400">Al día</span>
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      {dias}d atraso
    </span>
  )
}

// ── Formulario Factura ────────────────────────────────────────────────────────
function FacturaForm({ initial, onSubmit, onCancel, loading, clients }) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    client: initial?.client || '',
    numero_factura: initial?.numero_factura || '',
    fecha: initial?.fecha || today,
    detalle_servicio: initial?.detalle_servicio || '',
    monto: initial?.monto || '',
    fecha_vencimiento: initial?.fecha_vencimiento || '',
    fecha_cobro: initial?.fecha_cobro || '',
    estado: initial?.estado || 'facturado',
    notas: initial?.notas || '',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = { ...form }
    if (!data.fecha_cobro) delete data.fecha_cobro
    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Cliente + Nro Factura */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Cliente *</label>
          <select
            value={form.client}
            onChange={e => set('client', e.target.value)}
            required
            className="input w-full"
          >
            <option value="">Seleccionar cliente...</option>
            {(clients?.results || clients || []).map(c => (
              <option key={c.id} value={c.id}>{c.company_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Nro. Factura *</label>
          <input
            type="text"
            value={form.numero_factura}
            onChange={e => set('numero_factura', e.target.value)}
            placeholder="001-001-0000001"
            required
            className="input w-full"
          />
        </div>
      </div>

      {/* Fecha + Vencimiento */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Fecha de emisión *</label>
          <input
            type="date"
            value={form.fecha}
            onChange={e => set('fecha', e.target.value)}
            required
            className="input w-full"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Fecha de vencimiento *</label>
          <input
            type="date"
            value={form.fecha_vencimiento}
            onChange={e => set('fecha_vencimiento', e.target.value)}
            required
            className="input w-full"
          />
        </div>
      </div>

      {/* Detalle */}
      <div>
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Detalle del servicio *</label>
        <textarea
          value={form.detalle_servicio}
          onChange={e => set('detalle_servicio', e.target.value)}
          required
          rows={2}
          placeholder="Descripción del servicio facturado..."
          className="input w-full resize-none"
        />
      </div>

      {/* Monto + Estado */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Monto (₲) *</label>
          <input
            type="number"
            value={form.monto}
            onChange={e => set('monto', e.target.value)}
            placeholder="0"
            required
            min="0"
            className="input w-full"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Estado *</label>
          <select
            value={form.estado}
            onChange={e => set('estado', e.target.value)}
            className="input w-full"
          >
            <option value="facturado">Facturado</option>
            <option value="pendiente">Pendiente</option>
            <option value="cobrado">Cobrado</option>
          </select>
        </div>
      </div>

      {/* Fecha cobro (solo si cobrado) */}
      {form.estado === 'cobrado' && (
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Fecha de cobro</label>
          <input
            type="date"
            value={form.fecha_cobro}
            onChange={e => set('fecha_cobro', e.target.value)}
            className="input w-full"
          />
        </div>
      )}

      {/* Notas */}
      <div>
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Notas</label>
        <input
          type="text"
          value={form.notas}
          onChange={e => set('notas', e.target.value)}
          placeholder="Observaciones opcionales..."
          className="input w-full"
        />
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Guardando...' : (initial ? 'Guardar cambios' : 'Registrar factura')}
        </button>
      </div>
    </form>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function Facturas() {
  const [filterEstado, setFilterEstado] = useState('')
  const [filterClient, setFilterClient] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const { data: facturasData, isLoading } = useFacturas({
    estado: filterEstado || undefined,
    client: filterClient || undefined,
  })
  const { data: resumen } = useFacturaResumen()
  const { data: clientsData } = useClients()

  const createFactura = useCreateFactura()
  const updateFactura = useUpdateFactura()
  const deleteFactura = useDeleteFactura()

  const facturas = facturasData?.results || facturasData || []
  const clients = clientsData?.results || clientsData || []

  const handleCreate = async (data) => {
    await createFactura.mutateAsync(data)
    setShowForm(false)
  }

  const handleUpdate = async (data) => {
    await updateFactura.mutateAsync({ id: editing.id, ...data })
    setEditing(null)
  }

  const handleDelete = async () => {
    await deleteFactura.mutateAsync(confirmDelete.id)
    setConfirmDelete(null)
  }

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Facturas</h1>
          <p className="text-sm text-gray-400 mt-0.5">Control de facturación y cobros</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowForm(true)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nueva factura
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard
          label="Total Facturado"
          value={formatGS(resumen?.total_facturado)}
          sub={`${resumen?.count_total || 0} facturas`}
          color="blue"
        />
        <SummaryCard
          label="Cobrado"
          value={formatGS(resumen?.total_cobrado)}
          sub={`${resumen?.count_cobrado || 0} facturas`}
          color="green"
        />
        <SummaryCard
          label="Pendiente"
          value={formatGS(resumen?.total_pendiente)}
          sub={`${resumen?.count_pendiente || 0} facturas`}
          color="amber"
        />
        <SummaryCard
          label="Vencidas"
          value={resumen?.count_vencidas || 0}
          sub="sin cobrar y vencidas"
          color="red"
        />
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={filterEstado}
          onChange={e => setFilterEstado(e.target.value)}
          className="input text-sm py-1.5 pr-8"
        >
          <option value="">Todos los estados</option>
          <option value="facturado">Facturado</option>
          <option value="pendiente">Pendiente</option>
          <option value="cobrado">Cobrado</option>
        </select>
        <select
          value={filterClient}
          onChange={e => setFilterClient(e.target.value)}
          className="input text-sm py-1.5 pr-8"
        >
          <option value="">Todos los clientes</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.company_name}</option>
          ))}
        </select>
        {(filterEstado || filterClient) && (
          <button
            onClick={() => { setFilterEstado(''); setFilterClient('') }}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-2"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Tabla */}
      {isLoading ? (
        <PageSpinner />
      ) : facturas.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <svg className="mx-auto mb-3 opacity-30" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          <p className="font-medium">No hay facturas</p>
          <p className="text-sm mt-1">Registrá tu primera factura con el botón de arriba</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Fecha</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Cliente</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Servicio</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Nro. Factura</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Estado</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">Monto</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Vencimiento</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Atraso</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {facturas.map(f => (
                <tr
                  key={f.id}
                  className="bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
                >
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {formatDate(f.fecha)}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100 max-w-[160px]">
                    <span className="truncate block">{f.client_name}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-[200px]">
                    <span className="truncate block" title={f.detalle_servicio}>{f.detalle_servicio}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {f.numero_factura}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ESTADO_CONFIG[f.estado]?.cls}`}>
                      {ESTADO_CONFIG[f.estado]?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                    {formatGS(f.monto)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-sm ${f.dias_atraso > 0 ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                      {formatDate(f.fecha_vencimiento)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <AtrasoBadge dias={f.dias_atraso} estado={f.estado} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      {/* Cambio rápido de estado */}
                      {f.estado !== 'cobrado' && (
                        <button
                          onClick={() => updateFactura.mutate({ id: f.id, estado: 'cobrado', fecha_cobro: new Date().toISOString().split('T')[0] })}
                          title="Marcar como cobrado"
                          className="p-1.5 rounded-lg text-gray-300 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => setEditing(f)}
                        title="Editar"
                        className="p-1.5 rounded-lg text-gray-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => setConfirmDelete(f)}
                        title="Eliminar"
                        className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6"/><path d="M14 11v6"/>
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Nueva Factura */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Nueva factura"
        size="lg"
      >
        <FacturaForm
          clients={clients}
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          loading={createFactura.isPending}
        />
      </Modal>

      {/* Modal Editar */}
      <Modal
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        title="Editar factura"
        size="lg"
      >
        {editing && (
          <FacturaForm
            initial={editing}
            clients={clients}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
            loading={updateFactura.isPending}
          />
        )}
      </Modal>

      {/* Confirmar borrado */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Eliminar factura"
        message={`¿Eliminar la factura ${confirmDelete?.numero_factura} de ${confirmDelete?.client_name}? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        danger
      />
    </div>
  )
}
