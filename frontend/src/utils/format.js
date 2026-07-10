export function formatGS(amount) {
  if (!amount && amount !== 0) return '₲ 0'
  const num = parseInt(amount)
  if (num >= 1_000_000_000) return `₲ ${(num / 1_000_000_000).toFixed(1)}B`
  if (num >= 1_000_000) return `₲ ${(num / 1_000_000).toFixed(1)}M`
  return `₲ ${num.toLocaleString('es-PY')}`
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

export function validateRUC(ruc) {
  const clean = ruc.replace(/[-\s]/g, '')
  if (!/^\d{1,8}\d$/.test(clean)) return false
  const digits = clean.slice(0, -1)
  const check = parseInt(clean.slice(-1))
  let base = 2
  let total = 0
  for (let i = digits.length - 1; i >= 0; i--) {
    total += parseInt(digits[i]) * base
    base = base < 9 ? base + 1 : 2
  }
  const remainder = 11 - (total % 11)
  const expected = remainder >= 10 ? 0 : remainder
  return expected === check
}

export const PHASE_CONFIG = {
  nueva: { label: 'Nueva', color: 'blue', prob: 10 },
  diagnostico: { label: 'Diagnóstico', color: 'amber', prob: 30 },
  propuesta: { label: 'Propuesta', color: 'orange', prob: 60 },
  replanteo: { label: 'Replanteo', color: 'purple', prob: 75 },
  perdida: { label: 'Perdida', color: 'red', prob: 0 },
  ganada: { label: 'Ganada', color: 'green', prob: 100 },
}

export const PHASE_COLORS = {
  blue: 'bg-blue-100 text-blue-800 border-blue-200',
  amber: 'bg-amber-100 text-amber-800 border-amber-200',
  orange: 'bg-orange-100 text-orange-800 border-orange-200',
  purple: 'bg-purple-100 text-purple-800 border-purple-200',
  red: 'bg-red-100 text-red-800 border-red-200',
  green: 'bg-green-100 text-green-800 border-green-200',
}
