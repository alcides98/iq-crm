import { useState, useEffect } from 'react'
import { InputField, SelectField, TextareaField } from '@/components/ui/FormField'
import { useDeals } from '@/hooks/usePipeline'
import { formatGS } from '@/utils/format'

const METHOD_OPTIONS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'cuotas', label: 'Cuotas' },
]

export default function PaymentForm({ onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    deal: '',
    total_amount: '',
    method: 'transferencia',
    installments_count: 1,
    notes: '',
  })
  const [errors, setErrors] = useState({})

  const { data: dealsData } = useDeals({ phase: 'ganada' })
  const deals = dealsData?.results || dealsData || []

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  useEffect(() => {
    if (form.deal) {
      const deal = deals.find(d => d.id === parseInt(form.deal))
      if (deal) setForm(f => ({ ...f, total_amount: deal.amount }))
    }
  }, [form.deal])

  const validate = () => {
    const e = {}
    if (!form.deal) e.deal = 'Seleccioná una negociación'
    if (!form.total_amount) e.total_amount = 'Ingresá el monto'
    if (!form.method) e.method = 'Seleccioná el método'
    return e
  }

  const handleSubmit = (ev) => {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    onSubmit({
      deal: parseInt(form.deal),
      total_amount: parseInt(form.total_amount),
      method: form.method,
      installments_count: parseInt(form.installments_count) || 1,
      notes: form.notes,
    })
  }

  const count = parseInt(form.installments_count) || 1
  const perInstallment = form.total_amount ? Math.floor(parseInt(form.total_amount) / count) : null

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Negociación ganada <span className="text-red-500">*</span></label>
        <select className={`input ${errors.deal ? 'border-red-400' : ''}`} value={form.deal} onChange={set('deal')}>
          <option value="">Seleccioná una negociación...</option>
          {deals.map(d => (
            <option key={d.id} value={d.id}>
              {d.name} — {d.client_name} ({formatGS(d.amount)})
            </option>
          ))}
        </select>
        {errors.deal && <p className="text-red-500 text-xs mt-1">{errors.deal}</p>}
        {deals.length === 0 && (
          <p className="text-xs text-amber-600 mt-1">No hay negociaciones ganadas sin cobro asignado.</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <InputField
          label="Monto total (₲)"
          type="number"
          value={form.total_amount}
          onChange={set('total_amount')}
          error={errors.total_amount}
          placeholder="0"
          required
        />
        <SelectField
          label="Método de pago"
          value={form.method}
          onChange={set('method')}
          error={errors.method}
          required
        >
          {METHOD_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </SelectField>
      </div>

      <div>
        <InputField
          label="Cantidad de cuotas"
          type="number"
          min="1"
          max="24"
          value={form.installments_count}
          onChange={set('installments_count')}
        />
        {count > 1 && perInstallment && (
          <p className="text-xs text-gray-500 mt-1">
            Se generarán {count} cuotas de aprox. {formatGS(perInstallment)} cada una, con vencimiento mensual.
          </p>
        )}
        {count === 1 && (
          <p className="text-xs text-gray-500 mt-1">Se generará 1 cuota con vencimiento en 30 días.</p>
        )}
      </div>

      <TextareaField
        label="Notas"
        value={form.notes}
        onChange={set('notes')}
        rows={2}
        placeholder="Acuerdos de pago, condiciones especiales..."
      />

      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary flex-1" disabled={loading}>
          {loading ? 'Creando...' : 'Crear cobro'}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
