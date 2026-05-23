import { useState, useEffect, useMemo } from 'react'
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
  const { isAuthenticated, logout } = useClientAuth()

  const [catalog, setCatalog] = useState<CatalogProduct[]>(() => {
    try { return JSON.parse(localStorage.getItem('spincut_catalog_cache') ?? '[]') } catch { return [] }
  })
  const [orderStatus, setOrderStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [orderError, setOrderError] = useState('')
  const [showHistory, setShowHistory] = useState(true)
  const [lastOrder, setLastOrder] = useState<{ items: { ref: string; designation: string; quantity: number; price: number }[]; total: number; orderId: string; isNewBdc: boolean } | null>(null)

  const favKey = `spincut_favs_${getClientCode() ?? 'guest'}`
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(`spincut_favs_${getClientCode() ?? 'guest'}`) ?? '[]')) } catch { return new Set() }
  })
  const toggleFav = (uid: string) => setFavorites(prev => {
    const next = new Set(prev)
    next.has(uid) ? next.delete(uid) : next.add(uid)
    try { localStorage.setItem(favKey, JSON.stringify([...next])) } catch {}
    return next
  })

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
      .then(data => {
        if (Array.isArray(data)) {
          setCatalog(data)
          try { localStorage.setItem('spincut_catalog_cache', JSON.stringify(data)) } catch { /* ignore */ }
        }
      })
      .catch(() => {})
  }, [])

  const habitualItems = useMemo(() => {
    if (orderHistory.length === 0 || catalog.length === 0) return []
    const counts: Record<string, { ref: string; designation: string; price: number; total: number }> = {}
    orderHistory.forEach(entry => entry.items.forEach(item => {
      if (!counts[item.ref]) counts[item.ref] = { ref: item.ref, designation: item.designation, price: item.price, total: 0 }
      counts[item.ref].total += item.quantity
    }))
    return Object.values(counts)
      .sort((a, b) => b.total - a.total)
      .slice(0, 6)
      .map(h => catalog.find(p => p.ref === h.ref))
      .filter((p): p is CatalogProduct => !!p && p.stock > 0)
  }, [orderHistory, catalog])

  const favoriteItems = useMemo(() =>
    catalog.filter(p => favorites.has(uid(p)) && p.stock > 0),
  [catalog, favorites])

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

      const orderedItems = items.map(i => ({ ref: i.ref, designation: i.designation, quantity: i.quantity, price: i.price }))
      setLastOrder({ items: orderedItems, total: orderedItems.reduce((s, i) => s + i.price * i.quantity, 0), orderId, isNewBdc })
      setOrderStatus('success')
      setQuantities({})
      try { localStorage.removeItem(cartKey) } catch { /* ignore */ }
      fetch('/api/catalog').then(r => r.json()).then(d => { if (Array.isArray(d)) setCatalog(d) }).catch(() => {})
    } catch (e: unknown) {
      setOrderStatus('error'); setOrderError(e instanceof Error ? e.message : 'Erreur inconnue')
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-black border-b border-[#1a1a1a]">
        <div className="max-w-2xl mx-auto px-4 py-2 relative flex items-center justify-center">
          <button
            onClick={() => navigate('/profil')}
            className="absolute left-4 flex items-center gap-1 text-[#555] hover:text-white text-xs transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            Profil
          </button>
          <img src="/logo.png" alt="SPINCUT Outils CNC" style={{ height: '120px', objectFit: 'contain', mixBlendMode: 'screen' }} />
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

      {/* Main */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pb-36 pt-4 space-y-4">

        {/* Status messages */}
        {orderStatus === 'success' && lastOrder && (
          <div className="rounded-2xl overflow-hidden" style={{ background: '#061510', border: '1px solid #1a4a2a' }}>
            <div className="px-4 py-3 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#0d2a1a' }}>
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-green-400 font-bold text-sm">Commande envoyée !</p>
                <p className="text-xs mt-0.5" style={{ color: '#3a7a3a' }}>
                  {lastOrder.isNewBdc ? 'Nouveau BDC créé' : 'Ajouté au BDC existant'} · SPINCUT vous recontacte sous 24h
                </p>
              </div>
              <button onClick={() => { setOrderStatus('idle'); setLastOrder(null) }} className="text-xl leading-none flex-shrink-0" style={{ color: '#2a5a2a' }}>×</button>
            </div>
            <div className="px-4 py-3 space-y-1.5" style={{ borderTop: '1px solid #0d2a1a' }}>
              {lastOrder.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="flex-1 mr-2 truncate" style={{ color: '#5a9a5a' }}>{item.quantity}× {item.designation}</span>
                  <span className="flex-shrink-0" style={{ color: '#3a6a3a' }}>{(item.quantity * item.price).toFixed(2).replace('.', ',')} €</span>
                </div>
              ))}
              <div className="flex items-center justify-between text-sm font-bold pt-1.5" style={{ borderTop: '1px solid #0d2a1a' }}>
                <span className="text-green-400">Total</span>
                <span className="text-green-400">{lastOrder.total.toFixed(2).replace('.', ',')} € HT</span>
              </div>
            </div>
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

        {/* Commandes habituelles */}
        {habitualItems.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#555] mb-3">Commandes habituelles</p>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
              {habitualItems.map(p => {
                const key = uid(p)
                const qty = quantities[key] || 0
                return (
                  <div key={key} className="w-40 flex-shrink-0 bg-[#161616] rounded-xl border border-[#2a2a2a] p-3 flex flex-col gap-2">
                    <p className="text-white font-mono text-xs font-semibold leading-tight">{p.ref}</p>
                    <p className="text-[#666] text-[11px] leading-tight line-clamp-2 flex-1">{p.designation}</p>
                    <p className="text-[#d4780f] font-bold text-sm">{p.prix.toFixed(2).replace('.', ',')} € HT</p>
                    {qty === 0 ? (
                      <button onClick={() => setQty(key, 1, p.stock)}
                        className="w-full py-2 rounded-lg text-xs font-bold text-center"
                        style={{ background: '#2a1400', color: '#d4780f', border: '1px solid #d4780f33' }}
                      >+ Ajouter</button>
                    ) : (
                      <div className="flex items-center justify-between gap-1">
                        <button onClick={() => setQty(key, -1, p.stock)} className="flex-1 h-7 rounded-lg bg-[#d4780f] flex items-center justify-center font-bold text-white text-base">−</button>
                        <span className="w-6 text-center text-[#d4780f] font-bold text-sm">{qty}</span>
                        <button onClick={() => setQty(key, +1, p.stock)} className="flex-1 h-7 rounded-lg bg-[#d4780f] flex items-center justify-center font-bold text-white text-base hover:bg-[#b86400] transition-colors active:scale-95">+</button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Favoris */}
        {favoriteItems.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#555] mb-3 flex items-center gap-1.5">
              <svg width="11" height="11" fill="#e03c3c" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
              Mes favoris
            </p>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
              {favoriteItems.map(p => {
                const key = uid(p)
                const qty = quantities[key] || 0
                return (
                  <div key={key} className="w-40 flex-shrink-0 bg-[#161616] rounded-xl border border-[#2a2a2a] p-3 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-1">
                      <p className="text-white font-mono text-xs font-semibold leading-tight flex-1 mr-1">{p.ref}</p>
                      <button onClick={() => toggleFav(key)} className="flex-shrink-0" style={{ color: '#e03c3c' }}>
                        <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                      </button>
                    </div>
                    <p className="text-[#666] text-[11px] leading-tight line-clamp-2 flex-1">{p.designation}</p>
                    <p className="text-[#d4780f] font-bold text-sm">{p.prix.toFixed(2).replace('.', ',')} € HT</p>
                    {qty === 0 ? (
                      <button onClick={() => setQty(key, 1, p.stock)}
                        className="w-full py-2 rounded-lg text-xs font-bold text-center"
                        style={{ background: '#2a1400', color: '#d4780f', border: '1px solid #d4780f33' }}
                      >+ Ajouter</button>
                    ) : (
                      <div className="flex items-center justify-between gap-1">
                        <button onClick={() => setQty(key, -1, p.stock)} className="flex-1 h-7 rounded-lg bg-[#d4780f] flex items-center justify-center font-bold text-white text-base">−</button>
                        <span className="w-6 text-center text-[#d4780f] font-bold text-sm">{qty}</span>
                        <button onClick={() => setQty(key, +1, p.stock)} className="flex-1 h-7 rounded-lg bg-[#d4780f] flex items-center justify-center font-bold text-white text-base hover:bg-[#b86400] transition-colors active:scale-95">+</button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

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
                <button
                  onClick={() => {
                    if (!confirm('Effacer tout l\'historique des commandes ?')) return
                    setOrderHistory([])
                    try { localStorage.removeItem(historyKey); localStorage.removeItem(bdcKey) } catch { /* ignore */ }
                  }}
                  className="w-full text-center text-[10px] text-[#333] hover:text-[#555] py-2 transition-colors"
                >
                  Effacer l'historique
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNav cartCount={itemCount} cartTotal={total} />
    </div>
  )
}
