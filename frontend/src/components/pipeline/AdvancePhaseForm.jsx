import { useState } from 'react'
import { InputField, SelectField, TextareaField } from '@/components/ui/FormField'
import { PHASE_CONFIG, formatGS } from '@/utils/format'

const REQUIRED_BY_PHASE = {
  diagnostico: ['initial_need', 'next_followup'],
  propuesta:   ['diagnosis_notes', 'next_followup', 'amount'],
  replanteo:   ['amount', 'next_followup'],
  perdida:     ['loss_reason'],
  ganada:      ['amount', 'actual_close_date'],
}

const FIELD_LABELS = {
  initial_need: 'Necesidad inicial',
  next_followup: 'Próximo seguimiento',
  diagnosis_notes: 'Notas de diagnóstico',
  proposal_link: 'Link a la propuesta',
  amount: 'Monto del servicio (₲)',
  loss_reason: 'Motivo de pérdida',
  actual_close_date: 'Fecha de cierre real',
}

export default function AdvancePhaseForm({ deal, targetPhase: initialTargetPhase, stages, onSubmit, onCancel, loading }) {
  const [selectedPhase, setSelectedPhase] = useState(initialTargetPhase || '')
  const [form, setForm] = useState({
    initial_need: deal.initial_need || '',
    next_followup: deal.next_followup || '',
    diagnosis_notes: deal.diagnosis_notes || '',
    proposal_link: deal.proposal_link || '',
    amount: deal.amount || '',
    loss_reason: deal.loss_reason || '',
    actual_close_date: deal.actual_close_date || '',
    notes: '',
  })

  const targetPhase = initialTargetPhase || selectedPhase
  const required = REQUIRED_BY_PHASE[targetPhase] || []

  // Resolve current phase info from dynamic stages or fallback to PHASE_CONFIG
  const resolveStage = (slug) => {
    if (stages?.length) {
      const s = stages.find(st => st.key === slug || st.slug === slug)
      if (s) return { label: s.label || s.name, color: s.color }
    }
    const p = PHASE_CONFIG[slug]
    return p ? { label: p.label, color: p.color } : null
  }

  const phase = resolveStage(targetPhase)
  const currentPhase = resolveStage(deal.phase)

  // Available phases: all stages except the current deal phase
  const availablePhases = stages?.length
    ? stages.filter(s => (s.key || s.slug) !== deal.phase)
    : Object.entries(PHASE_CONFIG)
        .filter(([key]) => key !== deal.phase)
        .map(([key, val]) => ({ key, ...val }))

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!targetPhase) return
    const cleaned = Object.fromEntries(
      Object.entries(form).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    )
    onSubmit({ phase: targetPhase, ...cleaned })
  }

  const isReplanteo = targetPhase === 'replanteo'
  const originalAmount = deal.amount_original || deal.amount

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
        <p className="text-sm text-gray-600">
          Cambiar fase de <strong>{deal.name}</strong>
          {phase && (
            <> → <span className={`badge bg-${phase.color}-100 text-${phase.color}-700`}>{phase.label}</span></>
          )}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          Fase actual: {currentPhase?.label || deal.phase}
        </p>
      </div>

      {/* Selector de fase destino (solo cuando no viene predefinida) */}
      {!initialTargetPhase && (
        <SelectField
          label="Fase destino"
          required
          value={selectedPhase}
          onChange={e => setSelectedPhase(e.target.value)}
        >
          <option value="">Seleccionar fase...</option>
          {availablePhases.map(p => (
            <option key={p.key || p.slug} value={p.key || p.slug}>
              {p.label || p.name}
            </option>
          ))}
        </SelectField>
      )}

      {targetPhase && required.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Campos requeridos para esta fase
          </p>
          <div className="space-y-3">
            {required.includes('initial_need') && (
              <TextareaField
                label={FIELD_LABELS.initial_need}
                required
                value={form.initial_need}
                onChange={set('initial_need')}
                placeholder="¿Cuál es la necesidad o problema del cliente?"
                rows={3}
              />
            )}
            {required.includes('diagnosis_notes') && (
              <TextareaField
                label={FIELD_LABELS.diagnosis_notes}
                required
                value={form.diagnosis_notes}
                onChange={set('diagnosis_notes')}
                placeholder="Resumen del diagnóstico realizado..."
                rows={3}
              />
            )}
            {required.includes('proposal_link') && (
              <InputField
                label={FIELD_LABELS.proposal_link}
                required
                type="url"
                value={form.proposal_link}
                onChange={set('proposal_link')}
                placeholder="https://docs.google.com/..."
              />
            )}

            {required.includes('amount') && (
              isReplanteo ? (
                <div className="space-y-2">
                  {originalAmount && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-xs text-amber-700 font-medium mb-0.5">Monto original</p>
                      <p className="text-lg font-bold text-amber-800">{formatGS(originalAmount)}</p>
                    </div>
                  )}
                  <InputField
                    label="Nuevo monto (₲ guaraníes)"
                    required
                    type="number"
                    value={form.amount}
                    onChange={set('amount')}
                    placeholder="Ingresá el monto ajustado"
                  />
                </div>
              ) : (
                <InputField
                  label={FIELD_LABELS.amount}
                  required
                  type="number"
                  value={form.amount}
                  onChange={set('amount')}
                  placeholder="Ej: 5000000"
                />
              )
            )}

            {required.includes('next_followup') && (
              <InputField
                label={FIELD_LABELS.next_followup}
                required
                type="date"
                value={form.next_followup}
                onChange={set('next_followup')}
              />
            )}
            {required.includes('loss_reason') && (
              <SelectField
                label={FIELD_LABELS.loss_reason}
                required
                value={form.loss_reason}
                onChange={set('loss_reason')}
              >
                <option value="">Seleccionar motivo...</option>
                <option value="precio">Precio</option>
                <option value="sin_presupuesto">Sin presupuesto</option>
                <option value="competencia">Competencia</option>
                <option value="falta_seguimiento">Falta de seguimiento</option>
                <option value="cancelacion">Cancelación del proyecto</option>
                <option value="no_prioridad">No era prioridad</option>
                <option value="tiempo">Tiempo</option>
                <option value="no_respondio">No respondió</option>
                <option value="otro">Otro</option>
              </SelectField>
            )}
            {required.includes('actual_close_date') && (
              <InputField
                label={FIELD_LABELS.actual_close_date}
                required
                type="date"
                value={form.actual_close_date}
                onChange={set('actual_close_date')}
              />
            )}
          </div>
        </div>
      )}

      <TextareaField
        label="Notas del cambio (opcional)"
        value={form.notes}
        onChange={set('notes')}
        placeholder="¿Qué pasó en esta etapa?"
        rows={2}
      />

      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>Cancelar</button>
        <button
          type="submit"
          className="btn-primary min-w-[160px]"
          disabled={loading || !targetPhase}
        >
          {loading ? 'Avanzando...' : phase ? `Pasar a ${phase.label}` : 'Seleccioná una fase'}
        </button>
      </div>
    </form>
  )
}