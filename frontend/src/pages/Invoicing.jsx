import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import { formatGS } from '@/utils/format'

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-red-50 text-red-400',
}

export default function Invoicing() {
  const { data, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => api.get('/invoicing/invoices/').then(r => r.data),
  })

  const invoices = data?.results || data || []

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="btn-primary">+ Nueva factura</button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Número</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Cliente</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Tipo</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Total</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">Cargando...</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">Sin facturas</td></tr>
            ) : invoices.map(inv => (
              <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-gray-700">{inv.number || `#${inv.id}`}</td>
                <td className="px-4 py-3 text-gray-900">{inv.client_name}</td>
                <td className="px-4 py-3 text-gray-500 capitalize">{inv.invoice_type}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{formatGS(inv.amount_total)}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${STATUS_COLORS[inv.status] || ''}`}>
                    {inv.status_display || inv.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {inv.status === 'draft' && (
                      <button className="text-xs text-wolf-600 hover:underline">Enviar SIFEN</button>
                    )}
                    {inv.kude_url && (
                      <a href={inv.kude_url} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:underline">KUDE</a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
