import { useState, useEffect, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAdminAuth } from '../hooks/useAuth'
import SpincutLogo from '../components/SpincutLogo'

export default function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { isAdmin, adminLogin } = useAdminAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAdmin) navigate('/admin/dashboard', { replace: true })
  }, [isAdmin, navigate])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError('')
    const ok = adminLogin(password)
    if (ok) {
      navigate('/admin/dashboard')
    } else {
      setError('Mot de passe incorrect.')
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: '#0d0d0d' }}
    >
      <div className="w-full max-w-sm flex flex-col items-center gap-6">

        {/* Logo card */}
        <div
          className="w-full flex items-center justify-center py-5 px-6 rounded-xl"
          style={{ background: '#111', border: '1px solid #1e1e1e' }}
        >
          <SpincutLogo size="md" />
        </div>

        {/* Auth card */}
        <div
          className="w-full rounded-xl p-6 flex flex-col gap-5"
          style={{ background: '#161616', border: '1px solid #2a2a2a' }}
        >
          {/* Card header */}
          <div className="flex flex-col items-center gap-2 text-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-1"
              style={{ background: '#1e1e1e', border: '1px solid #2a2a2a' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                  stroke="#d4780f"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M9 12l2 2 4-4" stroke="#d4780f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white">Accès Administration</h1>
            <p className="text-sm" style={{ color: '#8a8a8a' }}>
              Connexion sécurisée à l'interface d'administration SPINCUT
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              placeholder="Mot de passe"
              autoComplete="current-password"
              className="w-full px-4 py-3 rounded-lg text-white placeholder-gray-600 text-sm outline-none transition-all"
              style={{
                background: '#1e1e1e',
                border: error ? '1px solid #ef4444' : '1px solid #2a2a2a',
              }}
              onFocus={e => {
                if (!error) e.currentTarget.style.border = '1px solid #d4780f'
              }}
              onBlur={e => {
                if (!error) e.currentTarget.style.border = '1px solid #2a2a2a'
              }}
            />

            {error && (
              <p className="text-sm" style={{ color: '#ef4444' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-lg font-semibold text-white transition-colors"
              style={{ background: '#d4780f' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#b86400')}
              onMouseLeave={e => (e.currentTarget.style.background = '#d4780f')}
            >
              Se connecter
            </button>
          </form>
        </div>

        {/* Back link */}
        <Link
          to="/"
          className="flex items-center gap-2 text-sm transition-colors"
          style={{ color: '#8a8a8a' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#d4780f')}
          onMouseLeave={e => (e.currentTarget.style.color = '#8a8a8a')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Retour à l'accès client
        </Link>
      </div>
    </div>
  )
}
