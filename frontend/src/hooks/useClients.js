import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '@/services/api'

export function useClients(filters = {}) {
  return useQuery({
    queryKey: ['clients', filters],
    queryFn: () => api.get('/clients/', { params: filters }).then(r => r.data),
  })
}

export function useClient(id) {
  return useQuery({
    queryKey: ['client', id],
    queryFn: () => api.get(`/clients/${id}/`).then(r => r.data),
    enabled: !!id,
  })
}

export function useClientDeals(id) {
  return useQuery({
    queryKey: ['client-deals', id],
    queryFn: () => api.get(`/clients/${id}/deals/`).then(r => r.data),
    enabled: !!id,
  })
}

export function useClientContacts(id) {
  return useQuery({
    queryKey: ['client-contacts', id],
    queryFn: () => api.get(`/clients/${id}/contacts/`).then(r => r.data),
    enabled: !!id,
  })
}

export function useCreateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.post('/clients/', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Cliente creado correctamente')
    },
    onError: (err) => {
      const msg = err.response?.data?.ruc?.[0] || err.response?.data?.detail || 'Error al crear cliente'
      toast.error(msg)
    },
  })
}

export function useUpdateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/clients/${id}/`, data).then(r => r.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['clients'] })
      qc.invalidateQueries({ queryKey: ['client', vars.id] })
      toast.success('Cliente actualizado')
    },
    onError: (err) => {
      const msg = err.response?.data?.ruc?.[0] || 'Error al actualizar cliente'
      toast.error(msg)
    },
  })
}

export function useDeleteClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`/clients/${id}/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Cliente eliminado')
    },
    onError: () => toast.error('Error al eliminar cliente'),
  })
}

export function useCreateContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ clientId, ...data }) => api.post(`/clients/${clientId}/contacts/`, data).then(r => r.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['client-contacts', vars.clientId] })
      toast.success('Contacto agregado')
    },
    onError: () => toast.error('Error al agregar contacto'),
  })
}
