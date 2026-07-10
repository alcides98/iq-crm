import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'

export function useKPIs(filters = {}) {
  return useQuery({
    queryKey: ['kpis', filters],
    queryFn: () => api.get('/dashboard/kpis/', { params: filters }).then(r => r.data),
    refetchInterval: 1000 * 60 * 5,
  })
}

export function useAlerts() {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: () => api.get('/dashboard/alerts/').then(r => r.data),
    refetchInterval: 1000 * 60 * 10,
  })
}
