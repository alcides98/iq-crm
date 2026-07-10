import { useState } from 'react'
import { SelectField, InputField, TextareaField } from '@/components/ui/FormField'
import { useUsers } from '@/hooks/useUsers'
import { useProjects } from '@/hooks/useTasks'
import { useDeals } from '@/hooks/usePipeline'
import clsx from 'clsx'

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'in_progress', label: 'En Proceso' },
  { value: 'waiting', label: 'En Espera' },
  { value: 'completed', label: 'Finalizado' },
  { value: 'cancelled', label: 'Cancelado' },
]

const PRIORITY_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
]

export default function TaskForm({ initial = {}, onSubmit, onCancel, loading, fixedProject, fixedDeal }) {
  const isNew = !initial.id

  const [form, setForm] = useState({
    name: initial.name || '',
    project: fixedProject ?? (initial.project || ''),
    deal: fixedDeal ?? (initial.deal || ''),
    assigned_to: initial.assigned_to || '',
    priority: initial.priority || 'normal',
    status: initial.status || 'pending',
    start_date: initial.start_date || '',
    due_date: initial.due_date || '',
    estimated_hours: initial.estimated_hours || '',
    progress_percent: initial.progress_percent ?? 0,
    notes: initial.notes || '',
    document_link: initial.document_link || '',
  })
  const [errors, setErrors] = useState({})

  // Checklist para nueva tarea
  const [checklistItems, setChecklistItems] = useState([])
  const [newItemText, setNewItemText] = useState('')

  const { data: users = [] } = useUsers()
  const { data: projectsData } = useProjects()
  const { data: dealsData } = useDeals()

  const projects = projectsData?.results || projectsData || []
  const deals = dealsData?.results || dealsData || []

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const addChecklistItem = () => {
    if (!newItemText.trim()) return
    setChecklistItems(items => [...items, newItemText.trim()])
    setNewItemText('')
  }

  const removeChecklistItem = (i) => {
    setChecklistItems(items => items.filter((_, idx) => idx !== i))
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'El nombre es obligatorio'
    return e
  }

  const handleSubmit = (ev) => {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    const payload = { ...form }
    if (!payload.project) delete payload.project
    if (!payload.deal) delete payload.deal
    if (!payload.assigned_to) delete payload.assigned_to
    if (!payload.start_date) delete payload.start_date
    if (!payload.due_date) delete payload.due_date
    if (!payload.estimated_hours) delete payload.estimated_hours
    if (isNew) delete payload.progress_percent
    onSubmit(payload, isNew ? checklistItems : [])
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <InputField
        label="Nombre de la tarea"
        value={form.name}
        onChange={set('name')}
        error={errors.name}
        placeholder="Ej: Preparar materiales del taller"
        required
      />

      <div className="grid grid-cols-2 gap-3">
        {!fixedDeal && (
          <div>
            <label className="label">Negociación vinculada</label>
            <select className="input" value={form.deal} onChange={set('deal')}>
              <option value="">Sin negociación</option>
              {deals.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        )}

        {!fixedProject && (
          <div className={fixedDeal ? 'col-span-2' : ''}>
            <label className="label">Proyecto</label>
            <select className="input" value={form.project} onChange={set('project')}>
              <option value="">Sin proyecto</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}
      </div>

      <div>
        <label className="label">Asignado a</label>
        <select className="input" value={form.assigned_to} onChange={set('assigned_to')}>
          <option value="">Sin asignar</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <SelectField label="Prioridad" value={form.priority} onChange={set('priority')}>
          {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </SelectField>
        <SelectField label="Estado" value={form.status} onChange={set('status')}>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </SelectField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <InputField label="Fecha inicio" type="date" value={form.start_date} onChange={set('start_date')} />
        <InputField label="Fecha vencimiento" type="date" value={form.due_date} onChange={set('due_date')} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <InputField
          label="Horas estimadas"
          type="number"
          min="0"
          step="0.5"
          value={form.estimated_hours}
          onChange={set('estimated_hours')}
          placeholder="0"
        />
        {!isNew && (
          <div>
            <label className="label">Progreso: {form.progress_percent}%</label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              className="w-full accent-wolf-600 mt-2"
              value={form.progress_percent}
              onChange={set('progress_percent')}
            />
          </div>
        )}
        {isNew && (
          <div className="flex items-end pb-1">
            <p className="text-xs text-gray-400 dark:text-gray-600 leading-snug">
              El progreso se calcula automáticamente desde el checklist
            </p>
          </div>
        )}
      </div>

      <InputField
        label="Enlace de documentación (Google Drive u otro)"
        type="text"
        value={form.document_link}
        onChange={set('document_link')}
        placeholder="https://drive.google.com/..."
      />

      <TextareaField
        label="Notas"
        value={form.notes}
        onChange={set('notes')}
        rows={2}
        placeholder="Detalles adicionales..."
      />

      {/* Checklist — solo para tareas nuevas */}
      {isNew && (
        <div className="border border-gray-100 dark:border-gray-800 rounded-xl p-4 space-y-3 bg-gray-50 dark:bg-surface-dark-secondary">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            Checklist de actividades
            {checklistItems.length > 0 && (
              <span className="text-xs font-normal text-wolf-600 dark:text-wolf-400 bg-wolf-50 dark:bg-wolf-900/20 px-2 py-0.5 rounded-full">
                {checklistItems.length} ítem{checklistItems.length !== 1 ? 's' : ''}
              </span>
            )}
          </p>

          {checklistItems.length > 0 && (
            <ul className="space-y-1.5">
              {checklistItems.map((item, i) => (
                <li key={i} className="flex items-center gap-2.5 group">
                  <span className="w-4 h-4 rounded border-2 border-gray-300 dark:border-gray-700 flex-shrink-0" />
                  <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{item}</span>
                  <button
                    type="button"
                    onClick={() => removeChecklistItem(i)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 dark:text-gray-700 hover:text-red-500 transition-all rounded"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              className="input flex-1 py-1.5 text-sm"
              value={newItemText}
              onChange={e => setNewItemText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addChecklistItem() } }}
              placeholder="Descripción del ítem... (Enter para agregar)"
            />
            <button
              type="button"
              onClick={addChecklistItem}
              className="btn-secondary text-xs px-3 flex-shrink-0"
            >
              + Agregar
            </button>
          </div>

          {checklistItems.length === 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-600 italic">
              Agregá ítems al checklist — el progreso se calculará automáticamente al completarlos
            </p>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary flex-1" disabled={loading}>
          {loading ? 'Guardando...' : (initial.id ? 'Guardar cambios' : 'Crear tarea')}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
