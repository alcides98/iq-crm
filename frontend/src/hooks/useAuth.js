import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { login, logout } from '@/services/auth'
import { useAuthStore } from '@/store/authStore'

export function useLogin() {
  const navigate = useNavigate()
  const setAuth = useAuthStore(s => s.setAuth)

  return useMutation({
    mutationFn: ({ email, password }) => login(email, password),
    onSuccess: (data) => {
      setAuth(data.user, data.access, data.refresh)
      navigate('/dashboard')
    },
    onError: () => {
      toast.error('Email o contraseña incorrectos')
    },
  })
}

export function useLogout() {
  const navigate = useNavigate()
  const { refreshToken, logout: clearAuth } = useAuthStore()

  return () => {
    logout(refreshToken).finally(() => {
      clearAuth()
      navigate('/login')
    })
  }
}
