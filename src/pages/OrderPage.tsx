import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useClientAuth, getAccessCodes, getClientCode } from '../hooks/useAuth'
import SpincutLogo from '../components/SpincutLogo'

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

const CATEGORY_META: Record<string, { label: string; order: number }> = {
  classique:   { label: 'Fraise Classique',   order: 1 },
  compression: { label: 'Fraise Compression', order: 2 },
  diamant:     { label: 'Diamant (PCD)',       order: 3 },
  ravageuse:   { label: 'Ravageuse',           order: 4 },
  alu:         { label: 'Aluminium',           order: 5 },
  gravure:     { label: 'Fraise Gravure',      order: 6 },
  percage:     { label: 'Perçage',             order: 7 },
  accessoires: { label: 'Accessoires',         order: 8 },
}

function fmt(n: number) { return n.toFixed(2).replace('.', ',') }
function uid(p: CatalogProduct) { return `${p.ref}__${p.row}` }

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <span className="flex items-center gap-1 text-[10px] font-semibold text-red-400"><span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />Rupture</span>
  if (stock <= 5) return <span className="flex items-center gap-1 text-[10px] font-semibold text-orange-400"><span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block" />Stock faible ({stock})</span>
  return <span className="flex items-center gap-1 text-[10px] text-[#555]"><span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />En stock ({stock})</span>
}

