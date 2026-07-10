import { create } from 'zustand'

export const usePipelineStore = create((set) => ({
  deals: [],
  loading: false,
  filters: { phase: null, assigned_to: null, service_type: null },
  setDeals: (deals) => set({ deals }),
  setLoading: (loading) => set({ loading }),
  setFilters: (filters) => set((prev) => ({ filters: { ...prev.filters, ...filters } })),
}))
