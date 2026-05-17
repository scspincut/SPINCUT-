import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useClientAuth } from '../hooks/useAuth'
import SpincutLogo from '../components/SpincutLogo'

export default function LoginPage() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [prospectName, setProspectName] = useState('')
  const [prospectPhone, setProspectPhone] = useState('')
  const [prospectEmail, setProspectEmail] = useState('')
  const [prospectCompany, setProspectCompany] = useState('')
  const [showForm, setShowForm] = useState(false)
  const { isAuthenticated, login } = useClientAuth()
  const navigate = useNavigate()

  if (isAuthenticated) {
    navigate('/calculator', { replace: true })
    return null
  }

  const handleProspect = () => {
    if (!prospectName.trim() || !prospectEmail.trim()) return
    const lines = [
      `🆕 Nouvelle demande d'accès SPINCUT`,
      ``,
      `Nom : ${prospectName.trim()}`,
      prospectCompany.trim() ? `Société : ${prospectCompany.trim()}` : '',
      `Email : ${prospectEmail.trim()}`,
      prospectPhone.trim() ? `Téléphone : ${prospectPhone.trim()}` : '',
    ].filter(Boolean).join('\n')
    window.open(`https://wa.me/33767739561?text=${encodeURIComponent(lines)}`, '_blank')
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

          <p className="text-center text-xs" style={{ color: '#8a8a8a' }}>
            Accès réservé aux clients SPINCUT
          </p>
        </div>

        {/* Prospect — pas encore client */}
        <div
          className="w-full rounded-xl overflow-hidden"
          style={{ background: '#161616', border: '1px solid #2a2a2a' }}
        >
          {/* Accroche — toujours visible */}
          <div className="px-5 pt-5 pb-4">
            <p className="text-base font-bold text-white">Vous n'êtes pas encore client ?</p>
            <p className="text-sm mt-1.5" style={{ color: '#8a8a8a' }}>
              Devenez client SPINCUT et obtenez votre code d'accès gratuitement
            </p>
            <div className="mt-3 space-y-1.5">
              {[
                'Exploitez votre machine à 100% — vitesses et avances au maximum sans casse',
                'Paramètres optimisés pour chaque matériau',
                'Mis à jour en continu par SPINCUT',
              ].map(txt => (
                <div key={txt} className="flex items-start gap-2">
                  <span style={{ color: '#d4780f' }} className="mt-0.5 text-sm">✓</span>
                  <span className="text-xs" style={{ color: '#aaa' }}>{txt}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowForm(v => !v)}
              className="mt-4 w-full py-3 rounded-lg text-sm font-bold text-white transition-all active:scale-95"
              style={{ background: '#d4780f' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#b86400')}
              onMouseLeave={e => (e.currentTarget.style.background = '#d4780f')}
            >
              {showForm ? 'Annuler' : 'Demander mon accès gratuit →'}
            </button>
          </div>

          {/* Formulaire — visible uniquement après clic */}
          {showForm && (
            <div className="px-5 pb-5 space-y-3" style={{ borderTop: '1px solid #2a2a2a', paddingTop: '1rem' }}>
              <p className="text-xs font-semibold" style={{ color: '#d4780f' }}>
                Laissez vos coordonnées — je vous contacte sous 24h
              </p>
              {[
                { label: 'Nom complet *', value: prospectName, set: setProspectName, placeholder: 'Jean Dupont' },
                { label: 'Société', value: prospectCompany, set: setProspectCompany, placeholder: 'Dupont SARL' },
                { label: 'Email *', value: prospectEmail, set: setProspectEmail, placeholder: 'jean@exemple.com' },
                { label: 'Téléphone', value: prospectPhone, set: setProspectPhone, placeholder: '06 12 34 56 78 (optionnel)' },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-xs mb-1" style={{ color: '#8a8a8a' }}>{f.label}</label>
                  <input
                    type="text"
                    value={f.value}
                    onChange={e => f.set(e.target.value)}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2.5 rounded-lg text-white text-sm outline-none"
                    style={{ background: '#1e1e1e', border: '1px solid #2a2a2a' }}
                    onFocus={e => (e.currentTarget.style.border = '1px solid #d4780f')}
                    onBlur={e => (e.currentTarget.style.border = '1px solid #2a2a2a')}
                  />
                </div>
              ))}
              <button
                onClick={handleProspect}
                disabled={!prospectName.trim() || !prospectEmail.trim()}
                className="w-full py-3 rounded-lg text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-40"
                style={{ background: '#d4780f' }}
                onMouseEnter={e => { if (prospectName.trim() && prospectEmail.trim()) e.currentTarget.style.background = '#b86400' }}
                onMouseLeave={e => (e.currentTarget.style.background = '#d4780f')}
              >
                Envoyer ma demande →
              </button>
            </div>
          )}
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
