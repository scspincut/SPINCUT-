import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useClientAuth } from '../hooks/useAuth'
import SpincutLogo from '../components/SpincutLogo'

export default function LoginPage() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const { isAuthenticated, login } = useClientAuth()
  const navigate = useNavigate()

  if (isAuthenticated) {
    navigate('/calculator', { replace: true })
    return null
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError('')
    const ok = login(code)
    if (ok) {
      navigate('/calculator')
    } else {
      setError('Code invalide. Contactez SPINCUT pour obtenir votre accès.')
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
                <rect x="3" y="11" width="18" height="11" rx="2" stroke="#d4780f" strokeWidth="1.8" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#d4780f" strokeWidth="1.8" strokeLinecap="round" />
                <circle cx="12" cy="16" r="1.5" fill="#d4780f" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white">Accès Client</h1>
            <p className="text-sm" style={{ color: '#8a8a8a' }}>
              Entrez votre code d'accès SPINCUT pour utiliser le calculateur CNC
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="text"
              value={code}
              onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
              placeholder="CODE D'ACCÈS"
              autoComplete="off"
              spellCheck={false}
              className="w-full px-4 py-3 rounded-lg text-white placeholder-gray-600 font-mono text-sm tracking-widest outline-none transition-all"
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
              Accéder au calculateur
            </button>
          </form>

          <div className="flex flex-col items-center gap-2">
            <p className="text-center text-xs" style={{ color: '#8a8a8a' }}>
              Accès réservé aux clients SPINCUT
            </p>
            <a
              href="https://wa.me/33767739561"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs px-4 py-2 rounded-lg transition-colors"
              style={{ background: '#0a1f0a', color: '#4ade80', border: '1px solid #166534' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#0d2b0d')}
              onMouseLeave={e => (e.currentTarget.style.background = '#0a1f0a')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
              </svg>
              Pas de code ? Contactez SPINCUT
            </a>
          </div>
        </div>

        {/* Admin link */}
        <Link
          to="/admin"
          className="flex items-center gap-2 text-sm transition-colors"
          style={{ color: '#8a8a8a' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#d4780f')}
          onMouseLeave={e => (e.currentTarget.style.color = '#8a8a8a')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
            <path
              d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
              stroke="currentColor"
              strokeWidth="1.8"
            />
          </svg>
          Administration
        </Link>

        {/* Footer */}
        <p className="text-center text-xs px-4" style={{ color: '#4a4a4a' }}>
          © SPINCUT — Ces valeurs sont des recommandations standards. Un test avant production est conseillé.
        </p>
      </div>
    </div>
  )
}
