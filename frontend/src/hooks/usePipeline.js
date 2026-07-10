import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '@/services/api'

export function useDeals(filters = {}) {
  return useQuery({
    queryKey: ['deals', filters],
    queryFn: () => api.get('/pipeline/deals/', { params: filters }).then(r => r.data),
  })
}

export function useDeal(id) {
  return useQuery({
    queryKey: ['deal', id],
    queryFn: () => api.get(`/pipeline/deals/${id}/`).then(r => r.data),
    enabled: !!id,
  })
}

export function useCreateDeal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.post('/pipeline/deals/', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deals'] })
      toast.success('Negociación creada')
    },
    onError: () => toast.error('Error al crear negociación'),
  })
}

export function useUpdateDeal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/pipeline/deals/${id}/`, data).then(r => r.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['deals'] })
      qc.invalidateQueries({ queryKey: ['deal', vars.id] })
      toast.success('Negociación actualizada')
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Error al actualizar'
      toast.error(msg)
    },
  })
}

export function useAdvanceDeal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => api.post(`/pipeline/deals/${id}/advance/`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deals'] })
      toast.success('Fase actualizada')
    },
    onError: (err) => {
      const detail = err.response?.data
      if (detail?.missing_fields) {
        toast.error(`Faltan campos: ${detail.missing_fields.join(', ')}`)
      } else {
        toast.error('Error al avanzar fase')
      }
    },
  })
}
