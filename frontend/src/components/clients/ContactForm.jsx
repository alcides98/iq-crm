import { useState } from 'react'
import { InputField, TextareaField } from '@/components/ui/FormField'

export default function ContactForm({ onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({ name: '', position: '', phone: '', email: '', notes: '' })
  const [errors, setErrors] = useState({})

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setErrors({ name: 'Requerido' }); return }
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <InputField label="Nombre" required value={form.name} onChange={set('name')} error={errors.name} placeholder="Laura Martínez" />
      <div className="grid grid-cols-2 gap-4">
        <InputField label="Cargo" value={form.position} onChange={set('position')} placeholder="Directora Comercial" />
        <InputField label="Teléfono" value={form.phone} onChange={set('phone')} placeholder="0981 000 000" />
      </div>
      <InputField label="Email" type="email" value={form.email} onChange={set('email')} placeholder="laura@empresa.com" />
      <TextareaField label="Notas" value={form.notes} onChange={set('notes')} rows={2} />
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Guardando...' : 'Agregar contacto'}
        </button>
      </div>
    </form>
  )
}
