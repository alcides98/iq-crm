import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

// Slug del tenant configurado por variable de entorno en cada frontend de Render.
// wolfcg → Wolf Consulting Group
// insight → Insight Analytics
// Vacío en desarrollo local (el backend cae al schema public si no hay header)
const TENANT_SLUG = import.meta.env.VITE_TENANT_SLUG || ''

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    ...(TENANT_SLUG ? { 'X-Tenant': TENANT_SLUG } : {}),
  },
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
