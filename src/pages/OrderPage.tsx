import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClientAuth, getAccessCodes, getClientCode, isTestMode } from '../hooks/useAuth'
import BottomNav from '../components/BottomNav'
import TestModeBanner from '../components/TestModeBanner'

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
  blNumber?: string
  items: { ref: string; designation: string; quantity: number; price: number }[]
  total: number
}

type AbbyOrder = {
  id: string; number: string; state: string; label: string
  total: number; date: number; items: { ref: string; designation: string; qty: number }[]
  deliveryStatus?: 'livre' | 'livre_partiel'
}

function fmt(n: number) { return n.toFixed(2).replace('.', ',') }
function uid(p: CatalogProduct) { return `${p.ref}__${p.row}` }

const TEST_LAST_ORDER_KEY = 'spincut_test_last_order'

export default function OrderPage() {
  const navigate = useNavigate()
  const { isAuthenticated, logout } = useClientAuth()

  const clientCode = getClientCode()
  const clientInfo = clientCode ? getAccessCodes().find(c => c.code === clientCode) : null
  const clientName = clientInfo?.clientName ?? null

  const cartKey    = `spincut_cart_${clientCode ?? 'guest'}`
  const bdcKey     = `spincut_bdc_${clientCode ?? 'guest'}`
  const historyKey = `spincut_orders_${clientCode ?? 'guest'}`

  const [catalog, setCatalog] = useState<CatalogProduct[]>(() => {
    try { return JSON.parse(localStorage.getItem('spincut_catalog_cache') ?? '[]') } catch { return [] }
  })
  const [orderStatus, setOrderStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(() => {
    if (isTestMode()) {
      try { return sessionStorage.getItem(TEST_LAST_ORDER_KEY) ? 'success' : 'idle' } catch { return 'idle' }
    }
    return 'idle'
  })
  const [orderError, setOrderError] = useState('')
  const [lastOrder, setLastOrder] = useState<{
    items: { ref: string; designation: string; quantity: number; price: number }[]
    total: number; orderId: string; isNewBdc: boolean; blNumber?: string
  } | null>(() => {
    if (isTestMode()) {
      try { const s = sessionStorage.getItem(TEST_LAST_ORDER_KEY); return s ? JSON.parse(s) : null } catch { return null }
    }
    return null
  })

  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem(`spincut_cart_${getClientCode() ?? 'guest'}`) ?? '{}') } catch { return {} }
  })

  // Demo data
  const DEMO_PENDING: AbbyOrder[] = isTestMode() ? [
    { id: 'demo-1', number: '', state: 'draft', label: 'En cours', total: 187.50,
      date: Date.now() / 1000 - 86400,
      items: [{ ref: 'SC-D12-2F', designation: 'Fraise diamant Ø12 2F mélanine', qty: 3 },
              { ref: 'SC-C08-2F', designation: 'Fraise carbure Ø8 2F bois', qty: 5 }] },
  ] : []

  const DEMO_DELIVERED: AbbyOrder[] = isTestMode() ? [
    { id: 'demo-2', number: 'BDC-2025-038', state: 'delivered', label: 'Livré', total: 94.00,
      date: Date.now() / 1000 - 7 * 86400,
      items: [{ ref: 'SC-C10-2F', designation: 'Fraise carbure Ø10 2F bois dur', qty: 2 }] },
    { id: 'demo-3', number: 'BDC-2025-031', state: 'invoiced', label: 'Livré', total: 312.00,
      date: Date.now() / 1000 - 21 * 86400,
      items: [{ ref: 'SC-D16-3F', designation: 'Fraise diamant Ø16 3+3F', qty: 4 },
              { ref: 'SC-R12', designation: 'Ravageuse Ø12', qty: 2 }] },
  ] : []

  const DEMO_HISTORY: OrderHistoryEntry[] = isTestMode() ? [
    { date: Date.now() - 86400000, orderId: 'demo-1', isNewBdc: true,
      items: [{ ref: 'SC-D12-2F', designation: 'Fraise diamant Ø12 2F mélanine', quantity: 3, price: 37.50 },
              { ref: 'SC-C08-2F', designation: 'Fraise carbure Ø8 2F bois', quantity: 5, price: 15.00 }],
      total: 187.50 },
    { date: Date.now() - 7 * 86400000, orderId: 'demo-2', isNewBdc: true,
      items: [{ ref: 'SC-C10-2F', designation: 'Fraise carbure Ø10 2F bois dur', quantity: 2, price: 47.00 }],
      total: 94.00 },
    { date: Date.now() - 21 * 86400000, orderId: 'demo-3', isNewBdc: true,
      items: [{ ref: 'SC-D16-3F', designation: 'Fraise diamant Ø16 3+3F', quantity: 4, price: 63.00 },
              { ref: 'SC-R12', designation: 'Ravageuse Ø12', quantity: 2, price: 45.00 }],
      total: 342.00 },
  ] : []

  const [orderHistory, setOrderHistory] = useState<OrderHistoryEntry[]>(() => {
    if (isTestMode()) return DEMO_HISTORY
    try { return JSON.parse(localStorage.getItem(`spincut_orders_${getClientCode() ?? 'guest'}`) ?? '[]') } catch { return [] }
  })

  const [pendingOrders, setPendingOrders]     = useState<AbbyOrder[]>(DEMO_PENDING)
  const [deliveredOrders, setDeliveredOrders] = useState<AbbyOrder[]>(DEMO_DELIVERED)
  const [showDelivered, setShowDelivered]     = useState(false)

  useEffect(() => {
    if (isTestMode()) return
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
          setPendingOrders(data.orders ?? [])
          setDeliveredOrders(data.delivered ?? [])
        }
      })
      .catch(() => {})
  }, [clientName])

  useEffect(() => {
    if (!isTestMode()) {
      try { localStorage.setItem(cartKey, JSON.stringify(quantities)) } catch {}
    }
  }, [quantities, cartKey])

  useEffect(() => {
    fetch('/api/catalog')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCatalog(data)
          try { localStorage.setItem('spincut_catalog_cache', JSON.stringify(data)) } catch {}
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

  // Séparer commandes en cours / livrées à partir de l'historique localStorage
  const { pendingEntries, deliveredEntries } = useMemo(() => {
    const deliveredIds = new Set(deliveredOrders.map(o => o.id))
    const pendingIds   = new Set(pendingOrders.map(o => o.id))
    // En cours = BDC encore ouvert dans Abby/GAS
    const pendingEntries   = orderHistory.filter(e => pendingIds.has(e.orderId))
    // Livré = BDC livré OU entrée inconnue (vieux historique = probablement livré)
    const deliveredEntries = orderHistory.filter(e => deliveredIds.has(e.orderId) || !pendingIds.has(e.orderId))
    return { pendingEntries, deliveredEntries }
  }, [orderHistory, pendingOrders, deliveredOrders])

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

  const sendOrder = async () => {
    if (orderStatus === 'loading') return
    setOrderStatus('loading'); setOrderError('')
    const items = cartItems.map(p => ({
      ref: p.ref, designation: p.designation,
      queue: p.queue !== '/' ? p.queue : '',
      quantity: quantities[uid(p)], price: p.prix, sheet: p.sheet, row: p.row,
    }))

    if (isTestMode()) {
      await new Promise(r => setTimeout(r, 800))
      const orderedItems = items.map(i => ({ ref: i.ref, designation: i.designation, quantity: i.quantity, price: i.price }))
      const testTotal = orderedItems.reduce((s, i) => s + i.price * i.quantity, 0)
      const testOrder = { items: orderedItems, total: testTotal, orderId: 'TEST-0000', isNewBdc: true }
      const testEntry: OrderHistoryEntry = { date: Date.now(), orderId: 'TEST-0000', isNewBdc: true, items: orderedItems, total: testTotal }
      setOrderHistory(prev => [testEntry, ...prev].slice(0, 30))
      setPendingOrders(prev => prev.find(o => o.id === 'TEST-0000') ? prev : [...prev, {
        id: 'TEST-0000', number: '', state: 'draft', label: 'En cours', total: testTotal,
        date: Date.now() / 1000, items: orderedItems.map(i => ({ ref: i.ref, designation: i.designation, qty: i.quantity })),
      }])
      fetch('/api/create-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientName: clientName ?? 'Client TEST', items, testMode: true }) }).catch(() => {})
      try { sessionStorage.setItem(TEST_LAST_ORDER_KEY, JSON.stringify(testOrder)) } catch {}
      setLastOrder(testOrder)
      setOrderStatus('success')
      setQuantities({})
      return
    }

    try {
      let existingBdcId: string | undefined
      try { existingBdcId = JSON.parse(localStorage.getItem(bdcKey) ?? 'null') ?? undefined } catch {}
      const commPref = (() => { try { return localStorage.getItem(`spincut_comm_pref_${clientCode ?? 'guest'}`) ?? 'email' } catch { return 'email' } })()
      const res = await fetch('/api/create-order', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName: clientName ?? 'Client SPINCUT', clientCode: clientCode ?? '', commPref, items, existingBdcId }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Erreur serveur')
      const { orderId, isNewBdc, blNumber = '' } = await res.json()
      try { localStorage.setItem(bdcKey, JSON.stringify(orderId)) } catch {}
      const entry: OrderHistoryEntry = {
        date: Date.now(), orderId, isNewBdc, blNumber,
        items: items.map(i => ({ ref: i.ref, designation: i.designation, quantity: i.quantity, price: i.price })),
        total: items.reduce((s, i) => s + i.price * i.quantity, 0),
      }
      const newHistory = [entry, ...orderHistory].slice(0, 30)
      setOrderHistory(newHistory)
      try { localStorage.setItem(historyKey, JSON.stringify(newHistory)) } catch {}
      setLastOrder({ items: entry.items, total: entry.total, orderId, isNewBdc, blNumber })
      setOrderStatus('success')
      setQuantities({})
      try { localStorage.removeItem(cartKey) } catch {}
      // Optimistic update : la commande apparaît immédiatement dans "En cours" sans attendre l'API
      setPendingOrders(prev => prev.some(o => o.id === orderId) ? prev : [
        ...prev,
        { id: orderId, number: blNumber || '', state: 'draft', label: 'En cours',
          total: entry.total, date: Date.now() / 1000,
          items: entry.items.map(i => ({ ref: i.ref, designation: i.designation, qty: i.quantity })) },
      ])
      fetch('/api/catalog').then(r => r.json()).then(d => { if (Array.isArray(d)) setCatalog(d) }).catch(() => {})
      if (clientName) {
        fetch('/api/client-dashboard', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientName, orderIds: [orderId] }),
        }).then(r => r.json()).then(data => {
          if (!data.error) { setPendingOrders(data.orders ?? []); setDeliveredOrders(data.delivered ?? []) }
        }).catch(() => {})
      }
    } catch (e: unknown) {
      setOrderStatus('error'); setOrderError(e instanceof Error ? e.message : 'Erreur inconnue')
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">

      <div className="sticky top-0 z-30 bg-black">
        <header className="border-b border-[#1a1a1a]">
          <div className="max-w-2xl mx-auto px-4 py-2 relative flex items-center justify-center">
            <img src="/logo-banniere.png" alt="SPINCUT" style={{ height: '60px', objectFit: 'contain', mixBlendMode: 'screen', maskImage: 'radial-gradient(ellipse 95% 90% at 50% 50%, black 50%, transparent 100%)', WebkitMaskImage: 'radial-gradient(ellipse 95% 90% at 50% 50%, black 50%, transparent 100%)' }} />
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
      </div>
      {isTestMode() && <TestModeBanner />}

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pb-36 pt-5 space-y-6">

        {/* ── PANIER ── */}
        <section>
          <SectionTitle icon="cart" label="Panier" count={itemCount > 0 ? itemCount : undefined} />

          {orderStatus === 'success' && lastOrder && (
            <div className="rounded-2xl overflow-hidden mb-3" style={{ background: '#061510', border: '1px solid #1a4a2a' }}>
              <div className="px-4 py-3 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#0d2a1a' }}>
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-green-400 font-bold text-sm">Commande envoyée !</p>
                  {lastOrder.blNumber ? (
                    <p className="text-[11px] font-bold mt-1" style={{ color: '#4ade80' }}>Réf. {lastOrder.blNumber}</p>
                  ) : null}
                  <p className="text-[10px] mt-0.5" style={{ color: '#2a8a2a' }}>En cours ci-dessous — livraison sous 48–72h</p>
                </div>
                <button onClick={() => { setOrderStatus('idle'); setLastOrder(null); try { sessionStorage.removeItem(TEST_LAST_ORDER_KEY) } catch {} }} className="text-xl leading-none flex-shrink-0" style={{ color: '#2a5a2a' }}>×</button>
              </div>
              <div className="px-4 py-3 space-y-1.5" style={{ borderTop: '1px solid #0d2a1a' }}>
                {lastOrder.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="flex-1 mr-2 truncate" style={{ color: '#5a9a5a' }}>{item.quantity}× {item.designation}</span>
                    <span style={{ color: '#3a6a3a' }}>{fmt(item.quantity * item.price)} €</span>
                  </div>
                ))}
                <div className="flex items-center justify-between text-sm font-bold pt-1.5" style={{ borderTop: '1px solid #0d2a1a' }}>
                  <span className="text-green-400">Total HT</span>
                  <span className="text-green-400">{fmt(lastOrder.total)} €</span>
                </div>
              </div>
            </div>
          )}

          {orderStatus === 'error' && (
            <div className="rounded-xl bg-[#2a0000] border border-red-800 px-4 py-3 flex items-center gap-3 mb-3">
              <p className="text-red-400 text-sm flex-1">{orderError || 'Une erreur est survenue.'}</p>
              <button onClick={() => setOrderStatus('idle')} className="text-red-800 hover:text-red-400 text-xl leading-none">×</button>
            </div>
          )}

          {hasItems ? (
            <div>
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
                        <button onClick={() => setQty(key, +1, item.stock)} className="w-8 h-8 rounded-lg bg-[#d4780f] flex items-center justify-center font-bold text-lg text-white active:scale-95">+</button>
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
                  className="py-3 px-6 rounded-xl bg-[#d4780f] text-white text-sm font-bold active:scale-95 transition-all flex items-center gap-2 disabled:opacity-60"
                >
                  {orderStatus === 'loading'
                    ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Envoi…</>
                    : 'Commander →'
                  }
                </button>
              </div>
            </div>
          ) : orderStatus !== 'success' ? (
            <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#161616] border border-[#2a2a2a] flex items-center justify-center">
                <svg className="w-7 h-7 text-[#333]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
              </div>
              <div>
                <p className="text-white font-bold">Panier vide</p>
                <p className="text-[#555] text-sm mt-1">Ajoutez des produits depuis la Boutique</p>
              </div>
              <button onClick={() => navigate('/boutique')} className="py-2.5 px-5 rounded-xl bg-[#d4780f] text-white text-sm font-bold active:scale-95 transition-all">
                Aller à la Boutique
              </button>
            </div>
          ) : null}

          {/* Habituels */}
          {habitualItems.length > 0 && (
            <div className="mt-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#555] mb-3">Mes derniers achats</p>
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
                          <button onClick={() => setQty(key, +1, p.stock)} className="flex-1 h-7 rounded-lg bg-[#d4780f] flex items-center justify-center font-bold text-white text-base active:scale-95">+</button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </section>

        {/* ── COMMANDES EN COURS ── */}
        <section>
          <SectionTitle icon="clock" label="Commandes en cours" count={pendingEntries.length || undefined} />
          {pendingEntries.length === 0 ? (
            <p className="text-[#444] text-sm text-center py-6">Aucune commande en cours</p>
          ) : (
            <div className="space-y-2">
              {pendingEntries.map((entry, i) => <OrderCard key={i} entry={entry} />)}
            </div>
          )}
        </section>

        {/* ── COMMANDES LIVRÉES ── */}
        <section>
          <button className="w-full flex items-center justify-between mb-3" onClick={() => setShowDelivered(v => !v)}>
            <SectionTitle icon="check" label="Commandes livrées" count={deliveredEntries.length || undefined} noMargin />
            <svg className={`w-4 h-4 text-[#555] transition-transform flex-shrink-0 ${showDelivered ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
            </svg>
          </button>

          {showDelivered && (
            <div className="space-y-2">
              {deliveredEntries.length === 0 && (
                <p className="text-[#444] text-sm text-center py-6">Aucune commande livrée pour l'instant</p>
              )}
              {deliveredEntries.map((entry, i) => <OrderCard key={i} entry={entry} delivered />)}
              {orderHistory.length > 0 && (
                <button
                  onClick={() => {
                    if (!confirm('Effacer tout l\'historique des commandes ?')) return
                    setOrderHistory([])
                    try { localStorage.removeItem(historyKey); localStorage.removeItem(bdcKey) } catch {}
                  }}
                  className="w-full text-center text-[10px] text-[#333] hover:text-[#555] py-2 transition-colors"
                >
                  Effacer l'historique
                </button>
              )}
            </div>
          )}
        </section>

      </main>

      <BottomNav cartCount={itemCount} cartTotal={total} />
    </div>
  )
}

function SectionTitle({ icon, label, count, noMargin }: { icon: 'cart' | 'clock' | 'check'; label: string; count?: number; noMargin?: boolean }) {
  const icons = {
    cart:  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>,
    clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    check: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>,
  }
  return (
    <div className={`flex items-center gap-2 ${noMargin ? '' : 'mb-3'}`}>
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="#d4780f" strokeWidth="2" viewBox="0 0 24 24">
        {icons[icon]}
      </svg>
      <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#d4780f' }}>{label}</p>
      {count !== undefined && (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#2a1400', color: '#d4780f' }}>{count}</span>
      )}
    </div>
  )
}

function OrderCard({ entry, delivered }: { entry: OrderHistoryEntry; delivered?: boolean }) {
  const borderColor  = delivered ? '#1a2a1a' : '#2a1a00'
  const statusStyle  = delivered
    ? { background: '#0d1a0d', color: '#4ade80' }
    : { background: '#1a1000', color: '#d4780f' }
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#111', border: `1px solid ${borderColor}` }}>
      <div className="px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={statusStyle}>
            {delivered ? 'Livré' : 'En cours'}
          </span>
          <span className="text-[10px] text-[#444]">
            {new Date(entry.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
          </span>
        </div>
        <div className="text-right">
          <span className="text-sm font-bold text-white">{entry.total.toFixed(2).replace('.', ',')} <span className="text-[10px] font-normal text-[#555]">€ HT</span></span>
          <p className="text-[10px] text-[#333]">{(entry.total * 1.2).toFixed(2).replace('.', ',')} € TTC</p>
        </div>
      </div>
      <div className="px-4 pb-2.5 space-y-0.5" style={{ borderTop: '1px solid #161616' }}>
        {entry.items.map((it, i) => (
          <p key={i} className="text-[11px] text-[#555]">{it.quantity}× {it.designation}</p>
        ))}
      </div>
    </div>
  )
}
