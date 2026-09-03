import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

// En desarrollo usa el proxy de Vite (/api → localhost:8000).
// En producción el build estático no tiene proxy → lee VITE_API_URL
// (p.ej. https://iq-crm-backend.onrender.com/api/v1).
const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refreshToken = useAuthStore.getState().refreshToken
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/refresh/`, { refresh: refreshToken })
          useAuthStore.getState().setAuth(
            useAuthStore.getState().user,
            data.access,
            refreshToken
          )
          original.headers.Authorization = `Bearer ${data.access}`
          return api(original)
        } catch {
          useAuthStore.getState().logout()
          window.location.href = '/login'
        }
      } else {
        useAuthStore.getState().logout()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
