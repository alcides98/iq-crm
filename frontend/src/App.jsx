import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import Layout from '@/components/layout/Layout'
import LoginPage from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Pipeline from '@/pages/Pipeline'
import Clients from '@/pages/Clients'
import Tasks from '@/pages/Tasks'
import Facturas from '@/pages/Facturas'
import Settings from '@/pages/Settings'

function ThemeApplier() {
  const dark = useThemeStore(s => s.dark)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])
  return null
}

function PrivateRoute({ children }) {
  const token = useAuthStore(s => s.token)
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeApplier />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="pipeline" element={<Pipeline />} />
          <Route path="clients" element={<Clients />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="facturas" element={<Facturas />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
