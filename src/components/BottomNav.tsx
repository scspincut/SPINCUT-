import { useNavigate, useLocation } from 'react-router-dom'

export default function BottomNav({ cartCount = 0 }: { cartCount?: number }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

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
            </button>
          )
        })}
      </div>
    </nav>
  )
}
