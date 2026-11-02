import { useState } from 'react'
import {
  useFacturas, useFacturaResumen, useCreateFactura, useUpdateFactura, useDeleteFactura,
  useCreatePagoFactura, useDeletePagoFactura,
  useEgresos, useEgresoResumen, useCreateEgreso, useUpdateEgreso, useDeleteEgreso,
  useCreatePagoEgreso, useDeletePagoEgreso,
  useConsolidado,
} from '@/hooks/useBilling'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { useClients, useProveedores } from '@/hooks/useClients'
import { formatGS, formatDate } from '@/utils/format'

// Primer y último día del mes actual (default filtros)
function currentMonthRange() {
  const now = new Date()
  const first = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const last  = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
  return { first, last }
}
const { first: MONTH_FIRST, last: MONTH_LAST } = currentMonthRange()
import { PageSpinner } from '@/components/ui/Spinner'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import clsx from 'clsx'

// ── Helpers ───────────────────────────────────────────────────────────────────

const ESTADO_ING = {
  facturado: { label: 'Facturado',     cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  pendiente: { label: 'Pendiente',     cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  parcial:   { label: 'Pago parcial',  cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  cobrado:   { label: 'Cobrado',       cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
}

const ESTADO_EGR = {
  pendiente: { label: 'Pendiente',    cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  parcial:   { label: 'Pago parcial', cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  pagado:    { label: 'Pagado',       cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
}

const METODO_LABEL = {
  efectivo: 'Efectivo', transferencia: 'Transferencia', cheque: 'Cheque', tarjeta: 'Tarjeta',
}

const CATEGORIA_LABEL = {
  operativo:       'Operativo',
  contable:        'Contable',
  comisiones:      'Comisiones',
  alquiler:        'Alquiler',
  salario:         'Salario',
  tarjeta_credito: 'Tarjeta de crédito',
  insumos:         'Insumos',
  marketing:       'Marketing',
  impuesto:        'Impuesto',
  proveedor:       'Proveedor',
  servicio:        'Servicio',
  otro:            'Otro',
}

const TIPO_IVA_LABEL = {
  iva_10:  'IVA 10%',
  iva_5:   'IVA 5%',
  exenta:  'Exenta',
  sin_iva: 'Sin IVA',
}

const PIE_COLORS = [
  '#6366f1','#f59e0b','#10b981','#ef4444','#3b82f6','#8b5cf6',
  '#ec4899','#14b8a6','#f97316','#a3e635','#64748b','#e11d48',
]

function SummaryCard({ label, value, sub, color }) {
  const borders = {
    blue:   'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10',
    green:  'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10',
    amber:  'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10',
    red:    'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10',
    purple: 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/10',
  }
  const texts = {
    blue:   'text-blue-700 dark:text-blue-300',
    green:  'text-green-700 dark:text-green-300',
    amber:  'text-amber-700 dark:text-amber-300',
    red:    'text-red-700 dark:text-red-300',
    purple: 'text-purple-700 dark:text-purple-300',
  }
  return (
    <div className={`rounded-xl border p-4 ${borders[color]}`}>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-xl font-bold leading-none ${texts[color]}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function AtrasoBadge({ dias, pagado }) {
  if (pagado) return <span className="text-gray-400 text-xs">—</span>
  if (!dias || dias === 0) return <span className="text-xs text-gray-400">Al día</span>
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      {dias}d
    </span>
  )
}

// ── Modal pagos parciales ─────────────────────────────────────────────────────

function PagosModal({ item, tipo, onClose }) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({ monto: '', fecha: today, metodo: 'transferencia', notas: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const createPagoFactura = useCreatePagoFactura()
  const deletePagoFactura = useDeletePagoFactura()
  const createPagoEgreso  = useCreatePagoEgreso()
  const deletePagoEgreso  = useDeletePagoEgreso()

  const create = tipo === 'ingreso' ? createPagoFactura : createPagoEgreso
  const deletePago = tipo === 'ingreso' ? deletePagoFactura : deletePagoEgreso
  const idKey = tipo === 'ingreso' ? 'facturaId' : 'egresoId'

  const saldo = item.saldo_pendiente ?? (item.monto - (item.monto_pagado || 0))

  const handleAdd = async (e) => {
    e.preventDefault()
    if (parseFloat(form.monto) > saldo) {
      alert(`El monto no puede superar el saldo pendiente (${formatGS(saldo)})`)
      return
    }
    await create.mutateAsync({ [idKey]: item.id, ...form, monto: parseInt(form.monto) })
    setForm({ monto: '', fecha: today, metodo: 'transferencia', notas: '' })
  }

  const pagos = item.pagos || []

  return (
    <div className="space-y-5">
      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-400 mb-0.5">Total</p>
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatGS(item.monto)}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
          <p className="text-xs text-green-600 dark:text-green-400 mb-0.5">Pagado</p>
          <p className="text-sm font-bold text-green-700 dark:text-green-300">{formatGS(item.monto_pagado || 0)}</p>
        </div>
        <div className={`rounded-xl p-3 text-center ${saldo > 0 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-gray-50 dark:bg-gray-900'}`}>
          <p className={`text-xs mb-0.5 ${saldo > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'}`}>Saldo</p>
          <p className={`text-sm font-bold ${saldo > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-gray-400'}`}>{formatGS(saldo)}</p>
        </div>
      </div>

      {/* Historial de pagos */}
      {pagos.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Pagos registrados</p>
          <div className="space-y-2">
            {pagos.map(p => (
              <div key={p.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded-xl px-4 py-2.5">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatGS(p.monto)}</p>
                  <p className="text-xs text-gray-400">{formatDate(p.fecha)} · {METODO_LABEL[p.metodo] || p.metodo}{p.notas ? ` · ${p.notas}` : ''}</p>
                </div>
                <button
                  onClick={() => deletePago.mutate(p.id)}
                  className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Eliminar pago"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6"/><path d="M14 11v6"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agregar pago — solo si hay saldo */}
      {saldo > 0 ? (
        <form onSubmit={handleAdd} className="space-y-3 border-t border-gray-100 dark:border-gray-800 pt-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Registrar pago</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Monto (₲) *</label>
              <input
                type="number" className="input" required min="1" max={saldo}
                value={form.monto} onChange={e => set('monto', e.target.value)}
                placeholder={`máx. ${parseInt(saldo).toLocaleString()}`}
              />
            </div>
            <div>
              <label className="label">Fecha *</label>
              <input type="date" className="input" required value={form.fecha} onChange={e => set('fecha', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Método</label>
              <select className="input" value={form.metodo} onChange={e => set('metodo', e.target.value)}>
                <option value="transferencia">Transferencia</option>
                <option value="efectivo">Efectivo</option>
                <option value="cheque">Cheque</option>
                <option value="tarjeta">Tarjeta</option>
              </select>
            </div>
            <div>
              <label className="label">Notas</label>
              <input type="text" className="input" value={form.notas} onChange={e => set('notas', e.target.value)} placeholder="Opcional..." />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="btn-primary" disabled={create.isPending}>
              {create.isPending ? 'Guardando...' : 'Registrar pago'}
            </button>
          </div>
        </form>
      ) : (
        <div className="text-center py-3 text-sm text-green-600 dark:text-green-400 font-medium border-t border-gray-100 dark:border-gray-800 pt-4">
          ✓ Totalmente {tipo === 'ingreso' ? 'cobrado' : 'pagado'}
        </div>
      )}
    </div>
  )
}

// ── Formulario Factura (ingreso) ──────────────────────────────────────────────

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
    tipo_iva: initial?.tipo_iva || 'iva_10',
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
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Cliente *</label>
          <select value={form.client} onChange={e => set('client', e.target.value)} required className="input">
            <option value="">Seleccionar cliente...</option>
            {(clients || []).map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Nro. Factura *</label>
          <input type="text" value={form.numero_factura} onChange={e => set('numero_factura', e.target.value)} placeholder="001-001-0000001" required className="input" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Fecha de emisión *</label>
          <input type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} required className="input" />
        </div>
        <div>
          <label className="label">Fecha de vencimiento *</label>
          <input type="date" value={form.fecha_vencimiento} onChange={e => set('fecha_vencimiento', e.target.value)} required className="input" />
        </div>
      </div>
      <div>
        <label className="label">Detalle del servicio *</label>
        <textarea value={form.detalle_servicio} onChange={e => set('detalle_servicio', e.target.value)} required rows={2} placeholder="Descripción del servicio facturado..." className="input resize-none" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label">Monto (₲) *</label>
          <input type="number" value={form.monto} onChange={e => set('monto', e.target.value)} placeholder="0" required min="0" className="input" />
        </div>
        <div>
          <label className="label">Condición IVA *</label>
          <select value={form.tipo_iva} onChange={e => set('tipo_iva', e.target.value)} className="input">
            <option value="iva_10">IVA 10%</option>
            <option value="iva_5">IVA 5%</option>
            <option value="exenta">Exenta</option>
            <option value="sin_iva">Sin IVA</option>
          </select>
        </div>
        <div>
          <label className="label">Estado *</label>
          <select value={form.estado} onChange={e => set('estado', e.target.value)} className="input">
            <option value="facturado">Facturado</option>
            <option value="pendiente">Pendiente</option>
            <option value="parcial">Pago parcial</option>
            <option value="cobrado">Cobrado</option>
          </select>
        </div>
      </div>
      {form.estado === 'cobrado' && (
        <div>
          <label className="label">Fecha de cobro</label>
          <input type="date" value={form.fecha_cobro} onChange={e => set('fecha_cobro', e.target.value)} className="input" />
        </div>
      )}
      <div>
        <label className="label">Notas</label>
        <input type="text" value={form.notas} onChange={e => set('notas', e.target.value)} placeholder="Observaciones opcionales..." className="input" />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Guardando...' : (initial ? 'Guardar cambios' : 'Registrar factura')}
        </button>
      </div>
    </form>
  )
}

// ── Formulario Egreso ─────────────────────────────────────────────────────────

function EgresoForm({ initial, onSubmit, onCancel, loading }) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    descripcion:       initial?.descripcion       || '',
    proveedor:         initial?.proveedor         || '',
    proveedor_client:  initial?.proveedor_client  || '',
    categoria:         initial?.categoria         || 'otro',
    monto:             initial?.monto             || '',
    fecha:             initial?.fecha             || today,
    fecha_vencimiento: initial?.fecha_vencimiento || '',
    estado:            initial?.estado            || 'pendiente',
    tipo_iva:          initial?.tipo_iva          || 'iva_10',
    notas:             initial?.notas             || '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const { data: proveedoresData } = useProveedores()
  const proveedores = proveedoresData?.results || proveedoresData || []

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = { ...form }
    if (!data.fecha_vencimiento) delete data.fecha_vencimiento
    if (!data.proveedor_client) delete data.proveedor_client
    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Descripción *</label>
        <input type="text" value={form.descripcion} onChange={e => set('descripcion', e.target.value)} required className="input" placeholder="Descripción del gasto..." />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Proveedor (empresa registrada)</label>
          <select value={form.proveedor_client} onChange={e => set('proveedor_client', e.target.value)} className="input">
            <option value="">— Sin proveedor registrado —</option>
            {proveedores.map(p => <option key={p.id} value={p.id}>{p.company_name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Proveedor (texto libre)</label>
          <input type="text" value={form.proveedor} onChange={e => set('proveedor', e.target.value)} className="input" placeholder="Nombre del proveedor..." />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Categoría</label>
          <select value={form.categoria} onChange={e => set('categoria', e.target.value)} className="input">
            {Object.entries(CATEGORIA_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Condición IVA</label>
          <select value={form.tipo_iva} onChange={e => set('tipo_iva', e.target.value)} className="input">
            <option value="iva_10">IVA 10%</option>
            <option value="iva_5">IVA 5%</option>
            <option value="exenta">Exenta</option>
            <option value="sin_iva">Sin IVA</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Fecha *</label>
          <input type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} required className="input" />
        </div>
        <div>
          <label className="label">Fecha de vencimiento</label>
          <input type="date" value={form.fecha_vencimiento} onChange={e => set('fecha_vencimiento', e.target.value)} className="input" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Monto (₲) *</label>
          <input type="number" value={form.monto} onChange={e => set('monto', e.target.value)} required min="0" className="input" placeholder="0" />
        </div>
        <div>
          <label className="label">Estado</label>
          <select value={form.estado} onChange={e => set('estado', e.target.value)} className="input">
            <option value="pendiente">Pendiente</option>
            <option value="parcial">Pago parcial</option>
            <option value="pagado">Pagado</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Notas</label>
        <input type="text" value={form.notas} onChange={e => set('notas', e.target.value)} placeholder="Observaciones opcionales..." className="input" />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Guardando...' : (initial ? 'Guardar cambios' : 'Registrar egreso')}
        </button>
      </div>
    </form>
  )
}

// ── Tab: Ingresos (Facturas) ──────────────────────────────────────────────────

function TabIngresos() {
  const [filterEstado,  setFilterEstado]  = useState('')
  const [filterClient,  setFilterClient]  = useState('')
  const [filterDesde,   setFilterDesde]   = useState(MONTH_FIRST)
  const [filterHasta,   setFilterHasta]   = useState(MONTH_LAST)
  const [showForm,   setShowForm]   = useState(false)
  const [editing,    setEditing]    = useState(null)
  const [pagosItem,  setPagosItem]  = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const { data: facturasData, isLoading } = useFacturas({
    estado:      filterEstado  || undefined,
    client:      filterClient  || undefined,
    fecha_desde: filterDesde   || undefined,
    fecha_hasta: filterHasta   || undefined,
  })
  const { data: resumen }     = useFacturaResumen({
    estado:      filterEstado  || undefined,
    client:      filterClient  || undefined,
    fecha_desde: filterDesde   || undefined,
    fecha_hasta: filterHasta   || undefined,
  })
  const { data: clientsData } = useClients()

  const createFactura = useCreateFactura()
  const updateFactura = useUpdateFactura()
  const deleteFactura = useDeleteFactura()

  const facturas = facturasData?.results || facturasData || []
  const clients  = clientsData?.results  || clientsData  || []

  const hasFilters = filterEstado || filterClient || filterDesde !== MONTH_FIRST || filterHasta !== MONTH_LAST
  const clearFilters = () => { setFilterEstado(''); setFilterClient(''); setFilterDesde(MONTH_FIRST); setFilterHasta(MONTH_LAST) }

  const handleCreate = async (data) => { await createFactura.mutateAsync(data); setShowForm(false) }
  const handleUpdate = async (data) => { await updateFactura.mutateAsync({ id: editing.id, ...data }); setEditing(null) }
  const handleDelete = async () => { await deleteFactura.mutateAsync(confirmDelete.id); setConfirmDelete(null) }

  return (
    <div className="space-y-5">
      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Total Facturado" value={formatGS(resumen?.total_facturado)} sub={`${resumen?.count_total || 0} facturas`} color="blue" />
        <SummaryCard label="Cobrado" value={formatGS(resumen?.total_cobrado)} sub={`${resumen?.count_cobrado || 0} facturas`} color="green" />
        <SummaryCard label="Pendiente / Parcial" value={formatGS(resumen?.total_pendiente)} sub={`${resumen?.count_pendiente || 0} facturas`} color="amber" />
        <SummaryCard label="Vencidas" value={resumen?.count_vencidas || 0} sub="sin cobrar y vencidas" color="red" />
      </div>

      {/* Filtros + botón */}
      <div className="flex flex-wrap items-end gap-3 justify-between">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Cliente */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Cliente</label>
            <select value={filterClient} onChange={e => setFilterClient(e.target.value)} className="input text-sm py-1.5 w-44">
              <option value="">Todos</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
            </select>
          </div>
          {/* Estado */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Estado</label>
            <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} className="input text-sm py-1.5 w-36">
              <option value="">Todos</option>
              <option value="facturado">Facturado</option>
              <option value="pendiente">Pendiente</option>
              <option value="parcial">Pago parcial</option>
              <option value="cobrado">Cobrado</option>
            </select>
          </div>
          {/* Periodo */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Desde</label>
            <input type="date" value={filterDesde} onChange={e => setFilterDesde(e.target.value)} className="input text-sm py-1.5 w-36" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Hasta</label>
            <input type="date" value={filterHasta} onChange={e => setFilterHasta(e.target.value)} className="input text-sm py-1.5 w-36" />
          </div>
          {hasFilters && (
            <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 pb-1.5">
              Limpiar filtros
            </button>
          )}
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowForm(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nueva factura
        </button>
      </div>

      {/* Tabla */}
      {isLoading ? <PageSpinner /> : facturas.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <svg className="mx-auto mb-3 opacity-30" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
          </svg>
          <p className="font-medium">No hay facturas</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Fecha</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Cliente</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Nro. Factura</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Estado</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">Total</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">Pagado</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">Saldo</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Vence</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Atraso</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {facturas.map(f => {
                const pagado = f.estado === 'cobrado'
                const saldo = f.saldo_pendiente ?? (f.monto - (f.monto_pagado || 0))
                return (
                  <tr key={f.id} className="bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(f.fecha)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100 max-w-[140px]">
                      <span className="truncate block">{f.client_name}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">{f.numero_factura}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ESTADO_ING[f.estado]?.cls}`}>
                        {ESTADO_ING[f.estado]?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">{formatGS(f.monto)}</td>
                    <td className="px-4 py-3 text-right text-green-700 dark:text-green-400 font-medium whitespace-nowrap">{formatGS(f.monto_pagado || 0)}</td>
                    <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${saldo > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'}`}>
                      {saldo > 0 ? formatGS(saldo) : '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDate(f.fecha_vencimiento)}</td>
                    <td className="px-4 py-3 whitespace-nowrap"><AtrasoBadge dias={f.dias_atraso} pagado={pagado} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        {/* Registrar pago */}
                        {!pagado && (
                          <button
                            onClick={() => setPagosItem(f)}
                            title="Registrar pago"
                            className="p-1.5 rounded-lg text-gray-300 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                            </svg>
                          </button>
                        )}
                        {/* Ver pagos si ya tiene */}
                        {pagado && (f.pagos?.length > 0) && (
                          <button
                            onClick={() => setPagosItem(f)}
                            title="Ver pagos"
                            className="p-1.5 rounded-lg text-gray-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                            </svg>
                          </button>
                        )}
                        <button onClick={() => setEditing(f)} title="Editar" className="p-1.5 rounded-lg text-gray-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button onClick={() => setConfirmDelete(f)} title="Eliminar" className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modales */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Nueva factura" size="lg">
        <FacturaForm clients={clients} onSubmit={handleCreate} onCancel={() => setShowForm(false)} loading={createFactura.isPending} />
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar factura" size="lg">
        {editing && <FacturaForm initial={editing} clients={clients} onSubmit={handleUpdate} onCancel={() => setEditing(null)} loading={updateFactura.isPending} />}
      </Modal>
      <Modal open={!!pagosItem} onClose={() => setPagosItem(null)} title={`Pagos — ${pagosItem?.numero_factura || ''}`} size="md">
        {pagosItem && <PagosModal item={pagosItem} tipo="ingreso" onClose={() => setPagosItem(null)} />}
      </Modal>
      <ConfirmDialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete}
        title="Eliminar factura" message={`¿Eliminar la factura ${confirmDelete?.numero_factura}?`} confirmLabel="Eliminar" danger />
    </div>
  )
}

// ── Tab: Egresos ──────────────────────────────────────────────────────────────

function TabEgresos() {
  const [filterEstado, setFilterEstado]       = useState('')
  const [filterCategoria, setFilterCategoria] = useState('')
  const [filterDesde,   setFilterDesde]       = useState(MONTH_FIRST)
  const [filterHasta,   setFilterHasta]       = useState(MONTH_LAST)
  const [showForm, setShowForm]   = useState(false)
  const [editing, setEditing]     = useState(null)
  const [pagosItem, setPagosItem] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const { data: egresosData, isLoading } = useEgresos({
    estado:      filterEstado    || undefined,
    categoria:   filterCategoria || undefined,
    fecha_desde: filterDesde     || undefined,
    fecha_hasta: filterHasta     || undefined,
  })
  const { data: resumen } = useEgresoResumen()

  const createEgreso = useCreateEgreso()
  const updateEgreso = useUpdateEgreso()
  const deleteEgreso = useDeleteEgreso()

  const egresos = egresosData?.results || egresosData || []

  const handleCreate = async (data) => { await createEgreso.mutateAsync(data); setShowForm(false) }
  const handleUpdate = async (data) => { await updateEgreso.mutateAsync({ id: editing.id, ...data }); setEditing(null) }
  const handleDelete = async () => { await deleteEgreso.mutateAsync(confirmDelete.id); setConfirmDelete(null) }

  return (
    <div className="space-y-5">
      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Total Egresos" value={formatGS(resumen?.total_egresado)} sub={`${resumen?.count_total || 0} egresos`} color="purple" />
        <SummaryCard label="Pagado" value={formatGS(resumen?.total_pagado)} sub={`${resumen?.count_pagado || 0} egresos`} color="green" />
        <SummaryCard label="Pendiente / Parcial" value={formatGS(resumen?.total_pendiente)} sub={`${resumen?.count_pendiente || 0} egresos`} color="amber" />
        <SummaryCard label="Vencidos" value={resumen?.count_vencidas || 0} sub="sin pagar y vencidos" color="red" />
      </div>

      {/* Cabecera + filtros */}
      <div className="flex flex-wrap items-end gap-3 justify-between">
        <div className="flex gap-3 flex-wrap items-end">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Desde</label>
            <input type="date" value={filterDesde} onChange={e => setFilterDesde(e.target.value)} className="input text-sm py-1.5 w-36" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Hasta</label>
            <input type="date" value={filterHasta} onChange={e => setFilterHasta(e.target.value)} className="input text-sm py-1.5 w-36" />
          </div>
          <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} className="input text-sm py-1.5 pr-8 w-auto">
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="parcial">Pago parcial</option>
            <option value="pagado">Pagado</option>
          </select>
          <select value={filterCategoria} onChange={e => setFilterCategoria(e.target.value)} className="input text-sm py-1.5 pr-8 w-auto">
            <option value="">Todas las categorías</option>
            {Object.entries(CATEGORIA_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          {(filterEstado || filterCategoria || filterDesde !== MONTH_FIRST || filterHasta !== MONTH_LAST) && (
            <button onClick={() => { setFilterEstado(''); setFilterCategoria(''); setFilterDesde(MONTH_FIRST); setFilterHasta(MONTH_LAST) }} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-2 pb-1.5">
              Limpiar
            </button>
          )}
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowForm(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nuevo egreso
        </button>
      </div>

      {/* Tabla */}
      {isLoading ? <PageSpinner /> : egresos.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <svg className="mx-auto mb-3 opacity-30" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          <p className="font-medium">No hay egresos</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Fecha</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Descripción</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Proveedor</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Categoría</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Estado</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">Total</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">Pagado</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">Saldo</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Atraso</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {egresos.map(e => {
                const pagado = e.estado === 'pagado'
                const saldo = e.saldo_pendiente ?? (e.monto - (e.monto_pagado || 0))
                return (
                  <tr key={e.id} className="bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(e.fecha)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100 max-w-[160px]">
                      <span className="truncate block">{e.descripcion}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-[120px]">
                      <span className="truncate block">{e.proveedor || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{CATEGORIA_LABEL[e.categoria] || e.categoria}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ESTADO_EGR[e.estado]?.cls}`}>
                        {ESTADO_EGR[e.estado]?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">{formatGS(e.monto)}</td>
                    <td className="px-4 py-3 text-right text-green-700 dark:text-green-400 font-medium whitespace-nowrap">{formatGS(e.monto_pagado || 0)}</td>
                    <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${saldo > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'}`}>
                      {saldo > 0 ? formatGS(saldo) : '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap"><AtrasoBadge dias={e.dias_atraso} pagado={pagado} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        {!pagado && (
                          <button onClick={() => setPagosItem(e)} title="Registrar pago" className="p-1.5 rounded-lg text-gray-300 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                            </svg>
                          </button>
                        )}
                        {pagado && (e.pagos?.length > 0) && (
                          <button onClick={() => setPagosItem(e)} title="Ver pagos" className="p-1.5 rounded-lg text-gray-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                            </svg>
                          </button>
                        )}
                        <button onClick={() => setEditing(e)} title="Editar" className="p-1.5 rounded-lg text-gray-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button onClick={() => setConfirmDelete(e)} title="Eliminar" className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modales */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Nuevo egreso" size="lg">
        <EgresoForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} loading={createEgreso.isPending} />
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar egreso" size="lg">
        {editing && <EgresoForm initial={editing} onSubmit={handleUpdate} onCancel={() => setEditing(null)} loading={updateEgreso.isPending} />}
      </Modal>
      <Modal open={!!pagosItem} onClose={() => setPagosItem(null)} title={`Pagos — ${pagosItem?.descripcion || ''}`} size="md">
        {pagosItem && <PagosModal item={pagosItem} tipo="egreso" onClose={() => setPagosItem(null)} />}
      </Modal>
      <ConfirmDialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete}
        title="Eliminar egreso" message={`¿Eliminar el egreso "${confirmDelete?.descripcion}"?`} confirmLabel="Eliminar" danger />
    </div>
  )
}

// ── Tab: Consolidado ─────────────────────────────────────────────────────────

function TabConsolidado() {
  const [filterDesde, setFilterDesde] = useState(MONTH_FIRST)
  const [filterHasta, setFilterHasta] = useState(MONTH_LAST)
  const { data, isLoading } = useConsolidado({
    fecha_desde: filterDesde || undefined,
    fecha_hasta: filterHasta || undefined,
  })

  const resumen = data?.resumen || {}
  const iva = data?.iva || {}
  const evolucion = data?.evolucion_mensual || []
  const topClientes = data?.top_clientes || []
  const topProveedores = data?.top_proveedores || []
  const porCategoria = (data?.egresos_por_categoria || []).map((r, i) => ({
    name: CATEGORIA_LABEL[r.categoria] || r.categoria,
    value: r.total,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }))

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-lg text-xs">
        <p className="font-semibold text-gray-600 dark:text-gray-300 mb-1">{label}</p>
        {payload.map(p => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: {formatGS(p.value)}
          </p>
        ))}
      </div>
    )
  }

  if (isLoading) return <PageSpinner />

  return (
    <div className="space-y-6">
      {/* Filtros de fecha */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Desde</label>
          <input type="date" value={filterDesde} onChange={e => setFilterDesde(e.target.value)} className="input text-sm py-1.5 w-36" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Hasta</label>
          <input type="date" value={filterHasta} onChange={e => setFilterHasta(e.target.value)} className="input text-sm py-1.5 w-36" />
        </div>
        {(filterDesde !== MONTH_FIRST || filterHasta !== MONTH_LAST) && (
          <button onClick={() => { setFilterDesde(MONTH_FIRST); setFilterHasta(MONTH_LAST) }} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 pb-1.5">
            Mes actual
          </button>
        )}
      </div>

      {/* Resumen principal */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {/* Fila ingresos */}
        <SummaryCard
          label="Total Ingresos Bruto"
          value={formatGS(resumen.total_bruto_ingresos)}
          sub={`Neto sin IVA: ${formatGS(resumen.neto_ingresos)}`}
          color="green"
        />
        <SummaryCard
          label="Total Cobrado"
          value={formatGS(resumen.total_cobrado)}
          sub={`${resumen.pct_cobrado || 0}% del total facturado`}
          color="blue"
        />
        <SummaryCard
          label="Margen Neto"
          value={formatGS(resumen.margen_neto)}
          color={resumen.margen_neto >= 0 ? 'blue' : 'red'}
        />
        {/* Fila egresos */}
        <SummaryCard
          label="Total Egresos Bruto"
          value={formatGS(resumen.total_bruto_egresos)}
          sub={`Neto sin IVA: ${formatGS(resumen.neto_egresos)}`}
          color="red"
        />
        <SummaryCard
          label="Total Pagado"
          value={formatGS(resumen.total_pagado)}
          sub={`${resumen.pct_pagado || 0}% del total egresado`}
          color="purple"
        />
        <SummaryCard
          label="% Egreso / Ingreso"
          value={`${resumen.pct_egreso || 0}%`}
          sub={resumen.pct_egreso > 80 ? '⚠ Alto porcentaje de egreso' : undefined}
          color={resumen.pct_egreso > 80 ? 'red' : 'amber'}
        />
      </div>

      {/* IVA */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">IVA estimado (10% incluido)</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">IVA Ingresos</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatGS(iva.iva_ingresos)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">IVA Egresos</p>
            <p className="text-lg font-bold text-red-500 dark:text-red-400">{formatGS(iva.iva_egresos)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">IVA a pagar (SET)</p>
            <p className={`text-lg font-bold ${iva.diferencia >= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'}`}>
              {formatGS(iva.diferencia)}
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-400">* Cálculo estimativo basado en IVA 10% incluido en todos los montos cobrados/pagados.</p>
      </div>

      {/* Evolución mensual */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Evolución mensual — últimos 12 meses</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={evolucion} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} />
            <YAxis tickFormatter={v => v >= 1_000_000 ? `${(v/1_000_000).toFixed(0)}M` : v.toLocaleString()} tick={{ fontSize: 10, fill: '#9ca3af' }} width={60} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="ingresos" name="Ingresos" fill="#22c55e" radius={[4,4,0,0]} />
            <Bar dataKey="egresos"  name="Egresos"  fill="#ef4444" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gráficos inferiores + tablas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie: egresos por categoría */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Egresos por categoría</h3>
          {porCategoria.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Sin egresos registrados</p>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={porCategoria} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${(percent*100).toFixed(0)}%`} labelLine={false}>
                    {porCategoria.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatGS(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-full grid grid-cols-2 gap-1">
                {porCategoria.map((c, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c.color }} />
                    <span className="truncate">{c.name}</span>
                    <span className="ml-auto font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">{formatGS(c.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Top clientes */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Mejores clientes por ingresos</h3>
          {topClientes.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Sin datos</p>
          ) : (
            <div className="space-y-2">
              {topClientes.map((c, i) => {
                const pct = resumen.total_ingresos > 0 ? (c.total / resumen.total_ingresos * 100).toFixed(0) : 0
                return (
                  <div key={c.id} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-300 dark:text-gray-600 w-4">{i+1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-xs font-medium text-gray-800 dark:text-gray-100 truncate">{c.nombre}</span>
                        <span className="text-xs font-bold text-green-700 dark:text-green-400 ml-2 whitespace-nowrap">{formatGS(c.total)}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top egresos por proveedor */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Egresos por proveedor / concepto</h3>
        {topProveedores.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Sin datos</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">#</th>
                  <th className="pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Proveedor</th>
                  <th className="pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Categoría</th>
                  <th className="pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">Total</th>
                  <th className="pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {topProveedores.map((p, i) => {
                  const pct = resumen.total_egresos > 0 ? (p.total / resumen.total_egresos * 100).toFixed(1) : 0
                  return (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                      <td className="py-2 text-xs text-gray-400 pr-2">{i+1}</td>
                      <td className="py-2 font-medium text-gray-800 dark:text-gray-100">{p.proveedor}</td>
                      <td className="py-2 text-gray-500 dark:text-gray-400">{CATEGORIA_LABEL[p.categoria] || p.categoria}</td>
                      <td className="py-2 text-right font-bold text-red-600 dark:text-red-400">{formatGS(p.total)}</td>
                      <td className="py-2 text-right text-xs text-gray-400">{pct}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function Facturas() {
  const [tab, setTab] = useState('ingresos')

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Facturación</h1>
        <p className="text-sm text-gray-400 mt-0.5">Ingresos, egresos y pagos parciales</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100 dark:border-gray-900">
        {[
          { key: 'ingresos',    label: 'Ingresos (Facturas)' },
          { key: 'egresos',     label: 'Egresos' },
          { key: 'consolidado', label: 'Consolidado' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              'px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px',
              tab === t.key
                ? 'text-wolf-700 dark:text-wolf-300 border-wolf-600'
                : 'text-gray-500 dark:text-gray-500 border-transparent hover:text-gray-800 dark:hover:text-gray-200'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'ingresos'    && <TabIngresos />}
      {tab === 'egresos'     && <TabEgresos />}
      {tab === 'consolidado' && <TabConsolidado />}
    </div>
  )
}
