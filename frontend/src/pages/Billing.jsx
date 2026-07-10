import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { PageSpinner } from '@/components/ui/Spinner'
import PaymentForm from '@/components/billing/PaymentForm'
import InstallmentPanel from '@/components/billing/InstallmentPanel'
import { usePayments, useCreatePayment } from '@/hooks/useBilling'
import { formatGS, formatDate } from '@/utils/format'

const STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-600',
  partial: 'bg-amber-100 text-amber-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
}
const STATUS_LABELS = {
  pending: 'Pendiente', partial: 'Parcial', paid: 'Cobrado', overdue: 'Vencido',
}
const METHOD_LABELS = {
  efectivo: 'Efectivo', transferencia: 'Transferencia',
  cheque: 'Cheque', tarjeta: 'Tarjeta', cuotas: 'Cuotas',
}

export default function Billing() {
  const [formOpen, setFormOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState(null)

  const { data, isLoading } = usePayments()
  const createPayment = useCreatePayment()

  const payments = data?.results || data || []

  const handleCreate = (formData) => {
    createPayment.mutate(formData, { onSuccess: () => setFormOpen(false) })
  }

  return (
    <div className="flex gap-4 h-full">
      {/* Lista de cobros */}
      <div className="flex-1 min-w-0 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            {payments.filter(p => p.status === 'overdue').length > 0 && (
              <span className="badge bg-red-100 text-red-700">
                {payments.filter(p => p.status === 'overdue').length} vencido(s)
              </span>
            )}
          </div>
          <button className="btn-primary" onClick={() => setFormOpen(true)}>
            + Nuevo cobro
          </button>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Negociación</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Total</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Cobrado</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Pendiente</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Método</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Cuotas</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="py-12"><PageSpinner /></td></tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    Sin cobros registrados — creá el primero al ganar una negociación
                  </td>
                </tr>
              ) : payments.map(p => (
                <tr
                  key={p.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${selectedPayment?.id === p.id ? 'bg-wolf-50' : ''}`}
                  onClick={() => setSelectedPayment(selectedPayment?.id === p.id ? null : p)}
                >
                  <td className="px-4 py-3 font-medium text-gray-900">{p.deal_name}</td>
                  <td className="px-4 py-3 text-gray-700">{formatGS(p.total_amount)}</td>
                  <td className="px-4 py-3 text-green-700 font-medium">{formatGS(p.paid_amount)}</td>
                  <td className="px-4 py-3 text-amber-700">{formatGS(p.pending_amount)}</td>
                  <td className="px-4 py-3 text-gray-500">{METHOD_LABELS[p.method] || p.method}</td>
                  <td className="px-4 py-3 text-gray-500 text-center">{p.installments_count}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${STATUS_COLORS[p.status] || ''}`}>
                      {STATUS_LABELS[p.status] || p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {payments.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400 flex gap-4">
              <span>{payments.length} cobro(s)</span>
              <span>Total: {formatGS(payments.reduce((s, p) => s + parseInt(p.total_amount || 0), 0))}</span>
              <span className="text-green-700">
                Cobrado: {formatGS(payments.reduce((s, p) => s + parseInt(p.paid_amount || 0), 0))}
              </span>
              <span className="text-amber-700">
                Pendiente: {formatGS(payments.reduce((s, p) => s + parseInt(p.pending_amount || 0), 0))}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Panel de cuotas */}
      {selectedPayment && (
        <div className="w-[380px] flex-shrink-0 card overflow-hidden self-start sticky top-0 max-h-screen overflow-y-auto">
          <InstallmentPanel
            payment={selectedPayment}
            onClose={() => setSelectedPayment(null)}
          />
        </div>
      )}

      {/* Modal nuevo cobro */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Nuevo cobro"
        size="md"
      >
        <PaymentForm
          onSubmit={handleCreate}
          onCancel={() => setFormOpen(false)}
          loading={createPayment.isPending}
        />
      </Modal>
    </div>
  )
}
