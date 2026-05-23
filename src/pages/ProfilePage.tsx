import { useNavigate } from 'react-router-dom'
import { useClientAuth, getAccessCodes, getClientCode } from '../hooks/useAuth'
import BottomNav from '../components/BottomNav'

interface OrderHistoryEntry {
  date: number
  orderId: string
  isNewBdc: boolean
  items: { ref: string; designation: string; quantity: number; price: number }[]
  total: number
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { isAuthenticated, logout } = useClientAuth()

  const clientCode = getClientCode()
  const clientInfo = clientCode ? getAccessCodes().find(c => c.code === clientCode) : null
  const clientName = clientInfo?.clientName ?? null

  const historyKey = `spincut_orders_${clientCode ?? 'guest'}`
  const bdcKey = `spincut_bdc_${clientCode ?? 'guest'}`
  const favKey = `spincut_favs_${clientCode ?? 'guest'}`

  const orderHistory: OrderHistoryEntry[] = (() => {
    try { return JSON.parse(localStorage.getItem(historyKey) ?? '[]') } catch { return [] }
  })()
  const currentBdcId: string | null = (() => {
    try { return JSON.parse(localStorage.getItem(bdcKey) ?? 'null') } catch { return null }
  })()
  const favCount: number = (() => {
    try { return JSON.parse(localStorage.getItem(favKey) ?? '[]').length } catch { return 0 }
  })()

  const totalSpent = orderHistory.reduce((s, e) => s + e.total, 0)

  if (!isAuthenticated) { navigate('/'); return null }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">

      <header className="sticky top-0 z-30 bg-black border-b border-[#1a1a1a]">
        <div className="max-w-2xl mx-auto px-4 py-2 relative flex items-center justify-center">
          <button
            onClick={() => navigate(-1)}
            className="absolute left-4 flex items-center gap-1 text-[#555] hover:text-white text-xs transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Retour
          </button>
          <img src="/logo.png" alt="SPINCUT" style={{ height: '120px', objectFit: 'contain', mixBlendMode: 'screen' }} />
          <button
            onClick={() => { logout(); navigate('/') }}
            className="absolute right-4 flex items-center gap-1 text-[#555] hover:text-white text-xs transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            Déconnexion
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pb-36 pt-6 space-y-4">

        {/* Identity card */}
        <div className="rounded-2xl bg-[#161616] border border-[#2a2a2a] p-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#2a1400', border: '2px solid rgba(212,120,15,0.2)' }}>
              <svg className="w-7 h-7 text-[#d4780f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-lg">{clientName ?? 'Client SPINCUT'}</p>
              <p className="text-[#555] text-sm font-mono mt-0.5">Code : {clientCode ?? '—'}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] p-3 text-center">
            <p className="text-[#d4780f] font-bold text-2xl">{orderHistory.length}</p>
            <p className="text-[10px] uppercase tracking-wider mt-1" style={{ color: '#555' }}>Commandes</p>
          </div>
          <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] p-3 text-center">
            <p className="text-[#d4780f] font-bold text-xl">{totalSpent.toFixed(0)}€</p>
            <p className="text-[10px] uppercase tracking-wider mt-1" style={{ color: '#555' }}>HT dépensé</p>
          </div>
          <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] p-3 text-center">
            <p className="text-[#d4780f] font-bold text-2xl">{favCount}</p>
            <p className="text-[10px] uppercase tracking-wider mt-1" style={{ color: '#555' }}>Favoris</p>
          </div>
        </div>

        {/* Active BDC */}
        {currentBdcId && (
          <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] p-4">
            <p className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: '#555' }}>Bon de commande actif</p>
            <p className="text-white font-mono text-sm">{currentBdcId}</p>
          </div>
        )}

        {/* Contact */}
        <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] overflow-hidden">
          <p className="text-[10px] uppercase tracking-wider px-4 pt-4 pb-2" style={{ color: '#555' }}>Contacter SPINCUT</p>
          <a
            href="https://wa.me/33767739561"
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-white hover:bg-[#1a1a1a] transition-colors"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="#4ade80" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            WhatsApp
          </a>
          <a
            href="mailto:scspincut@gmail.com"
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-white hover:bg-[#1a1a1a] transition-colors border-t border-[#1e1e1e]"
          >
            <svg className="w-5 h-5 flex-shrink-0 text-[#d4780f]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/>
            </svg>
            scspincut@gmail.com
          </a>
        </div>

      </main>

      <BottomNav />
    </div>
  )
}
