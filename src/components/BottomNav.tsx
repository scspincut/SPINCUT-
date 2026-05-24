import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function BottomNav({ cartCount = 0, cartTotal = 0 }: { cartCount?: number; cartTotal?: number }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [contactOpen, setContactOpen] = useState(false)

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

      {/* Contact modal */}
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
            <a
              href="mailto:scspincut@gmail.com"
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-white hover:bg-[#222] transition-colors border-t border-[#222]"
              onClick={() => setContactOpen(false)}
            >
              <svg width="20" height="20" fill="none" stroke="#d4780f" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/></svg>
              Email
            </a>
          </div>
        </>
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