export default function OrderPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useClientAuth()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [catalog, setCatalog] = useState<CatalogProduct[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filterDiam, setFilterDiam] = useState<string | null>(null)
  const [filterLC, setFilterLC] = useState<string | null>(null)
  const [filterDents, setFilterDents] = useState<string | null>(null)
  const [filterPM, setFilterPM] = useState(false)
  const [orderStatus, setOrderStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [orderError, setOrderError] = useState('')
  const [cartOpen, setCartOpen] = useState(false)

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
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    try { localStorage.setItem(cartKey, JSON.stringify(quantities)) } catch { /* ignore */ }
  }, [quantities, cartKey])

  useEffect(() => {
    fetch('/api/catalog')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setCatalog(data)
        else setCatalogError(data?.error ?? 'Erreur catalogue')
        setCatalogLoading(false)
      })
      .catch(() => { setCatalogError('Impossible de charger le catalogue'); setCatalogLoading(false) })
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const tabs = useMemo(() => {
    const cats = new Set(catalog.map(p => p.category))
    return Object.entries(CATEGORY_META).filter(([id]) => cats.has(id)).sort((a, b) => a[1].order - b[1].order)
  }, [catalog])

  const categoryProducts = useMemo(() =>
    activeCategory ? catalog.filter(p => p.category === activeCategory) : [],
  [catalog, activeCategory])

  const diameters = useMemo(() => [...new Set(categoryProducts.map(p => p.diametre).filter(d => d && d !== '/'))].sort((a, b) => parseFloat(a) - parseFloat(b) || a.localeCompare(b)), [categoryProducts])
  const lcValues  = useMemo(() => [...new Set(categoryProducts.map(p => p.lc).filter(l => l && l !== '/'))].sort((a, b) => parseFloat(a) - parseFloat(b)), [categoryProducts])
  const dentsValues = useMemo(() => [...new Set(categoryProducts.map(p => p.dents).filter(d => d && d !== '/'))].sort(), [categoryProducts])
  const hasPM = useMemo(() => categoryProducts.some(p => p.pm), [categoryProducts])

  const filtered = useMemo(() => categoryProducts.filter(p =>
    (filterDiam === null || p.diametre === filterDiam) &&
    (filterLC === null || p.lc === filterLC) &&
    (filterDents === null || p.dents === filterDents) &&
    (!filterPM || p.pm)
  ), [categoryProducts, filterDiam, filterLC, filterDents, filterPM])

  const activeFilterCount = [filterDiam, filterLC, filterDents, filterPM || null].filter(Boolean).length

  const resetFilters = () => { setFilterDiam(null); setFilterLC(null); setFilterDents(null); setFilterPM(false) }

  const selectCategory = (id: string) => {
    setActiveCategory(id)
    setDropdownOpen(false)
    setFiltersOpen(false)
    resetFilters()
  }

  if (!isAuthenticated) { navigate('/'); return null }

  const setQty = (key: string, delta: number, max: number) =>
    setQuantities(prev => ({ ...prev, [key]: Math.min(max, Math.max(0, (prev[key] || 0) + delta)) }))
  const setQtyDirect = (key: string, val: string, max: number) =>
    setQuantities(prev => ({ ...prev, [key]: Math.min(max, Math.max(0, parseInt(val) || 0)) }))

  const total = catalog.reduce((s, p) => s + (quantities[uid(p)] || 0) * p.prix, 0)
  const itemCount = catalog.reduce((s, p) => s + (quantities[uid(p)] || 0), 0)
  const hasItems = itemCount > 0

  const sendOrder = async () => {
    if (orderStatus === 'loading') return
    setOrderStatus('loading'); setOrderError('')
    const items = catalog.filter(p => (quantities[uid(p)] || 0) > 0).map(p => ({
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

      // Sauvegarder le BDC ouvert
      try { localStorage.setItem(bdcKey, JSON.stringify(orderId)) } catch { /* ignore */ }

      // Historique
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

  const currentLabel = activeCategory ? CATEGORY_META[activeCategory]?.label : null

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0d0d0d] border-b border-[#1a1a1a]">
        <div className="max-w-2xl mx-auto px-4 py-3 relative flex items-center justify-center">

          {/* Logo — truly centered */}
          <SpincutLogo />

          {/* Back — absolute right */}
          <Link to="/calculator" className="absolute right-4 text-[#555] hover:text-white text-xs transition-colors flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Retour
          </Link>
        </div>

        {/* Filter button row — only when category selected */}
        {activeCategory && (
          <div className="max-w-2xl mx-auto px-4 pb-3 flex items-center gap-2">
            <button
              onClick={() => setFiltersOpen(o => !o)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                activeFilterCount > 0
                  ? 'bg-[#d4780f] border-[#d4780f] text-white'
                  : 'bg-[#1a1a1a] border-[#2a2a2a] text-[#888] hover:border-[#d4780f] hover:text-white'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M7 12h10M11 20h2"/></svg>
              Filtres{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </button>
            {activeFilterCount > 0 && (
              <button onClick={resetFilters} className="text-xs text-[#555] hover:text-red-400 transition-colors">
                Effacer
              </button>
            )}
            <span className="ml-auto text-xs text-[#444]">{filtered.length} produit{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Filters panel */}
        {activeCategory && filtersOpen && (
          <div className="border-t border-[#1a1a1a] bg-[#111]">
            <div className="max-w-2xl mx-auto px-4 py-3 space-y-2.5">
              {diameters.length > 1 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[#555] text-[10px] font-bold uppercase tracking-wider w-6">Ø</span>
                  {diameters.map(d => (
                    <button key={d} onClick={() => setFilterDiam(p => p === d ? null : d)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-colors ${filterDiam === d ? 'bg-[#d4780f] border-[#d4780f] text-white' : 'bg-[#1a1a1a] border-[#2a2a2a] text-[#666]'}`}
                    >Ø{d}</button>
                  ))}
                </div>
              )}
              {dentsValues.length > 1 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[#555] text-[10px] font-bold uppercase tracking-wider w-6">Z</span>
                  {dentsValues.map(d => (
                    <button key={d} onClick={() => setFilterDents(p => p === d ? null : d)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-colors ${filterDents === d ? 'bg-[#d4780f] border-[#d4780f] text-white' : 'bg-[#1a1a1a] border-[#2a2a2a] text-[#666]'}`}
                    >Z{d}</button>
                  ))}
                </div>
              )}
              {lcValues.length > 1 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[#555] text-[10px] font-bold uppercase tracking-wider w-6">LC</span>
                  {lcValues.map(lc => (
                    <button key={lc} onClick={() => setFilterLC(p => p === lc ? null : lc)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-colors ${filterLC === lc ? 'bg-[#d4780f] border-[#d4780f] text-white' : 'bg-[#1a1a1a] border-[#2a2a2a] text-[#666]'}`}
                    >LC{lc}</button>
                  ))}
                </div>
              )}
              {hasPM && (
                <div className="flex items-center gap-2">
                  <span className="text-[#555] text-[10px] font-bold uppercase tracking-wider w-6">PM</span>
                  <button onClick={() => setFilterPM(p => !p)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-colors ${filterPM ? 'bg-purple-600 border-purple-600 text-white' : 'bg-[#1a1a1a] border-[#2a2a2a] text-[#666]'}`}
                  >Polimiroir</button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main */}
      <main className="flex-1 max-w-2xl mx-auto w-full pb-28">

        {/* Dropdown catégorie + filtres — toujours en haut à gauche du contenu */}
        {!catalogLoading && !catalogError && (
          <div className="px-4 pt-4 pb-1 flex items-center gap-2">
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setDropdownOpen(o => !o)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-sm font-semibold transition-colors hover:border-[#d4780f]"
              >
                <svg className="w-4 h-4 text-[#d4780f] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
                <span className={currentLabel ? 'text-white' : 'text-[#555]'}>
                  {currentLabel ?? 'Catégorie'}
                </span>
                <svg className={`w-3.5 h-3.5 text-[#555] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                </svg>
              </button>

              {dropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] shadow-2xl overflow-hidden z-50">
                  {tabs.map(([id, meta]) => {
                    const count = catalog.filter(p => p.category === id).reduce((s, p) => s + (quantities[uid(p)] || 0), 0)
                    return (
                      <button
                        key={id}
                        onClick={() => selectCategory(id)}
                        className={`w-full px-4 py-3 text-left text-sm flex items-center justify-between transition-colors ${
                          activeCategory === id ? 'bg-[#2a1400] text-[#d4780f]' : 'text-[#ccc] hover:bg-[#222] hover:text-white'
                        }`}
                      >
                        {meta.label}
                        {count > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#d4780f]/20 text-[#d4780f]">{count}</span>}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {activeCategory && (
              <>
                <button
                  onClick={() => setFiltersOpen(o => !o)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                    activeFilterCount > 0
                      ? 'bg-[#d4780f] border-[#d4780f] text-white'
                      : 'bg-[#1a1a1a] border-[#2a2a2a] text-[#888] hover:border-[#d4780f] hover:text-white'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M7 12h10M11 20h2"/></svg>
                  Filtres{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                </button>
                {activeFilterCount > 0 && (
                  <button onClick={resetFilters} className="text-xs text-[#555] hover:text-red-400 transition-colors">Effacer</button>
                )}
                <span className="ml-auto text-xs text-[#444]">{filtered.length} produit{filtered.length !== 1 ? 's' : ''}</span>
              </>
            )}
          </div>
        )}

        {catalogLoading && (
          <div className="flex items-center justify-center py-20 gap-3 text-[#444]">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
            Chargement…
          </div>
        )}

        {catalogError && <div className="m-4 rounded-xl bg-[#2a0000] border border-red-800 px-4 py-3"><p className="text-red-400 text-sm">{catalogError}</p></div>}

        {/* Welcome state */}
        {!catalogLoading && !catalogError && !activeCategory && (
          <div className="flex flex-col items-center justify-center py-16 px-6 gap-6 text-center">
            <div>
              <p className="text-white text-xl font-bold">{clientName ? `Bonjour ${clientName}` : 'Catalogue SPINCUT'}</p>
              <p className="text-[#555] text-sm mt-1">Sélectionnez une catégorie pour commencer</p>
            </div>
            <div className="w-full max-w-sm space-y-2">
              {tabs.map(([id, meta]) => (
                <button key={id} onClick={() => selectCategory(id)}
                  className="w-full px-4 py-3.5 rounded-xl bg-[#161616] border border-[#2a2a2a] text-left text-sm font-medium text-white hover:border-[#d4780f] hover:bg-[#1a1200] transition-colors flex items-center justify-between"
                >
                  {meta.label}
                  <svg className="w-4 h-4 text-[#444]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Products */}
        {!catalogLoading && !catalogError && activeCategory && (
          <div className="divide-y divide-[#161616]">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <p className="text-[#444] text-sm">Aucun produit pour ces filtres</p>
                {activeFilterCount > 0 && <button onClick={resetFilters} className="text-[#d4780f] text-xs underline">Effacer les filtres</button>}
              </div>
            ) : filtered.map(item => {
              const key = uid(item)
              const qty = quantities[key] || 0
              const selected = qty > 0
              const outOfStock = item.stock === 0
              return (
                <div key={key}
                  className={`px-4 py-4 flex items-center gap-4 transition-colors ${selected ? 'bg-[#130e00]' : 'bg-[#0d0d0d]'} ${outOfStock ? 'opacity-40' : ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className="font-mono text-[10px] text-[#444] bg-[#1a1a1a] px-1.5 py-0.5 rounded">{item.ref}</span>
                      <StockBadge stock={item.stock} />
                      {item.pm && <span className="text-[10px] font-semibold text-purple-400 bg-purple-900/20 px-1.5 py-0.5 rounded">Polimiroir</span>}
                    </div>
                    <p className={`text-sm font-medium leading-snug ${selected ? 'text-white' : 'text-[#ccc]'}`}>{item.designation}</p>
                    {selected && <p className="text-[#d4780f] text-xs mt-0.5 font-medium">{fmt(qty * item.prix)} € HT</p>}
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-2">
                    {item.prix > 0
                      ? <span className={`font-bold text-base ${selected ? 'text-[#d4780f]' : 'text-[#d4780f]/70'}`}>{fmt(item.prix)}€</span>
                      : <span className="text-[#444] text-xs">Sur devis</span>
                    }
                    {!outOfStock && item.prix > 0 && (
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setQty(key, -1, item.stock)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg transition-colors ${qty > 0 ? 'bg-[#d4780f] text-white' : 'bg-[#1a1a1a] border border-[#2a2a2a] text-[#555]'}`}
                        >−</button>
                        {qty > 0 && (
                          <input type="number" min={0} max={item.stock} value={qty}
                            onChange={e => setQtyDirect(key, e.target.value, item.stock)}
                            className="w-9 text-center bg-transparent text-[#d4780f] font-bold text-sm outline-none"
                          />
                        )}
                        <button onClick={() => setQty(key, +1, item.stock)}
                          className="w-8 h-8 rounded-lg bg-[#d4780f] flex items-center justify-center font-bold text-lg text-white hover:bg-[#b86400] transition-colors active:scale-95"
                        >+</button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {/* Historique commandes */}
        {orderHistory.length > 0 && (
          <div className="mx-4 mt-4 mb-2">
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

      {/* Cart drawer */}
      {cartOpen && hasItems && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end" onClick={() => setCartOpen(false)}>
          <div className="bg-[#161616] border-t border-[#2a2a2a] rounded-t-2xl max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-4 border-b border-[#2a2a2a]">
              <p className="font-bold text-white">Mon panier</p>
              <button onClick={() => setCartOpen(false)} className="text-[#555] hover:text-white text-xl leading-none">×</button>
            </div>
            <div className="overflow-y-auto flex-1 divide-y divide-[#1e1e1e]">
              {catalog.filter(p => (quantities[uid(p)] || 0) > 0).map(p => (
                <div key={uid(p)} className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{p.designation}</p>
                    <p className="text-[#d4780f] text-xs font-medium mt-0.5">{fmt(quantities[uid(p)] * p.prix)} € HT</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => setQty(uid(p), -1, p.stock)}
                      className="w-8 h-8 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-[#888] flex items-center justify-center font-bold text-base"
                    >−</button>
                    <span className="w-7 text-center text-white font-bold text-sm">{quantities[uid(p)]}</span>
                    <button
                      onClick={() => setQty(uid(p), +1, p.stock)}
                      className="w-8 h-8 rounded-lg bg-[#d4780f] text-white flex items-center justify-center font-bold text-base"
                    >+</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-4 border-t border-[#2a2a2a] flex items-center justify-between">
              <div>
                <p className="text-[#888] text-xs">{itemCount} article{itemCount > 1 ? 's' : ''}</p>
                <p className="text-[#d4780f] font-bold text-lg">{fmt(total)} € HT</p>
              </div>
              <button onClick={() => { setCartOpen(false); sendOrder() }}
                disabled={orderStatus === 'loading'}
                className="py-3 px-6 rounded-xl bg-[#d4780f] text-white text-sm font-bold hover:bg-[#b86400] active:scale-95 transition-all"
              >
                Commander →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-[#0d0d0d]/95 backdrop-blur border-t border-[#1e1e1e]">
        <div className="max-w-2xl mx-auto px-4 py-3 space-y-2">
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
          {orderStatus !== 'success' && (
            <div className="flex items-center gap-3">
              {hasItems && (
                <button onClick={() => setCartOpen(true)}
                  className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-[#1a1200] border border-[#d4780f]/30 flex-shrink-0"
                >
                  <svg className="w-5 h-5 text-[#d4780f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6h13M10 21a1 1 0 100-2 1 1 0 000 2zm7 0a1 1 0 100-2 1 1 0 000 2z"/>
                  </svg>
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-[#d4780f] text-white text-[10px] font-bold flex items-center justify-center px-1">
                    {itemCount}
                  </span>
                </button>
              )}
              {hasItems && (
                <div className="flex-1 min-w-0">
                  <p className="text-[#888] text-xs">{itemCount} article{itemCount > 1 ? 's' : ''}</p>
                  <p className="text-[#d4780f] font-bold text-base leading-tight">{fmt(total)} € HT</p>
                </div>
              )}
              <button onClick={sendOrder} disabled={!hasItems || orderStatus === 'loading'}
                className={`${hasItems ? 'flex-shrink-0' : 'flex-1'} py-3 px-6 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  hasItems && orderStatus !== 'loading'
                    ? 'bg-[#d4780f] text-white hover:bg-[#b86400] active:scale-95'
                    : 'bg-[#1a1a1a] text-[#444] cursor-not-allowed border border-[#222]'
                }`}
              >
                {orderStatus === 'loading'
                  ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Envoi…</>
                  : hasItems ? 'Commander →' : 'Sélectionnez des produits'
                }
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
