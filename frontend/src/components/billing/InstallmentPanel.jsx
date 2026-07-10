import clsx from 'clsx'
import { useInstallments, useMarkInstallmentPaid, useUpdateInstallment } from '@/hooks/useBilling'
import { formatGS, formatDate } from '@/utils/format'
import { PageSpinner } from '@/components/ui/Spinner'

const STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-600',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
}
const STATUS_LABELS = { pending: 'Pendiente', paid: 'Cobrado', overdue: 'Vencido' }

const PAYMENT_STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-700',
  partial: 'bg-amber-100 text-amber-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
}
const PAYMENT_STATUS_LABELS = { pending: 'Pendiente', partial: 'Parcial', paid: 'Cobrado', overdue: 'Vencido' }

export default function InstallmentPanel({ payment, onClose }) {
  const { data: instData, isLoading } = useInstallments(payment?.id)
  const markPaid = useMarkInstallmentPaid()
  const updateInst = useUpdateInstallment()

  const installments = instData?.results || instData || []

  if (!payment) return null

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold text-gray-900">{payment.deal_name}</h4>
            <p className="text-sm text-gray-500 mt-0.5 capitalize">{payment.method}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-3">
          <div className="text-center">
            <p className="text-xs text-gray-400">Total</p>
            <p className="font-semibold text-gray-900 text-sm">{formatGS(payment.total_amount)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">Cobrado</p>
            <p className="font-semibold text-green-700 text-sm">{formatGS(payment.paid_amount)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">Pendiente</p>
            <p className="font-semibold text-amber-700 text-sm">{formatGS(payment.pending_amount)}</p>
          </div>
        </div>

        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-wolf-600 h-2 rounded-full transition-all"
              style={{ width: `${payment.total_amount ? Math.round(payment.paid_amount / payment.total_amount * 100) : 0}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className={`badge text-xs ${PAYMENT_STATUS_COLORS[payment.status] || ''}`}>
            {PAYMENT_STATUS_LABELS[payment.status] || payment.status}
          </span>
          <span className="text-xs text-gray-400">
            {installments.filter(i => i.status === 'paid').length}/{installments.length} cuotas cobradas
          </span>
        </div>
      </div>

      {/* Installment list */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Cuotas</p>

        {isLoading ? (
          <PageSpinner />
        ) : installments.length === 0 ? (
          <p className="text-sm text-gray-400 italic text-center py-6">Sin cuotas registradas</p>
        ) : (
          <div className="space-y-2">
            {installments.map(inst => {
              const isOverdueByDate = inst.status === 'pending' && inst.due_date < today
              return (
                <div
                  key={inst.id}
                  className={clsx(
                    'rounded-xl border p-3',
                    inst.status === 'paid' ? 'border-green-200 bg-green-50' :
                    isOverdueByDate || inst.status === 'overdue' ? 'border-red-200 bg-red-50' :
                    'border-gray-200 bg-white'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Cuota {inst.number} — {formatGS(inst.amount)}
                      </p>
                      <p className={clsx(
                        'text-xs mt-0.5',
                        isOverdueByDate ? 'text-red-600 font-medium' : 'text-gray-400'
                      )}>
                        Vence: {formatDate(inst.due_date)}
                        {inst.paid_date && ` · Cobrado: ${formatDate(inst.paid_date)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge text-xs ${STATUS_COLORS[inst.status] || ''}`}>
                        {STATUS_LABELS[inst.status] || inst.status}
                      </span>
                      {inst.status === 'pending' && (
                        <button
                          className="btn-primary text-xs py-1 px-3"
                          disabled={markPaid.isPending}
                          onClick={() => markPaid.mutate({ id: inst.id, paymentId: payment.id })}
                        >
                          Cobrar
                        </button>
                      )}
                      {inst.status === 'pending' && isOverdueByDate && (
                        <button
                          className="text-xs text-red-600 hover:underline"
                          onClick={() => updateInst.mutate({ id: inst.id, paymentId: payment.id, status: 'overdue' })}
                        >
                          Marcar vencida
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
