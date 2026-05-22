import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClientAuth, getAccessCodes, getClientCode } from '../hooks/useAuth'
import BottomNav from '../components/BottomNav'

interface CatalogProduct {
  sheet: string; row: number; famille: string; ref: string
  diametre: string; lc: string; lt: string; dents: string
  angle: string; queue: string; sens: string
  prix: number; stock: number; pm: boolean; category: string; designation: string
}

interface OrderHistoryEntry {
  date: number
  orderId: string
  isNewBdc: boolean
  items: { ref: string; designation: string; quantity: number; price: number }[]
  total: number
}

function fmt(n: number) { return n.toFixed(2).replace('.', ',') }
function uid(p: CatalogProduct) { return `${p.ref}__${p.row}` }

export default function OrderPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useClientAuth()

  const [catalog, setCatalog] = useState<CatalogProduct[]>([])
  const [orderStatus, setOrderStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [orderError, setOrderError] = useState('')
  const [showHistory, setShowHistory] = useState(true)

  const clientCode = getClientCode()
  const clientInfo = clientCode ? getAccessCodes().find(c => c.code === clientCode) : null
  const clientName = clientInfo?.clientName ?? null

  const cartKey = `spincut_cart_${clientCode ?? 'guest'}`
  const bdcKey = `spincut_bdc_${clientCode ?? 'guest'}`
  const historyKey = `spincut_orders_${clientCode ?? 'guest'}`

  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem(`spincut_cart_${getClientCode() ?? 'guest'}`) ?? '{}') } catch { return {} }
  })
  const [orderHistory, setOrderHistory] = useState<OrderHistoryEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem(`spincut_orders_${getClientCode() ?? 'guest'}`) ?? '[]') } catch { return [] }
  })

  useEffect(() => {
    try { localStorage.setItem(cartKey, JSON.stringify(quantities)) } catch { /* ignore */ }
  }, [quantities, cartKey])

  useEffect(() => {
    fetch('/api/catalog')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setCatalog(data) })
      .catch(() => {})
  }, [])

  if (!isAuthenticated) { navigate('/'); return null }

  localStorage.setItem('spincut_last_section', '/commande')

  const setQty = (key: string, delta: number, max: number) =>
    setQuantities(prev => ({ ...prev, [key]: Math.min(max, Math.max(0, (prev[key] || 0) + delta)) }))
  const setQtyDirect = (key: string, val: string, max: number) =>
    setQuantities(prev => ({ ...prev, [key]: Math.min(max, Math.max(0, parseInt(val) || 0)) }))

  const cartItems = catalog.filter(p => (quantities[uid(p)] || 0) > 0)
  const total = cartItems.reduce((s, p) => s + (quantities[uid(p)] || 0) * p.prix, 0)
  const itemCount = cartItems.reduce((s, p) => s + (quantities[uid(p)] || 0), 0)
  const hasItems = itemCount > 0

  const sendOrder = async () => {
    if (orderStatus === 'loading') return
    setOrderStatus('loading'); setOrderError('')
    const items = cartItems.map(p => ({
      ref: p.ref, designation: p.designation,
      queue: p.queue !== '/' ? p.queue : '',
      quantity: quantities[uid(p)], price: p.prix, sheet: p.sheet, row: p.row,
    }))
    try {
      let existingBdcId: string | undefined
      try { existingBdcId = JSON.parse(localStorage.getItem(bdcKey) ?? 'null') ?? undefined } catch { /* ignore */ }

      const res = await fetch('/api/create-order', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName: clientName ?? 'Client SPINCUT', items, existingBdcId }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Erreur serveur')
      const { orderId, isNewBdc } = await res.json()

      try { localStorage.setItem(bdcKey, JSON.stringify(orderId)) } catch { /* ignore */ }

      const entry: OrderHistoryEntry = {
        date: Date.now(), orderId, isNewBdc,
        items: items.map(i => ({ ref: i.ref, designation: i.designation, quantity: i.quantity, price: i.price })),
        total: items.reduce((s, i) => s + i.price * i.quantity, 0),
      }
      const newHistory = [entry, ...orderHistory].slice(0, 20)
      setOrderHistory(newHistory)
      try { localStorage.setItem(historyKey, JSON.stringify(newHistory)) } catch { /* ignore */ }

      setOrderStatus('success')
      setQuantities({})
      try { localStorage.removeItem(cartKey) } catch { /* ignore */ }
      fetch('/api/catalog').then(r => r.json()).then(d => { if (Array.isArray(d)) setCatalog(d) }).catch(() => {})
    } catch (e: unknown) {
      setOrderStatus('error'); setOrderError(e instanceof Error ? e.message : 'Erreur inconnue')
    }
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0d0d0d] border-b border-[#1a1a1a]">
        <div className="max-w-2xl mx-auto px-4 py-2 flex items-center justify-center">
          <img src="/logo.png" alt="SPINCUT Outils CNC" style={{ height: '38px', objectFit: 'contain' }} />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pb-36 pt-4 space-y-4">

        {/* Status messages */}
        {orderStatus === 'success' && (
          <div className="rounded-xl bg-[#061510] border border-green-800 px-4 py-3 flex items-center gap-3">
            <span className="text-green-400 text-lg">✓</span>
            <div className="flex-1">
              <p className="text-green-400 text-sm font-semibold">Commande envoyée !</p>
              <p className="text-green-800 text-xs mt-0.5">Votre bon de commande a été créé — SPINCUT vous recontacte sous 24h.</p>
            </div>
            <button onClick={() => setOrderStatus('idle')} className="text-green-800 hover:text-green-400 text-xl leading-none">×</button>
          </div>
        )}
        {orderStatus === 'error' && (
          <div className="rounded-xl bg-[#2a0000] border border-red-800 px-4 py-3 flex items-center gap-3">
            <p className="text-red-400 text-sm flex-1">{orderError || 'Une erreur est survenue.'}</p>
            <button onClick={() => setOrderStatus('idle')} className="text-red-800 hover:text-red-400 text-xl leading-none">×</button>
          </div>
        )}

        {/* Commande en cours */}
        {hasItems ? (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#555] mb-3">Commande en cours</p>
            <div className="rounded-xl border border-[#2a2a2a] overflow-hidden divide-y divide-[#1e1e1e]">
              {cartItems.map(item => {
                const key = uid(item)
                const qty = quantities[key] || 0
                return (
                  <div key={key} className="px-4 py-3 flex items-center gap-3 bg-[#111]">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium leading-snug truncate">{item.designation}</p>
                      <p className="text-[#d4780f] text-xs font-medium mt-0.5">{fmt(qty * item.prix)} € HT</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => setQty(key, -1, item.stock)}
                        className="w-8 h-8 rounded-lg bg-[#d4780f] flex items-center justify-center font-bold text-lg text-white"
                      >−</button>
                      <input type="number" min={0} max={item.stock} value={qty}
                        onChange={e => setQtyDirect(key, e.target.value, item.stock)}
                        className="w-9 text-center bg-transparent text-[#d4780f] font-bold text-sm outline-none"
                      />
                      <button onClick={() => setQty(key, +1, item.stock)}
                        className="w-8 h-8 rounded-lg bg-[#d4780f] flex items-center justify-center font-bold text-lg text-white hover:bg-[#b86400] transition-colors active:scale-95"
                      >+</button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Total + send */}
            <div className="mt-3 flex items-center justify-between px-1">
              <div>
                <p className="text-[#555] text-xs">{itemCount} article{itemCount > 1 ? 's' : ''}</p>
                <p className="text-[#d4780f] font-bold text-xl">{fmt(total)} € HT</p>
              </div>
              <button onClick={sendOrder} disabled={orderStatus === 'loading'}
                className="py-3 px-6 rounded-xl bg-[#d4780f] text-white text-sm font-bold hover:bg-[#b86400] active:scale-95 transition-all flex items-center gap-2 disabled:opacity-60"
              >
                {orderStatus === 'loading'
                  ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Envoi…</>
                  : 'Commander →'
                }
              </button>
            </div>
          </div>
        ) : orderStatus !== 'success' && orderHistory.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#161616] border border-[#2a2a2a] flex items-center justify-center">
              <svg className="w-8 h-8 text-[#333]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-lg">Aucune commande en cours</p>
              <p className="text-[#555] text-sm mt-1">Ajoutez des produits depuis la Boutique ou le Calculateur</p>
            </div>
            <button onClick={() => navigate('/boutique')}
              className="py-3 px-6 rounded-xl bg-[#d4780f] text-white text-sm font-bold hover:bg-[#b86400] active:scale-95 transition-all"
            >
              Aller à la Boutique
            </button>
          </div>
        ) : null}

        {/* Historique commandes */}
        {orderHistory.length > 0 && (
          <div>
            <button
              onClick={() => setShowHistory(h => !h)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[#161616] border border-[#2a2a2a] text-sm font-semibold text-[#888] hover:text-white transition-colors"
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#d4780f]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                Mes commandes
                <span className="text-[10px] bg-[#d4780f]/20 text-[#d4780f] px-1.5 py-0.5 rounded-full font-bold">{orderHistory.length}</span>
              </span>
              <svg className={`w-4 h-4 transition-transform ${showHistory ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
            </button>
            {showHistory && (
              <div className="mt-2 space-y-2">
                {orderHistory.map((entry, i) => (
                  <div key={i} className="rounded-xl bg-[#161616] border border-[#2a2a2a] overflow-hidden">
                    <div className="px-4 py-2.5 flex items-center justify-between border-b border-[#1e1e1e]">
                      <span className="text-[#888] text-xs">{new Date(entry.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${entry.isNewBdc ? 'bg-blue-900/30 text-blue-400' : 'bg-[#3a1e00] text-[#d4780f]'}`}>
                          {entry.isNewBdc ? 'Nouveau BDC' : 'Ajout BDC'}
                        </span>
                        <span className="text-[#d4780f] text-xs font-bold">{entry.total.toFixed(2).replace('.', ',')} € HT</span>
                      </div>
                    </div>
                    <div className="px-4 py-2 space-y-1">
                      {entry.items.map((item, j) => (
                        <div key={j} className="flex items-center justify-between text-xs">
                          <span className="text-[#aaa] truncate flex-1 mr-2">{item.quantity}× {item.designation}</span>
                          <span className="text-[#555] flex-shrink-0">{(item.quantity * item.price).toFixed(2).replace('.', ',')} €</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNav cartCount={itemCount} cartTotal={total} />
    </div>
  )
}
