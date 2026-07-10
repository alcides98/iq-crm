import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '@/services/api'

export function usePayments() {
  return useQuery({
    queryKey: ['payments'],
    queryFn: () => api.get('/billing/payments/').then(r => r.data),
  })
}

export function usePayment(id) {
  return useQuery({
    queryKey: ['payment', id],
    queryFn: () => api.get(`/billing/payments/${id}/`).then(r => r.data),
    enabled: !!id,
  })
}

export function useInstallments(paymentId) {
  return useQuery({
    queryKey: ['installments', paymentId],
    queryFn: () => api.get(`/billing/payments/${paymentId}/installments/`).then(r => r.data),
    enabled: !!paymentId,
  })
}

export function useCreatePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.post('/billing/payments/', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] })
      qc.invalidateQueries({ queryKey: ['kpis'] })
      toast.success('Cobro creado — cuotas generadas automáticamente')
    },
    onError: (err) => {
      const msg = err.response?.data?.deal?.[0] || err.response?.data?.non_field_errors?.[0] || 'Error al crear cobro'
      toast.error(msg)
    },
  })
}

export function useUpdatePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/billing/payments/${id}/`, data).then(r => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['payments'] })
      qc.invalidateQueries({ queryKey: ['payment', data.id] })
      qc.invalidateQueries({ queryKey: ['kpis'] })
      toast.success('Cobro actualizado')
    },
    onError: () => toast.error('Error al actualizar cobro'),
  })
}

export function useMarkInstallmentPaid() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, paymentId }) =>
      api.patch(`/billing/installments/${id}/`, {
        status: 'paid',
        paid_date: new Date().toISOString().split('T')[0],
      }).then(r => r.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['installments', vars.paymentId] })
      qc.invalidateQueries({ queryKey: ['payments'] })
      qc.invalidateQueries({ queryKey: ['payment', vars.paymentId] })
      qc.invalidateQueries({ queryKey: ['kpis'] })
      toast.success('Cuota cobrada')
    },
    onError: () => toast.error('Error al registrar cobro'),
  })
}

export function useUpdateInstallment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, paymentId, ...data }) =>
      api.patch(`/billing/installments/${id}/`, data).then(r => r.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['installments', vars.paymentId] })
      qc.invalidateQueries({ queryKey: ['payments'] })
      qc.invalidateQueries({ queryKey: ['kpis'] })
      toast.success('Cuota actualizada')
    },
    onError: () => toast.error('Error al actualizar cuota'),
  })
}
