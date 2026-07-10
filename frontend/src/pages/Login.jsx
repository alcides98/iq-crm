import { useState } from 'react'
import { useLogin } from '@/hooks/useAuth'
import { useThemeStore } from '@/store/themeStore'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { mutate: login, isPending } = useLogin()
  const { dark, toggle } = useThemeStore()

  const handleSubmit = (e) => {
    e.preventDefault()
    login({ email, password })
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] flex items-center justify-center p-4">

      {/* Theme toggle */}
      <button
        onClick={toggle}
        className="fixed top-4 right-4 w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-surface-dark-secondary border border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-all shadow-apple-sm"
        title={dark ? 'Modo claro' : 'Modo oscuro'}
      >
        {dark ? <SunIcon /> : <MoonIcon />}
      </button>

      <div className="w-full max-w-[360px]">
        {/* Card */}
        <div className="bg-white dark:bg-surface-dark-secondary rounded-3xl border border-gray-100 dark:border-gray-800 shadow-apple-lg p-8">

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img
                src={dark ? '/iqdata-dark.png' : '/iqdata-light.png'}
                alt="IQ Data"
                className="h-36 w-auto object-contain"
              />
            </div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-2 leading-snug">
              Bienvenidos, convertimos datos en resultados.
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Ingresá a tu cuenta</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Correo electrónico</label>
              <input
                type="email"
                className="input"
                placeholder="tu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="label">Contraseña</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn-primary w-full mt-2 h-11 text-base"
              disabled={isPending}
            >
              {isPending ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-400 dark:text-gray-600 font-medium">
            Desarrollado por IQ DATA
          </p>
        </div>
      </div>
    </div>
  )
}

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}
