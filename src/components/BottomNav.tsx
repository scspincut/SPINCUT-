import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function BottomNav({ cartCount = 0, cartTotal = 0 }: { cartCount?: number; cartTotal?: number }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [contactOpen, setContactOpen] = useState(false)
  const [mailMenuOpen, setMailMenuOpen] = useState(false)

  const go = (path: string) => {
    localStorage.setItem('spincut_last_section', path)
    navigate(path)
  }

  const tabs = [
    {
      path: '/calculator',
      label: 'Calculateur',
      icon: (c: string) => (
        <svg width="22" height="22" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <rect x="4" y="2" width="16" height="20" rx="2"/>
          <path d="M8 7h8M8 11h8M8 15h4"/>
        </svg>
      ),
    },
    {
      path: '/boutique',
      label: 'Boutique',
      icon: (c: string) => (
        <svg width="22" height="22" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 01-8 0"/>
        </svg>
      ),
    },
    {
      path: '/commande',
      label: 'Commandes',
      badge: cartCount,
      icon: (c: string) => (
        <svg width="22" height="22" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
          <rect x="9" y="3" width="6" height="4" rx="1"/>
          <line x1="9" y1="12" x2="15" y2="12"/>
          <line x1="9" y1="16" x2="13" y2="16"/>
        </svg>
      ),
    },
  ]

  return (
    <>
      {/* Floating Contact button */}
      <button
        onClick={() => setContactOpen(o => !o)}
        style={{ position: 'fixed', bottom: '86px', right: '16px', zIndex: 49, width: '54px', height: '54px', background: '#d4780f', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 24px rgba(212,120,15,0.45)', transition: 'transform 0.15s', border: 'none', cursor: 'pointer' }}
        onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.92)')}
        onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        <svg width="24" height="24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
      </button>

      {/* Contact popup */}
      {contactOpen && (
        <>
          <div className="fixed inset-0 z-48" onClick={() => setContactOpen(false)} />
          <div style={{ position: 'fixed', bottom: '152px', right: '16px', zIndex: 50, background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.6)', minWidth: '200px' }}>
            <p className="text-[10px] uppercase tracking-wider text-[#555] px-4 pt-3 pb-2">Nous contacter</p>
            <a
              href="https://wa.me/33767739561"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-white hover:bg-[#222] transition-colors"
              onClick={() => setContactOpen(false)}
            >
              <svg width="20" height="20" fill="#25D366" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </a>
            <button
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-white hover:bg-[#222] transition-colors border-t border-[#222]"
              onClick={() => { setContactOpen(false); setMailMenuOpen(true) }}
            >
              <svg width="20" height="20" fill="none" stroke="#d4780f" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/></svg>
              Email
            </button>
          </div>
        </>
      )}

      {/* Mail app chooser — bottom sheet */}
      {mailMenuOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.75)' }}
          onClick={() => setMailMenuOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-t-2xl p-5 space-y-3"
            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
            onClick={e => e.stopPropagation()}
          >
            <p className="text-center text-xs tracking-widest uppercase mb-4" style={{ color: '#888' }}>
              Envoyer un email à SPINCUT
            </p>

            {/* Apple Mail */}
            <a
              href="mailto:scspincut@gmail.com?subject=Contact%20SPINCUT"
              className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl text-sm font-medium text-white"
              style={{ background: '#2a2a2a' }}
              onClick={() => setMailMenuOpen(false)}
            >
              <span className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: '#1C8EF9' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M22 8.608v8.142a3.25 3.25 0 0 1-3.066 3.245L18.75 20H5.25a3.25 3.25 0 0 1-3.245-3.066L2 16.75V8.608l9.652 5.056a.75.75 0 0 0 .696 0zM5.25 4h13.5a3.25 3.25 0 0 1 3.234 2.924L12 12.154l-9.984-5.23A3.25 3.25 0 0 1 5.25 4z"/></svg>
              </span>
              <span>
                <span className="block font-semibold">Apple Mail</span>
                <span className="block text-xs" style={{ color: '#888' }}>Application Mail par défaut</span>
              </span>
            </a>

            {/* Gmail */}
            <a
              href="https://mail.google.com/mail/?view=cm&fs=1&to=scspincut@gmail.com&su=Contact%20SPINCUT"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl text-sm font-medium text-white"
              style={{ background: '#2a2a2a' }}
              onClick={() => setMailMenuOpen(false)}
            >
              <span className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'white' }}>
                <svg width="28" height="28" viewBox="0 0 256 256">
                  <path fill="#4285f4" d="M58.182 192.05V93.14L27.507 65.077L0 49.504v125.091c0 9.658 7.825 17.455 17.455 17.455z"/>
                  <path fill="#34a853" d="M197.818 192.05h40.727c9.659 0 17.455-7.826 17.455-17.455V49.505l-31.156 17.837l-27.026 25.798z"/>
                  <path fill="#ea4335" d="m58.182 93.14l-4.174-38.647l4.174-36.989L128 69.868l69.818-52.364l4.669 34.992l-4.669 40.644L128 145.504z"/>
                  <path fill="#fbbc04" d="M197.818 17.504V93.14L256 49.504V26.231c0-21.585-24.64-33.89-41.89-20.945z"/>
                  <path fill="#c5221f" d="m0 49.504l26.759 20.07L58.182 93.14V17.504L41.89 5.286C24.61-7.66 0 4.646 0 26.23z"/>
                </svg>
              </span>
              <span>
                <span className="block font-semibold">Gmail</span>
                <span className="block text-xs" style={{ color: '#888' }}>Ouvre Gmail dans le navigateur</span>
              </span>
            </a>

            {/* Outlook */}
            <a
              href="https://outlook.live.com/mail/0/deeplink/compose?to=scspincut@gmail.com&subject=Contact%20SPINCUT"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl text-sm font-medium text-white"
              style={{ background: '#2a2a2a' }}
              onClick={() => setMailMenuOpen(false)}
            >
              <span className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'white' }}>
                <svg width="28" height="28" viewBox="0 0 32 32">
                  <path fill="#0072c6" d="M19.484 7.937v5.477l1.916 1.205a.5.5 0 0 0 .21 0l8.238-5.554a1.174 1.174 0 0 0-.959-1.128Z"/>
                  <path fill="#0072c6" d="m19.484 15.457l1.747 1.2a.52.52 0 0 0 .543 0c-.3.181 8.073-5.378 8.073-5.378v10.066a1.408 1.408 0 0 1-1.49 1.555h-8.874zm-9.044-2.525a1.61 1.61 0 0 0-1.42.838a4.13 4.13 0 0 0-.526 2.218A4.05 4.05 0 0 0 9.02 18.2a1.6 1.6 0 0 0 2.771.022a4 4 0 0 0 .515-2.2a4.37 4.37 0 0 0-.5-2.281a1.54 1.54 0 0 0-1.366-.809"/>
                  <path fill="#0072c6" d="M2.153 5.155v21.427L18.453 30V2Zm10.908 14.336a3.23 3.23 0 0 1-2.7 1.361a3.19 3.19 0 0 1-2.64-1.318A5.46 5.46 0 0 1 6.706 16.1a5.87 5.87 0 0 1 1.036-3.616a3.27 3.27 0 0 1 2.744-1.384a3.12 3.12 0 0 1 2.61 1.321a5.64 5.64 0 0 1 1 3.484a5.76 5.76 0 0 1-1.035 3.586"/>
                </svg>
              </span>
              <span>
                <span className="block font-semibold">Outlook</span>
                <span className="block text-xs" style={{ color: '#888' }}>Ouvre Outlook dans le navigateur</span>
              </span>
            </a>

            {/* Autre */}
            <a
              href="mailto:scspincut@gmail.com"
              className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl text-sm font-medium text-white"
              style={{ background: '#2a2a2a' }}
              onClick={() => setMailMenuOpen(false)}
            >
              <span className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: '#2a2a2a', border: '1px solid #3a3a3a' }}>
                <svg width="22" height="22" fill="none" stroke="#aaa" strokeWidth="1.8" viewBox="0 0 24 24">
                  <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/>
                </svg>
              </span>
              <span>
                <span className="block font-semibold" style={{ color: '#ccc' }}>Autre application</span>
                <span className="block text-xs" style={{ color: '#888' }}>Ouvre l'app mail par défaut</span>
              </span>
            </a>

            <button
              onClick={() => setMailMenuOpen(false)}
              className="w-full py-3 rounded-xl text-sm"
              style={{ color: '#666' }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50" style={{ background: '#111', borderTop: '1px solid #1e1e1e' }}>
        <div className="flex max-w-2xl mx-auto">
          {tabs.map(tab => {
            const active = pathname === tab.path
            const color = active ? '#d4780f' : '#555'
            return (
              <button key={tab.path} onClick={() => go(tab.path)} className="flex-1 flex flex-col items-center pt-3 pb-4 gap-1">
                <div className="relative">
                  {tab.icon(color)}
                  {tab.badge ? (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 bg-[#d4780f] rounded-full text-white text-[9px] font-bold flex items-center justify-center px-1">
                      {tab.badge}
                    </span>
                  ) : null}
                </div>
                <span className="text-[10px] font-medium" style={{ color }}>{tab.label}</span>
                {tab.path === '/commande' && cartCount > 0 && cartTotal > 0 && (
                  <span className="text-[9px] font-bold leading-none" style={{ color: '#d4780f', marginTop: -2 }}>
                    {cartTotal.toFixed(2).replace('.', ',')} €
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}
