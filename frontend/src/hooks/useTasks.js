import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '@/services/api'

export function useProjects(filters = {}) {
  return useQuery({
    queryKey: ['projects', filters],
    queryFn: () => api.get('/tasks/projects/', { params: filters }).then(r => r.data),
  })
}

export function useProject(id) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => api.get(`/tasks/projects/${id}/`).then(r => r.data),
    enabled: !!id,
  })
}

export function useProjectTasks(projectId) {
  return useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn: () => api.get(`/tasks/projects/${projectId}/tasks/`).then(r => r.data),
    enabled: !!projectId,
  })
}

export function useTasks(filters = {}) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => api.get('/tasks/tasks/', { params: filters }).then(r => r.data),
  })
}

export function useTask(id) {
  return useQuery({
    queryKey: ['task', id],
    queryFn: () => api.get(`/tasks/tasks/${id}/`).then(r => r.data),
    enabled: !!id,
  })
}

export function useDealTasks(dealId) {
  return useQuery({
    queryKey: ['deal-tasks', dealId],
    queryFn: () => api.get('/tasks/tasks/', { params: { deal: dealId } }).then(r => r.data),
    enabled: !!dealId,
  })
}

export function useTaskChecklist(taskId) {
  return useQuery({
    queryKey: ['checklist', taskId],
    queryFn: () => api.get(`/tasks/tasks/${taskId}/checklist/`).then(r => r.data),
    enabled: !!taskId,
  })
}

export function useCreateChecklistItem(taskId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.post(`/tasks/tasks/${taskId}/checklist/`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['checklist', taskId] })
      qc.invalidateQueries({ queryKey: ['task', taskId] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['project-tasks'] })
      qc.invalidateQueries({ queryKey: ['projects'] })
    },
    onError: () => toast.error('Error al agregar item'),
  })
}

export function useUpdateChecklistItem(taskId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/tasks/checklist/${id}/`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['checklist', taskId] })
      qc.invalidateQueries({ queryKey: ['task', taskId] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['project-tasks'] })
      qc.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useDeleteChecklistItem(taskId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`/tasks/checklist/${id}/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['checklist', taskId] })
      qc.invalidateQueries({ queryKey: ['task', taskId] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['project-tasks'] })
      qc.invalidateQueries({ queryKey: ['projects'] })
    },
    onError: () => toast.error('Error al eliminar item'),
  })
}

export function useCreateChecklistItems() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ taskId, items }) => {
      for (let i = 0; i < items.length; i++) {
        const text = items[i]
        if (text && text.trim()) {
          await api.post(`/tasks/tasks/${taskId}/checklist/`, { text: text.trim(), order: i })
        }
      }
      return { taskId, count: items.filter(s => s && s.trim()).length }
    },
    onSuccess: ({ taskId }) => {
      qc.invalidateQueries({ queryKey: ['checklist', taskId] })
      qc.invalidateQueries({ queryKey: ['task', taskId] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['project-tasks'] })
      qc.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.post('/tasks/tasks/', data).then(r => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      if (data.project) qc.invalidateQueries({ queryKey: ['project', data.project] })
      if (data.deal) {
        qc.invalidateQueries({ queryKey: ['deal-tasks', data.deal] })
        qc.invalidateQueries({ queryKey: ['deals'] })
      }
      qc.invalidateQueries({ queryKey: ['projects'] })
      qc.invalidateQueries({ queryKey: ['kpis'] })
      toast.success('Tarea creada')
    },
    onError: () => toast.error('Error al crear tarea'),
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/tasks/tasks/${id}/`, data).then(r => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['task', data.id] })
      if (data.project) {
        qc.invalidateQueries({ queryKey: ['project', data.project] })
        qc.invalidateQueries({ queryKey: ['project-tasks', data.project] })
      }
      if (data.deal) qc.invalidateQueries({ queryKey: ['deals'] })
      qc.invalidateQueries({ queryKey: ['projects'] })
      qc.invalidateQueries({ queryKey: ['kpis'] })
      toast.success('Tarea actualizada')
    },
    onError: () => toast.error('Error al actualizar tarea'),
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`/tasks/tasks/${id}/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['projects'] })
      qc.invalidateQueries({ queryKey: ['kpis'] })
      toast.success('Tarea eliminada')
    },
    onError: () => toast.error('Error al eliminar tarea'),
  })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.post('/tasks/projects/', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Proyecto creado')
    },
    onError: () => toast.error('Error al crear proyecto'),
  })
}

export function useUpdateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/tasks/projects/${id}/`, data).then(r => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      qc.invalidateQueries({ queryKey: ['project', data.id] })
      toast.success('Proyecto actualizado')
    },
    onError: () => toast.error('Error al actualizar proyecto'),
  })
}
