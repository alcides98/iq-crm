import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { InputField, SelectField, TextareaField } from '@/components/ui/FormField'
import { useCreateClient } from '@/hooks/useClients'
import { useUsers } from '@/hooks/useUsers'
import api from '@/services/api'

const EMPTY = {
  name: '', client: '', service_type: '', priority: 'normal', assigned_to: '',
  estimated_close_date: '', next_followup: '', initial_need: '', notes: '',
  document_link: '',
}

// Mini-formulario inline para crear cliente rápido
function QuickClientModal({ onCreated, onClose }) {
  const [form, setForm] = useState({
    client_type: 'empresa', company_name: '', contact_name: '', phone: '', source: 'otro',
  })
  const [errors, setErrors] = useState({})
  const createClient = useCreateClient()

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.company_name.trim()) errs.company_name = 'Requerido'
    if (!form.contact_name.trim()) errs.contact_name = 'Requerido'
    if (!form.phone.trim()) errs.phone = 'Requerido'
    if (Object.keys(errs).length) { setErrors(errs); return }
    createClient.mutate(form, {
      onSuccess: (data) => { onCreated(data); onClose() },
    })
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-gray-900">Crear cliente rápido</h4>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <SelectField label="Tipo" value={form.client_type} onChange={set('client_type')}>
            <option value="empresa">Empresa</option>
            <option value="persona">Persona Física</option>
          </SelectField>
          <InputField label="Razón social / Nombre completo" required value={form.company_name}
            onChange={set('company_name')} error={errors.company_name} />
          <InputField label="Nombre de contacto" required value={form.contact_name}
            onChange={set('contact_name')} error={errors.contact_name} />
          <InputField label="Teléfono" required value={form.phone}
            onChange={set('phone')} error={errors.phone} placeholder="+595 21 ..." />
          <SelectField label="Origen" value={form.source} onChange={set('source')}>
            <option value="referido">Referido</option>
            <option value="linkedin">LinkedIn</option>
            <option value="instagram">Instagram</option>
            <option value="networking">Networking</option>
            <option value="webinar">Webinar</option>
            <option value="cliente_actual">Cliente actual</option>
            <option value="cold_call">Cold Call</option>
            <option value="evento">Evento</option>
            <option value="pagina_web">Página Web</option>
            <option value="otro">Otro</option>
          </SelectField>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1" disabled={createClient.isPending}>
              {createClient.isPending ? 'Creando...' : 'Crear cliente'}
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function DealForm({ initial = {}, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({ ...EMPTY, ...initial })
  const [errors, setErrors] = useState({})
  const [clients, setClients] = useState([])
  const [showQuickClient, setShowQuickClient] = useState(false)
  const [showTaskSection, setShowTaskSection] = useState(false)
  const [quickTask, setQuickTask] = useState({ name: '', description: '', checklist: [] })
  const [newChecklistText, setNewChecklistText] = useState('')
  const qc = useQueryClient()

  const { data: usersData } = useUsers()
  const users = usersData || []

  useEffect(() => {
    api.get('/clients/').then(r => {
      const list = r.data?.results || r.data || []
      setClients(list)
    })
  }, [])

  useEffect(() => {
    setForm({ ...EMPTY, ...initial })
    setErrors({})
  }, [initial?.id])

  const set = (field) => (e) => {
    const val = e.target ? e.target.value : e
    setForm(prev => ({ ...prev, [field]: val }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }))
  }

  const handleClientCreated = (newClient) => {
    setClients(prev => [...prev, newClient])
    setForm(prev => ({ ...prev, client: newClient.id }))
    qc.invalidateQueries({ queryKey: ['clients'] })
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Requerido'
    if (!form.client) errs.client = 'Requerido'
    if (!form.service_type) errs.service_type = 'Requerido'
    return errs
  }

  const addQuickChecklistItem = () => {
    if (!newChecklistText.trim()) return
    setQuickTask(t => ({ ...t, checklist: [...t.checklist, newChecklistText.trim()] }))
    setNewChecklistText('')
  }

  const removeQuickChecklistItem = (i) => {
    setQuickTask(t => ({ ...t, checklist: t.checklist.filter((_, idx) => idx !== i) }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    const payload = {
      name: form.name,
      client: Number(form.client),
      service_type: form.service_type,
      priority: form.priority,
      assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
      estimated_close_date: form.estimated_close_date || null,
      next_followup: form.next_followup || null,
      initial_need: form.initial_need,
      notes: form.notes,
      document_link: form.document_link,
    }
    const pendingTask = (showTaskSection && quickTask.name.trim())
      ? { ...quickTask }
      : null
    onSubmit(payload, pendingTask)
  }

  return (
    <>
      {showQuickClient && (
        <QuickClientModal
          onCreated={handleClientCreated}
          onClose={() => setShowQuickClient(false)}
        />
      )}
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <InputField
          label="Nombre de la negociación"
          required
          value={form.name}
          onChange={set('name')}
          error={errors.name}
          placeholder="Capacitación liderazgo — Empresa XYZ"
        />

        {/* Cliente con botón crear rápido */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="label mb-0">
              Cliente <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowQuickClient(true)}
              className="text-xs text-wolf-600 hover:text-wolf-700 font-medium flex items-center gap-1"
            >
              + Nuevo cliente
            </button>
          </div>
          <select
            className={`input ${errors.client ? 'border-red-400' : ''}`}
            value={form.client}
            onChange={set('client')}
          >
            <option value="">Seleccionar cliente...</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.company_name}</option>
            ))}
          </select>
          {errors.client && <p className="text-red-500 text-xs mt-1">{errors.client}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <SelectField label="Tipo de servicio" required value={form.service_type}
            onChange={set('service_type')} error={errors.service_type}>
            <option value="">Seleccionar...</option>
            <option value="capacitacion">Capacitación</option>
            <option value="coaching">Coaching</option>
            <option value="consultoria">Consultoría</option>
            <option value="conferencia">Conferencia</option>
            <option value="outdoor">Outdoor</option>
            <option value="webinar">Webinar</option>
            <option value="programa">Programa Integral</option>
            <option value="otro">Otro</option>
          </SelectField>
          <SelectField label="Prioridad" value={form.priority} onChange={set('priority')}>
            <option value="normal">Normal</option>
            <option value="alta">Alta</option>
            <option value="urgente">Urgente</option>
          </SelectField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <SelectField label="Asignado a" value={form.assigned_to} onChange={set('assigned_to')}>
            <option value="">Sin asignar</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>
            ))}
          </SelectField>
          <InputField label="Cierre estimado" type="date"
            value={form.estimated_close_date} onChange={set('estimated_close_date')} />
        </div>

        <InputField label="Próximo seguimiento" type="date"
          value={form.next_followup} onChange={set('next_followup')} />

        <TextareaField
          label="Necesidad inicial"
          value={form.initial_need}
          onChange={set('initial_need')}
          placeholder="Describí el requerimiento del cliente..."
          rows={3}
        />

        <InputField
          label="Enlace de documentación (Google Drive u otro)"
          type="url"
          value={form.document_link}
          onChange={set('document_link')}
          placeholder="https://drive.google.com/..."
        />

        <TextareaField label="Notas" value={form.notes} onChange={set('notes')} rows={2} />

        {/* Tarea inicial — solo en creación */}
        {!initial?.id && (
          <div className="border border-dashed border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowTaskSection(s => !s)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              <span className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                Agregar tarea a esta negociación
              </span>
              <span className="text-xs text-wolf-600 dark:text-wolf-400">{showTaskSection ? '▲ Ocultar' : '▼ Expandir'}</span>
            </button>

            {showTaskSection && (
              <div className="px-4 pb-4 pt-2 space-y-3 border-t border-gray-100 dark:border-gray-800">
                <div>
                  <label className="label">Nombre de la tarea <span className="text-red-500">*</span></label>
                  <input
                    className="input"
                    value={quickTask.name}
                    onChange={e => setQuickTask(t => ({ ...t, name: e.target.value }))}
                    placeholder="Ej: Preparar propuesta inicial..."
                  />
                </div>
                <div>
                  <label className="label">Descripción</label>
                  <textarea
                    className="input resize-none"
                    rows={2}
                    value={quickTask.description}
                    onChange={e => setQuickTask(t => ({ ...t, description: e.target.value }))}
                    placeholder="Detalles de la tarea..."
                  />
                </div>
                <div>
                  <label className="label">Checklist de actividades</label>
                  <ul className="space-y-1.5 mb-2">
                    {quickTask.checklist.map((item, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded border border-gray-300 dark:border-gray-700 flex-shrink-0" />
                        <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{item}</span>
                        <button
                          type="button"
                          onClick={() => removeQuickChecklistItem(i)}
                          className="text-gray-300 dark:text-gray-700 hover:text-red-500 transition-colors"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-2">
                    <input
                      className="input flex-1 py-1.5 text-sm"
                      value={newChecklistText}
                      onChange={e => setNewChecklistText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addQuickChecklistItem() } }}
                      placeholder="Nuevo ítem de checklist..."
                    />
                    <button
                      type="button"
                      onClick={addQuickChecklistItem}
                      className="btn-secondary text-xs px-3"
                    >
                      + Agregar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary min-w-[140px]" disabled={loading}>
            {loading ? 'Guardando...' : initial?.id ? 'Guardar cambios' : 'Crear negociación'}
          </button>
        </div>
      </form>
    </>
  )
}
