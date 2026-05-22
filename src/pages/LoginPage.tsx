import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useClientAuth } from '../hooks/useAuth'

function AppleMailIcon() {
  return (
    <span className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: '#1C8EF9' }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
        <path d="M22 8.608v8.142a3.25 3.25 0 0 1-3.066 3.245L18.75 20H5.25a3.25 3.25 0 0 1-3.245-3.066L2 16.75V8.608l9.652 5.056a.75.75 0 0 0 .696 0zM5.25 4h13.5a3.25 3.25 0 0 1 3.234 2.924L12 12.154l-9.984-5.23A3.25 3.25 0 0 1 5.25 4z"/>
      </svg>
    </span>
  )
}

function GmailIcon() {
  return (
    <span className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'white' }}>
      <svg width="28" height="28" viewBox="0 0 256 256">
        <path fill="#4285f4" d="M58.182 192.05V93.14L27.507 65.077L0 49.504v125.091c0 9.658 7.825 17.455 17.455 17.455z"/>
        <path fill="#34a853" d="M197.818 192.05h40.727c9.659 0 17.455-7.826 17.455-17.455V49.505l-31.156 17.837l-27.026 25.798z"/>
        <path fill="#ea4335" d="m58.182 93.14l-4.174-38.647l4.174-36.989L128 69.868l69.818-52.364l4.669 34.992l-4.669 40.644L128 145.504z"/>
        <path fill="#fbbc04" d="M197.818 17.504V93.14L256 49.504V26.231c0-21.585-24.64-33.89-41.89-20.945z"/>
        <path fill="#c5221f" d="m0 49.504l26.759 20.07L58.182 93.14V17.504L41.89 5.286C24.61-7.66 0 4.646 0 26.23z"/>
      </svg>
    </span>
  )
}

function OutlookIcon() {
  return (
    <span className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'white' }}>
      <svg width="28" height="28" viewBox="0 0 32 32">
        <path fill="#0072c6" d="M19.484 7.937v5.477l1.916 1.205a.5.5 0 0 0 .21 0l8.238-5.554a1.174 1.174 0 0 0-.959-1.128Z"/>
        <path fill="#0072c6" d="m19.484 15.457l1.747 1.2a.52.52 0 0 0 .543 0c-.3.181 8.073-5.378 8.073-5.378v10.066a1.408 1.408 0 0 1-1.49 1.555h-8.874zm-9.044-2.525a1.61 1.61 0 0 0-1.42.838a4.13 4.13 0 0 0-.526 2.218A4.05 4.05 0 0 0 9.02 18.2a1.6 1.6 0 0 0 2.771.022a4 4 0 0 0 .515-2.2a4.37 4.37 0 0 0-.5-2.281a1.54 1.54 0 0 0-1.366-.809"/>
        <path fill="#0072c6" d="M2.153 5.155v21.427L18.453 30V2Zm10.908 14.336a3.23 3.23 0 0 1-2.7 1.361a3.19 3.19 0 0 1-2.64-1.318A5.46 5.46 0 0 1 6.706 16.1a5.87 5.87 0 0 1 1.036-3.616a3.27 3.27 0 0 1 2.744-1.384a3.12 3.12 0 0 1 2.61 1.321a5.64 5.64 0 0 1 1 3.484a5.76 5.76 0 0 1-1.035 3.586"/>
      </svg>
    </span>
  )
}

