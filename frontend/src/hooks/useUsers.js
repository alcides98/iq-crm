import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '@/services/api'

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/auth/users/').then(r => {
      const data = r.data
      return Array.isArray(data) ? data : (data?.results || [])
    }),
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.post('/auth/users/', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('Usuario creado')
    },
    onError: (err) => {
      const msg = err?.response?.data?.email?.[0] || err?.response?.data?.detail || 'Error al crear usuario'
      toast.error(msg)
    },
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/auth/users/${id}/`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('Usuario actualizado')
    },
    onError: () => toast.error('Error al actualizar usuario'),
  })
}

export function useDeactivateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`/auth/users/${id}/`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('Usuario desactivado')
    },
    onError: (err) => {
      const msg = err?.response?.data?.detail || 'Error al desactivar usuario'
      toast.error(msg)
    },
  })
}

export function useCompanySettings() {
  return useQuery({
    queryKey: ['company-settings'],
    queryFn: () => api.get('/auth/company/').then(r => r.data),
  })
}

export function useUpdateCompanySettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => {
      if (data instanceof FormData) {
        return api.patch('/auth/company/', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        }).then(r => r.data)
      }
      return api.patch('/auth/company/', data).then(r => r.data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company-settings'] })
      toast.success('Configuración guardada')
    },
    onError: (err) => {
      const data = err?.response?.data
      const msg = data?.detail
        || (data && Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join(', '))
        || 'Error al guardar configuración'
      toast.error(msg)
    },
  })
}

export function usePipelineStages() {
  return useQuery({
    queryKey: ['pipeline-stages'],
    queryFn: () => api.get('/pipeline/stages/').then(r => {
      const d = r.data
      return Array.isArray(d) ? d : (d?.results || [])
    }),
  })
}

export function useUpdatePipelineStage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/pipeline/stages/${id}/`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline-stages'] })
      toast.success('Etapa actualizada')
    },
    onError: () => toast.error('Error al actualizar etapa'),
  })
}

export function useCreatePipelineStage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.post('/pipeline/stages/', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline-stages'] })
      toast.success('Etapa creada')
    },
    onError: () => toast.error('Error al crear etapa'),
  })
}
