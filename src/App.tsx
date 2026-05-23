import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import CalculatorPage from './pages/CalculatorPage'
import BoutiquePage from './pages/BoutiquePage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import OrderPage from './pages/OrderPage'
import ProfilePage from './pages/ProfilePage'
import { getAccessCodes, saveAccessCodes } from './hooks/useAuth'

// Activate a code from ?activate=XXX URL param
function CodeActivator() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const code = params.get('activate')
    if (!code) return

    const codes = getAccessCodes()
    const exists = codes.find(c => c.code === code.toUpperCase())
    if (!exists) {
      const newCode = { id: Date.now().toString(), code: code.toUpperCase(), active: true, createdAt: new Date().toISOString() }
      saveAccessCodes([...codes, newCode])
    }
    navigate('/', { replace: true })
  }, [])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <CodeActivator />
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/calculator" element={<CalculatorPage />} />
        <Route path="/boutique" element={<BoutiquePage />} />
        <Route path="/commande" element={<OrderPage />} />
        <Route path="/profil" element={<ProfilePage />} />
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