export default function LoginPage() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [prospectName, setProspectName] = useState('')
  const [prospectPhone, setProspectPhone] = useState('')
  const [prospectEmail, setProspectEmail] = useState('')
  const [prospectCompany, setProspectCompany] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showMailMenu, setShowMailMenu] = useState(false)
  const { isAuthenticated, login } = useClientAuth()
  const navigate = useNavigate()

  if (isAuthenticated) {
    navigate('/calculator', { replace: true })
    return null
  }

  const buildMessage = () => [
    `🆕 Nouvelle demande d'accès SPINCUT`,
    ``,
    `Nom : ${prospectName.trim()}`,
    prospectCompany.trim() ? `Société : ${prospectCompany.trim()}` : '',
    `Email : ${prospectEmail.trim()}`,
    prospectPhone.trim() ? `Téléphone : ${prospectPhone.trim()}` : '',
  ].filter(Boolean).join('\n')

  const handleWhatsApp = () => {
    window.open(`https://wa.me/33767739561?text=${encodeURIComponent(buildMessage())}`, '_blank')
  }

  const handleEmail = () => setShowMailMenu(true)

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
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ background: '#0d0d0d' }}
    >
      <div className="w-full max-w-sm flex flex-col items-center gap-5">

        {/* ── HERO ── */}
        {/* Logo réel */}
        <img
          src="/logo.png"
          alt="SPINCUT Outils CNC"
          className="w-full rounded-2xl"
          style={{ height: '110px', objectFit: 'cover', objectPosition: 'center' }}
        />

        {/* Accroche */}
        <div className="text-center px-1">
          <h1 className="text-2xl font-black text-white leading-tight">
            Les meilleurs ont le code.
          </h1>
          <p className="text-base font-bold tracking-widest mt-2" style={{ color: '#d4780f' }}>
            Calcule. Commande. Coupe.
          </p>
          <p className="text-xs mt-2" style={{ color: '#666' }}>
            Calculateur CNC + commande de fraises en quelques secondes.
          </p>
        </div>

        {/* Photos strip */}
        <div className="w-screen overflow-x-auto -mx-4" style={{ scrollbarWidth: 'none' }}>
          <div className="flex gap-2.5 px-4" style={{ width: 'max-content' }}>
            {['/photo1.jpg', '/photo2.jpg', '/photo3.jpg'].map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                className="flex-shrink-0 rounded-xl"
                style={{ width: '220px', height: '140px', objectFit: 'cover' }}
              />
            ))}
          </div>
        </div>

        {/* Auth card */}
        <div
          className="w-full rounded-xl p-6 flex flex-col gap-5"
          style={{ background: '#161616', border: '1px solid #2a2a2a' }}
        >
          {/* Card header */}
          <div className="flex flex-col items-center gap-2 text-center">
            <div
              className="w-12 h-12 rounded-full overflow-hidden mb-1 flex-shrink-0"
              style={{ border: '1px solid #2a2a2a' }}
            >
              <img
                src="/logo.png"
                alt="S"
                style={{ height: '48px', width: 'auto', display: 'block' }}
              />
            </div>
            <p className="text-sm" style={{ color: '#8a8a8a' }}>
              Entrer votre code d'accès Spincut
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
                Une fois votre fiche client créée, vous recevez automatiquement votre code.
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
              <div className={`space-y-2 ${(!prospectName.trim() || !prospectEmail.trim()) ? 'opacity-40 pointer-events-none' : ''}`}>
                <p className="text-[10px] text-center" style={{ color: '#666' }}>Choisissez comment envoyer votre demande</p>
                <button
                  onClick={handleWhatsApp}
                  className="w-full py-3 rounded-lg text-sm font-bold text-white transition-all active:scale-95 flex items-center justify-center gap-2"
                  style={{ background: '#1a5e1a' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Envoyer via WhatsApp
                </button>
                <button
                  onClick={handleEmail}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all active:scale-95 flex items-center justify-center gap-2"
                  style={{ background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#aaa' }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/>
                  </svg>
                  Envoyer par email
                </button>
              </div>
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

      {/* Mail app chooser */}
      {showMailMenu && (
        <div
          className="fixed inset-0 z-30 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setShowMailMenu(false)}
        >
          <div
            className="w-full max-w-sm rounded-t-2xl p-5 space-y-3"
            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
            onClick={e => e.stopPropagation()}
          >
            <p className="text-center text-xs tracking-widest uppercase mb-4" style={{ color: '#888' }}>
              Envoyer votre demande par email
            </p>

            <a
              href={`mailto:scspincut@gmail.com?subject=${encodeURIComponent('Demande accès SPINCUT')}&body=${encodeURIComponent(buildMessage())}`}
              className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl text-sm font-medium text-white"
              style={{ background: '#2a2a2a' }}
              onClick={() => setShowMailMenu(false)}
            >
              <AppleMailIcon />
              <span>
                <span className="block font-semibold">Apple Mail</span>
                <span className="block text-xs" style={{ color: '#888' }}>Application Mail par défaut</span>
              </span>
            </a>

            <a
              href={`https://mail.google.com/mail/?view=cm&fs=1&to=scspincut@gmail.com&su=${encodeURIComponent('Demande accès SPINCUT')}&body=${encodeURIComponent(buildMessage())}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl text-sm font-medium text-white"
              style={{ background: '#2a2a2a' }}
              onClick={() => setShowMailMenu(false)}
            >
              <GmailIcon />
              <span>
                <span className="block font-semibold">Gmail</span>
                <span className="block text-xs" style={{ color: '#888' }}>Ouvre Gmail dans le navigateur</span>
              </span>
            </a>

            <a
              href={`https://outlook.live.com/mail/0/deeplink/compose?to=scspincut@gmail.com&subject=${encodeURIComponent('Demande accès SPINCUT')}&body=${encodeURIComponent(buildMessage())}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl text-sm font-medium text-white"
              style={{ background: '#2a2a2a' }}
              onClick={() => setShowMailMenu(false)}
            >
              <OutlookIcon />
              <span>
                <span className="block font-semibold">Outlook</span>
                <span className="block text-xs" style={{ color: '#888' }}>Ouvre Outlook dans le navigateur</span>
              </span>
            </a>

            <button
              onClick={() => setShowMailMenu(false)}
              className="w-full py-3 rounded-xl text-sm"
              style={{ color: '#666' }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
