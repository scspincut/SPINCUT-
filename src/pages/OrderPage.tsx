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

interface AbbyProfile {
  id: string
  firstname: string
  lastname: string
  emails: string[]
  phone: string
  billingAddress: {
    address: string | null
    complement?: string | null
    city: string | null
    zipCode: string | null
    country: string
  } | null
}

interface StockItem {
  ref: string
  designation: string
  qty: number
  minQty: number
  updatedAt: number
}

type PageTab = 'commandes' | 'factures' | 'stock'
type AbbyOrder = { id: string; number: string; state: string; label: string; total: number; date: number; items: { ref: string; designation: string; qty: number }[] }
type AbbyInvoice = { id: string; number: string; state: string; label: string; amount: number; dueAt?: number }

function fmt(n: number) { return n.toFixed(2).replace('.', ',') }
function uid(p: CatalogProduct) { return `${p.ref}__${p.row}` }
// Abby dueAt may be seconds or ms — normalise to ms
function toMs(ts: number) { return ts > 9_999_999_999 ? ts : ts * 1000 }

export default function OrderPage() {
  const navigate = useNavigate()
  const { isAuthenticated, logout } = useClientAuth()

  const clientCode = getClientCode()
  const clientInfo = clientCode ? getAccessCodes().find(c => c.code === clientCode) : null
  const clientName = clientInfo?.clientName ?? null

  const cartKey    = `spincut_cart_${clientCode ?? 'guest'}`
  const bdcKey     = `spincut_bdc_${clientCode ?? 'guest'}`
  const historyKey = `spincut_orders_${clientCode ?? 'guest'}`
  const stockKey   = `spincut_stock_${clientCode ?? 'guest'}`

  const [pageTab, setPageTab] = useState<PageTab>('commandes')

  const [catalog, setCatalog] = useState<CatalogProduct[]>(() => {
    try { return JSON.parse(localStorage.getItem('spincut_catalog_cache') ?? '[]') } catch { return [] }
  })
  const [orderStatus, setOrderStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [orderError, setOrderError]   = useState('')
  const [showHistory, setShowHistory] = useState(true)
  const [lastOrder, setLastOrder]     = useState<{ items: { ref: string; designation: string; quantity: number; price: number }[]; total: number; orderId: string; isNewBdc: boolean } | null>(null)

  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem(`spincut_cart_${getClientCode() ?? 'guest'}`) ?? '{}') } catch { return {} }
  })
  const [orderHistory, setOrderHistory] = useState<OrderHistoryEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem(`spincut_orders_${getClientCode() ?? 'guest'}`) ?? '[]') } catch { return [] }
  })
  const [stock, setStock] = useState<StockItem[]>(() => {
    try { return JSON.parse(localStorage.getItem(`spincut_stock_${getClientCode() ?? 'guest'}`) ?? '[]') } catch { return [] }
  })
  const [showAddStock, setShowAddStock] = useState(false)
  const [stockSearch, setStockSearch]   = useState('')
  const [addedToCart, setAddedToCart]   = useState<string | null>(null)

  const [abbyOrders, setAbbyOrders]     = useState<AbbyOrder[]>([])
  const [abbyInvoices, setAbbyInvoices] = useState<AbbyInvoice[]>([])
  const [profile, setProfile]           = useState<AbbyProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    if (!clientName) return
    setProfileLoading(true)
    fetch(`/api/client-profile?clientName=${encodeURIComponent(clientName)}`)
      .then(r => r.json())
      .then(data => { if (!data.error) setProfile(data) })
      .catch(() => {})
      .finally(() => setProfileLoading(false))
  }, [clientName])

  useEffect(() => {
    if (!clientName) return
    const orderIds = [...new Set(
      (() => { try { return (JSON.parse(localStorage.getItem(historyKey) ?? '[]') as OrderHistoryEntry[]).map(h => h.orderId).filter(Boolean) } catch { return [] } })()
    )]
    fetch('/api/client-dashboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientName, orderIds }),
    })
      .then(r => r.json())
      .then(data => {
        if (!data.error) {
          setAbbyOrders(data.orders ?? [])
          setAbbyInvoices(data.invoices ?? [])
        }
      })
      .catch(() => {})
  }, [clientName])

  useEffect(() => {
    try { localStorage.setItem(cartKey, JSON.stringify(quantities)) } catch { /* ignore */ }
  }, [quantities, cartKey])

  useEffect(() => {
    try { localStorage.setItem(stockKey, JSON.stringify(stock)) } catch { /* ignore */ }
  }, [stock, stockKey])

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

  const catalogSearchResults = useMemo(() => {
    if (!stockSearch.trim()) return []
    const q = stockSearch.toLowerCase()
    return catalog
      .filter(p => {
        if (stock.find(s => s.ref === p.ref)) return false
        return p.ref.toLowerCase().includes(q) || p.designation.toLowerCase().includes(q)
      })
      .slice(0, 10)
  }, [stockSearch, catalog, stock])

  if (!isAuthenticated) { navigate('/'); return null }
  localStorage.setItem('spincut_last_section', '/commande')

  const setQty = (key: string, delta: number, max: number) =>
    setQuantities(prev => ({ ...prev, [key]: Math.min(max, Math.max(0, (prev[key] || 0) + delta)) }))
  const setQtyDirect = (key: string, val: string, max: number) =>
    setQuantities(prev => ({ ...prev, [key]: Math.min(max, Math.max(0, parseInt(val) || 0)) }))

  const cartItems = catalog.filter(p => (quantities[uid(p)] || 0) > 0)
  const total     = cartItems.reduce((s, p) => s + (quantities[uid(p)] || 0) * p.prix, 0)
  const itemCount = cartItems.reduce((s, p) => s + (quantities[uid(p)] || 0), 0)
  const hasItems  = itemCount > 0
  const totalDue  = abbyInvoices.reduce((s, inv) => s + inv.amount, 0)

  const currentBdcId: string | null = (() => {
    try { return JSON.parse(localStorage.getItem(bdcKey) ?? 'null') } catch { return null }
  })()

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

  // ── Stock helpers ──────────────────────────────────────────────────────────
  const addToStock = (ref: string, designation: string) => {
    if (stock.find(s => s.ref === ref)) return
    setStock(prev => [...prev, { ref, designation, qty: 0, minQty: 1, updatedAt: Date.now() }])
    setShowAddStock(false)
    setStockSearch('')
  }
  const updateStockQty = (ref: string, delta: number) =>
    setStock(prev => prev.map(s => s.ref === ref ? { ...s, qty: Math.max(0, s.qty + delta), updatedAt: Date.now() } : s))
  const updateStockMin = (ref: string, val: string) =>
    setStock(prev => prev.map(s => s.ref === ref ? { ...s, minQty: Math.max(1, parseInt(val) || 1) } : s))
  const removeFromStock = (ref: string) =>
    setStock(prev => prev.filter(s => s.ref !== ref))
  const addToCartFromStock = (item: StockItem) => {
    const catalogItem = catalog.find(p => p.ref === item.ref && p.stock > 0) ?? catalog.find(p => p.ref === item.ref)
    if (!catalogItem) return
    const key = uid(catalogItem)
    setQuantities(prev => ({ ...prev, [key]: (prev[key] || 0) + 1 }))
    setAddedToCart(item.ref)
    setTimeout(() => setAddedToCart(null), 2500)
  }
  const stockStatus = (item: StockItem): 'ok' | 'low' | 'empty' => {
    if (item.qty === 0) return 'empty'
    if (item.qty < item.minQty) return 'low'
    return 'ok'
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">

      {/* Header + tabs — one sticky block */}
      <div className="sticky top-0 z-30 bg-black">
        <header className="border-b border-[#1a1a1a]">
          <div className="max-w-2xl mx-auto px-4 py-2 relative flex items-center justify-center">
            <button onClick={() => navigate('/profil')}
              className="absolute left-4 flex items-center gap-1 text-[#555] hover:text-white text-xs transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              Profil
            </button>
            <img src="/logo-banniere.png" alt="SPINCUT Outils CNC" style={{ height: '60px', objectFit: 'contain', mixBlendMode: 'screen', maskImage: 'radial-gradient(ellipse 95% 90% at 50% 50%, black 50%, transparent 100%)', WebkitMaskImage: 'radial-gradient(ellipse 95% 90% at 50% 50%, black 50%, transparent 100%)' }} />
            <button onClick={() => { logout(); navigate('/') }}
              className="absolute right-4 flex items-center gap-1 text-[#555] hover:text-white text-xs transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
              Déconnexion
            </button>
          </div>
        </header>

        {/* Sub-tabs */}
        <div className="border-b border-[#1a1a1a]">
          <div className="flex max-w-2xl mx-auto">
            {(['commandes', 'factures', 'stock'] as PageTab[]).map(tab => {
              const labels: Record<PageTab, string> = { commandes: 'Commandes', factures: 'Factures', stock: 'Mon Stock' }
              const badge = tab === 'factures' ? abbyInvoices.length : tab === 'commandes' ? itemCount : 0
              const badgeRed = tab === 'factures'
              return (
                <button
                  key={tab}
                  onClick={() => setPageTab(tab)}
                  className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider transition-colors relative ${
                    pageTab === tab ? 'text-[#d4780f]' : 'text-[#555] hover:text-[#888]'
                  }`}
                >
                  <span className="relative inline-flex items-center gap-1.5">
                    {labels[tab]}
                    {badge > 0 && (
                      <span className={`min-w-[16px] h-4 rounded-full text-white text-[9px] font-black flex items-center justify-center px-1 ${
                        badgeRed ? 'bg-red-500' : 'bg-[#d4780f]'
                      }`}>{badge}</span>
                    )}
                  </span>
                  {pageTab === tab && (
                    <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-[#d4780f] rounded-t" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pb-36 pt-4">

        {/* ═══════════════════════════ COMMANDES ═══════════════════════════ */}
        {pageTab === 'commandes' && (
          <div className="space-y-4">

            {/* Profile + stats */}
            <div className="rounded-2xl bg-[#161616] border border-[#2a2a2a] overflow-hidden">
              <p className="text-[10px] uppercase tracking-wider px-4 pt-4 pb-3" style={{ color: '#555' }}>Tableau de bord</p>
              <div className="px-4 pb-4">
                {profileLoading ? (
                  <div className="flex items-center gap-2 text-[#444] text-sm">
                    <svg className="animate-spin w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Chargement du profil…
                  </div>
                ) : profile ? (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#2a1400', border: '1.5px solid rgba(212,120,15,0.25)' }}>
                      <svg className="w-5 h-5 text-[#d4780f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="text-white font-bold text-sm leading-tight">
                        {[profile.firstname, profile.lastname].filter(Boolean).join(' ') || clientName || '—'}
                      </p>
                      {profile.emails?.[0] && <p className="text-[#888] text-xs truncate">{profile.emails[0]}</p>}
                      {profile.phone && <p className="text-[#888] text-xs">{profile.phone}</p>}
                      {profile.billingAddress?.address && (
                        <p className="text-[#555] text-[11px] leading-tight">
                          {profile.billingAddress.address}
                          {profile.billingAddress.complement ? `, ${profile.billingAddress.complement}` : ''}
                          {' — '}{[profile.billingAddress.zipCode, profile.billingAddress.city].filter(Boolean).join(' ')}
                        </p>
                      )}
                    </div>
                    <button onClick={() => navigate('/profil')}
                      className="text-[10px] text-[#d4780f] border border-[#d4780f]/30 px-2 py-1 rounded-lg hover:bg-[#d4780f]/10 transition-colors flex-shrink-0"
                    >Modifier</button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-bold">{clientName ?? 'Client SPINCUT'}</p>
                      <p className="text-[#444] text-xs mt-0.5">Profil Abby non trouvé</p>
                    </div>
                    <button onClick={() => navigate('/profil')} className="text-[10px] text-[#555] border border-[#2a2a2a] px-2 py-1 rounded-lg hover:text-white transition-colors">Profil</button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 divide-x divide-[#2a2a2a] border-t border-[#2a2a2a]">
                <div className="px-3 py-4 text-center">
                  <p className="text-[#d4780f] font-black text-2xl">{orderHistory.length}</p>
                  <p className="text-[10px] uppercase tracking-wider mt-1" style={{ color: '#555' }}>Commandes</p>
                </div>
                <div className="px-3 py-4 text-center">
                  <p className="text-[#d4780f] font-black text-2xl">{orderHistory.reduce((s, e) => s + e.total, 0).toFixed(0)}€</p>
                  <p className="text-[10px] uppercase tracking-wider mt-1" style={{ color: '#555' }}>Total HT</p>
                </div>
                <div className="px-3 py-4 text-center">
                  <p className="text-white font-black text-2xl">{orderHistory.reduce((s, e) => s + e.items.reduce((ss, i) => ss + i.quantity, 0), 0)}</p>
                  <p className="text-[10px] uppercase tracking-wider mt-1" style={{ color: '#555' }}>Articles</p>
                </div>
              </div>
              {currentBdcId && (
                <div className="px-4 py-3 border-t border-[#2a2a2a] flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: '#555' }}>Bon de commande actif</p>
                    <p className="text-white font-mono text-sm mt-0.5">{currentBdcId}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-[#d4780f]/20 text-[#d4780f]">En cours</span>
                </div>
              )}
              <div className="px-4 py-2.5 border-t border-[#1a1a1a] flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-wider" style={{ color: '#444' }}>Code client</p>
                <p className="text-[#555] font-mono text-xs">{clientCode ?? '—'}</p>
              </div>
            </div>

            {/* Abby active orders */}
            {abbyOrders.length > 0 && (
              <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #2a1a00', background: '#0a0600' }}>
                <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid #1a1000' }}>
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="#d4780f" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                  <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#d4780f' }}>Commandes en cours</p>
                </div>
                {abbyOrders.map((order, i) => (
                  <div key={order.id} className="px-4 py-3" style={{ borderBottom: i < abbyOrders.length - 1 ? '1px solid #111' : 'none' }}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono" style={{ color: '#555' }}>{order.number || `#${order.id.slice(-6)}`}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{
                          background: order.state === 'signed' ? '#0d1a0d' : '#1a1000',
                          color: order.state === 'signed' ? '#4ade80' : '#d4780f',
                        }}>{order.label}</span>
                      </div>
                      <span className="text-sm font-bold text-white">{fmt(order.total)} <span className="text-[10px] font-normal" style={{ color: '#555' }}>€ HT</span></span>
                    </div>
                    {order.items.length > 0 && (
                      <p className="text-[11px]" style={{ color: '#555' }}>
                        {order.items.slice(0, 2).map(it => it.designation || it.ref).join(' · ')}{order.items.length > 2 ? ' …' : ''}
                      </p>
                    )}
                    {order.date > 0 && (
                      <p className="text-[10px] mt-0.5" style={{ color: '#333' }}>{new Date(order.date).toLocaleDateString('fr-FR')}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Order success / error */}
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
                    <span className="text-green-400">Total HT</span>
                    <span className="text-green-400">{lastOrder.total.toFixed(2).replace('.', ',')} €</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-0.5" style={{ color: '#3a7a3a' }}>
                    <span>Total TTC (TVA 20%)</span>
                    <span>{(lastOrder.total * 1.2).toFixed(2).replace('.', ',')} €</span>
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

            {/* Cart */}
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
                          <button onClick={() => setQty(key, -1, item.stock)} className="w-8 h-8 rounded-lg bg-[#d4780f] flex items-center justify-center font-bold text-lg text-white">−</button>
                          <input type="number" min={0} max={item.stock} value={qty}
                            onChange={e => setQtyDirect(key, e.target.value, item.stock)}
                            className="w-9 text-center bg-transparent text-[#d4780f] font-bold text-sm outline-none"
                          />
                          <button onClick={() => setQty(key, +1, item.stock)} className="w-8 h-8 rounded-lg bg-[#d4780f] flex items-center justify-center font-bold text-lg text-white hover:bg-[#b86400] transition-colors active:scale-95">+</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-3 flex items-center justify-between px-1">
                  <div>
                    <p className="text-[#555] text-xs">{itemCount} article{itemCount > 1 ? 's' : ''}</p>
                    <p className="text-[#d4780f] font-bold text-xl">{fmt(total)} € HT</p>
                    <p className="text-[#888] text-xs">{fmt(total * 1.2)} € TTC</p>
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
              <div className="flex flex-col items-center justify-center py-16 gap-5 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#161616] border border-[#2a2a2a] flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#333]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-white font-bold text-lg">Aucune commande en cours</p>
                  <p className="text-[#555] text-sm mt-1">Ajoutez des produits depuis la Boutique ou le Calculateur</p>
                </div>
                <button onClick={() => navigate('/boutique')} className="py-3 px-6 rounded-xl bg-[#d4780f] text-white text-sm font-bold hover:bg-[#b86400] active:scale-95 transition-all">
                  Aller à la Boutique
                </button>
              </div>
            ) : null}

            {/* Habitual items */}
            {habitualItems.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#555] mb-3">Mes derniers achats</p>
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
                          <button onClick={() => setQty(key, 1, p.stock)} className="w-full py-2 rounded-lg text-xs font-bold text-center" style={{ background: '#2a1400', color: '#d4780f', border: '1px solid #d4780f33' }}>+ Ajouter</button>
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

            {/* Order history */}
            {orderHistory.length > 0 && (
              <div>
                <button
                  onClick={() => setShowHistory(h => !h)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[#161616] border border-[#2a2a2a] text-sm font-semibold text-[#888] hover:text-white transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#d4780f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>
                    Mes commandes
                    <span className="text-[10px] bg-[#d4780f]/20 text-[#d4780f] px-1.5 py-0.5 rounded-full font-bold">{orderHistory.length}</span>
                  </span>
                  <svg className={`w-4 h-4 transition-transform ${showHistory ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
                {showHistory && (
                  <div className="mt-2 space-y-2">
                    {orderHistory.map((entry, i) => (
                      <div key={i} className="rounded-xl bg-[#161616] border border-[#2a2a2a] overflow-hidden">
                        <div className="px-4 py-2.5 flex items-center justify-between border-b border-[#1e1e1e]">
                          <span className="text-[#888] text-xs">
                            {new Date(entry.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
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
          </div>
        )}

        {/* ════════════════════════════ FACTURES ═══════════════════════════ */}
        {pageTab === 'factures' && (
          <div className="space-y-4">
            {abbyInvoices.length > 0 ? (
              <>
                {/* Summary banner */}
                <div className="rounded-2xl overflow-hidden" style={{ background: '#0a0202', border: '1px solid #3a1010' }}>
                  <div className="px-5 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#884444' }}>Solde à régler</p>
                      <p className="text-2xl font-black text-white">{fmt(totalDue)} <span className="text-sm font-normal text-[#666]">€ TTC</span></p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-xs text-red-400 font-bold">{abbyInvoices.length} facture{abbyInvoices.length > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>

                {/* Invoice cards */}
                {abbyInvoices.map(inv => {
                  const dueMs = inv.dueAt ? toMs(inv.dueAt) : null
                  const isLate = dueMs != null && dueMs < Date.now()
                  const waMsg = encodeURIComponent(`Bonjour, je souhaite régler ma facture n° ${inv.number} — Montant : ${fmt(inv.amount)} € TTC`)
                  return (
                    <div key={inv.id} className="rounded-2xl overflow-hidden" style={{ background: '#0d0404', border: `1px solid ${isLate ? '#5a1515' : '#2a1010'}` }}>
                      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-white font-mono font-bold text-sm">{inv.number || `#${inv.id.slice(-6)}`}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isLate ? 'bg-red-900/60 text-red-400' : 'bg-[#2a1010] text-red-300'}`}>
                              {isLate ? '⚠ En retard' : 'En attente'}
                            </span>
                          </div>
                          {dueMs != null && (
                            <p className={`text-[11px] ${isLate ? 'text-red-400' : 'text-[#666]'}`}>
                              Échéance : {new Date(dueMs).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xl font-black text-white">{fmt(inv.amount)}</p>
                          <p className="text-[10px] text-[#555]">€ TTC</p>
                        </div>
                      </div>
                      <div className="px-4 pb-4">
                        <a
                          href={`https://wa.me/33767739561?text=${waMsg}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-bold text-sm text-white transition-all active:scale-95"
                          style={{ background: '#25D366' }}
                        >
                          <svg width="18" height="18" fill="white" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          Contacter pour payer
                        </a>
                      </div>
                    </div>
                  )
                })}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#161616] border border-[#2a2a2a] flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#333]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-white font-bold text-lg">Aucune facture en attente</p>
                  <p className="text-[#555] text-sm mt-1">Vos factures sont toutes réglées</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════ MON STOCK ════════════════════════════ */}
        {pageTab === 'stock' && (
          <div className="space-y-4">

            {/* Header row */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-bold text-sm">Gestion de stock</p>
                <p className="text-[#555] text-xs mt-0.5">Suivez vos outils et commandez au bon moment</p>
              </div>
              <button
                onClick={() => setShowAddStock(true)}
                className="flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold text-white active:scale-95 transition-all"
                style={{ background: '#d4780f' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
                </svg>
                Ajouter
              </button>
            </div>

            {/* Added-to-cart toast */}
            {addedToCart && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium" style={{ background: '#0d1a0d', border: '1px solid #1a4a1a', color: '#4ade80' }}>
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                </svg>
                Ajouté au panier — allez dans l'onglet Commandes
              </div>
            )}

            {/* Stock items */}
            {stock.length > 0 ? (
              <div className="space-y-3">
                {stock.map(item => {
                  const status = stockStatus(item)
                  const cfg = {
                    ok:    { color: '#4ade80', bg: '#0d1a0d', label: 'OK',       border: '#1a4a1a' },
                    low:   { color: '#fbbf24', bg: '#1a1400', label: 'Faible',   border: '#3a2a00' },
                    empty: { color: '#f87171', bg: '#1a0505', label: 'Rupture',  border: '#4a1010' },
                  }[status]
                  const canOrder = catalog.some(p => p.ref === item.ref)
                  return (
                    <div key={item.ref} className="rounded-2xl overflow-hidden" style={{ background: '#111', border: `1px solid ${cfg.border}` }}>
                      {/* Tool info row */}
                      <div className="px-4 pt-3 pb-2 flex items-start gap-3">
                        <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: cfg.color }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold leading-snug">{item.designation}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[#555] font-mono text-[10px]">{item.ref}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                          </div>
                        </div>
                        <button onClick={() => removeFromStock(item.ref)} className="flex-shrink-0 p-1.5 text-[#333] hover:text-red-400 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        </button>
                      </div>
                      {/* Qty + min row */}
                      <div className="px-4 pb-3 flex items-center gap-3">
                        <span className="text-[11px] text-[#555] flex-shrink-0">Stock :</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateStockQty(item.ref, -1)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg text-white"
                            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>−</button>
                          <span className="w-10 text-center font-black text-lg" style={{ color: cfg.color }}>{item.qty}</span>
                          <button onClick={() => updateStockQty(item.ref, +1)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg text-white"
                            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>+</button>
                        </div>
                        <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">
                          <span className="text-[10px] text-[#444]">min.</span>
                          <input
                            type="number" min={1} value={item.minQty}
                            onChange={e => updateStockMin(item.ref, e.target.value)}
                            className="w-10 text-center text-sm font-bold rounded-lg py-1 outline-none"
                            style={{ background: '#161616', color: '#888', border: '1px solid #2a2a2a' }}
                          />
                        </div>
                      </div>
                      {/* Reorder button */}
                      {(status === 'low' || status === 'empty') && canOrder && (
                        <div className="px-4 pb-4">
                          <button
                            onClick={() => addToCartFromStock(item)}
                            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95"
                            style={{ background: '#2a1400', color: '#d4780f', border: '1px solid rgba(212,120,15,0.2)' }}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                            </svg>
                            Réapprovisionner
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-5 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#161616] border border-[#2a2a2a] flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#333]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                  </svg>
                </div>
                <div>
                  <p className="text-white font-bold text-lg">Aucun outil suivi</p>
                  <p className="text-[#555] text-sm mt-1">Ajoutez vos outils pour gérer vos niveaux de stock</p>
                </div>
                <button onClick={() => setShowAddStock(true)} className="py-3 px-6 rounded-xl bg-[#d4780f] text-white text-sm font-bold hover:bg-[#b86400] active:scale-95 transition-all">
                  Ajouter un outil
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add-to-stock modal */}
      {showAddStock && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.8)' }}
          onClick={() => { setShowAddStock(false); setStockSearch('') }}
        >
          <div
            className="w-full max-w-lg rounded-t-2xl flex flex-col"
            style={{ background: '#161616', border: '1px solid #2a2a2a', maxHeight: '80vh' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="px-4 py-4 flex items-center justify-between border-b border-[#2a2a2a] flex-shrink-0">
              <p className="font-bold text-white text-sm">Ajouter un outil au stock</p>
              <button onClick={() => { setShowAddStock(false); setStockSearch('') }} className="text-[#555] hover:text-white text-2xl leading-none">×</button>
            </div>
            <div className="px-4 py-3 flex-shrink-0">
              <input
                autoFocus
                type="text"
                placeholder="Rechercher par réf. ou désignation…"
                value={stockSearch}
                onChange={e => setStockSearch(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-[#444] outline-none"
                style={{ background: '#0d0d0d', border: '1px solid #2a2a2a' }}
              />
            </div>
            <div className="overflow-y-auto flex-1 pb-6">
              {stockSearch.trim() === '' ? (
                <p className="text-center text-[#444] text-sm py-8">Tapez une référence ou désignation</p>
              ) : catalogSearchResults.length === 0 ? (
                <p className="text-center text-[#444] text-sm py-8">Aucun résultat pour « {stockSearch} »</p>
              ) : (
                <div className="divide-y divide-[#1a1a1a]">
                  {catalogSearchResults.map(p => (
                    <button
                      key={uid(p)}
                      onClick={() => addToStock(p.ref, p.designation)}
                      className="w-full px-4 py-3 text-left hover:bg-[#1e1e1e] transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{p.designation}</p>
                        <p className="text-[#555] font-mono text-xs mt-0.5">{p.ref}</p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-[#d4780f] font-bold text-sm">{p.prix.toFixed(2).replace('.', ',')} €</p>
                        {p.stock > 0 && <p className="text-[#333] text-[10px]">stock: {p.stock}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <BottomNav cartCount={itemCount} cartTotal={total} invoiceCount={abbyInvoices.length} />
    </div>
  )
}
