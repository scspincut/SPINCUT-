import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useClientAuth, getAccessCodes, getClientCode } from '../hooks/useAuth'
import SpincutLogo from '../components/SpincutLogo'

interface CatalogProduct {
  sheet: string
  row: number
  famille: string
  ref: string
  diametre: string
  lc: string
  lt: string
  dents: string
  angle: string
  queue: string
  sens: string
  prix: number
  stock: number
  pm: boolean
  category: string
  designation: string
}

const CATEGORY_META: Record<string, { label: string; order: number }> = {
  classique:   { label: 'Classique',   order: 1 },
  compression: { label: 'Compression', order: 2 },
  diamant:     { label: 'Diamant',     order: 3 },
  ravageuse:   { label: 'Ravageuse',   order: 4 },
  alu:         { label: 'Alu',         order: 5 },
  gravure:     { label: 'Gravure',     order: 6 },
  percage:     { label: 'Perçage',     order: 7 },
  accessoires: { label: 'Accessoires', order: 8 },
}

function fmt(n: number) { return n.toFixed(2).replace('.', ',') }

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <span className="flex items-center gap-1 text-[10px] font-semibold text-red-400"><span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />Rupture</span>
  if (stock <= 5) return <span className="flex items-center gap-1 text-[10px] font-semibold text-orange-400"><span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block" />Stock faible ({stock})</span>
  return <span className="flex items-center gap-1 text-[10px] text-[#555]"><span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />En stock ({stock})</span>
}

export default function OrderPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useClientAuth()
  const tabsRef = useRef<HTMLDivElement>(null)

  const [catalog, setCatalog] = useState<CatalogProduct[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState('')
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [activeTab, setActiveTab] = useState<string>('')
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [filterDiam, setFilterDiam] = useState<string | null>(null)
  const [filterLC, setFilterLC] = useState<string | null>(null)
  const [filterDents, setFilterDents] = useState<string | null>(null)
  const [filterPM, setFilterPM] = useState(false)
  const [orderStatus, setOrderStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [orderError, setOrderError] = useState('')

  const clientCode = getClientCode()
  const clientInfo = clientCode ? getAccessCodes().find(c => c.code === clientCode) : null
  const clientName = clientInfo?.clientName ?? null

  useEffect(() => {
    fetch('/api/catalog')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCatalog(data)
          const first = Object.entries(CATEGORY_META).sort((a, b) => a[1].order - b[1].order).find(([id]) => data.some(p => p.category === id))
          if (first) setActiveTab(first[0])
        } else {
          setCatalogError(data?.error ?? 'Erreur catalogue')
        }
        setCatalogLoading(false)
      })
      .catch(() => { setCatalogError('Impossible de charger le catalogue'); setCatalogLoading(false) })
  }, [])

  const tabs = useMemo(() => {
    const cats = new Set(catalog.map(p => p.category))
    return Object.entries(CATEGORY_META)
      .filter(([id]) => cats.has(id))
      .sort((a, b) => a[1].order - b[1].order)
  }, [catalog])

  const activeProducts = useMemo(() => {
    if (!activeTab && !search) return []
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      return catalog.filter(p =>
        p.ref.toLowerCase().includes(q) ||
        p.designation.toLowerCase().includes(q)
      )
    }
    return catalog.filter(p => p.category === activeTab)
  }, [catalog, activeTab, search])

  const diameters = useMemo(() => [...new Set(activeProducts.map(p => p.diametre).filter(d => d && d !== '/'))].sort((a, b) => parseFloat(a) - parseFloat(b) || a.localeCompare(b)), [activeProducts])
  const lcValues = useMemo(() => [...new Set(activeProducts.map(p => p.lc).filter(l => l && l !== '/'))].sort((a, b) => parseFloat(a) - parseFloat(b)), [activeProducts])
  const dentsValues = useMemo(() => [...new Set(activeProducts.map(p => p.dents).filter(d => d && d !== '/'))].sort(), [activeProducts])
  const hasPM = useMemo(() => activeProducts.some(p => p.pm), [activeProducts])

  const filtered = useMemo(() => activeProducts.filter(p =>
    (filterDiam === null || p.diametre === filterDiam) &&
    (filterLC === null || p.lc === filterLC) &&
    (filterDents === null || p.dents === filterDents) &&
    (!filterPM || p.pm)
  ), [activeProducts, filterDiam, filterLC, filterDents, filterPM])

  const activeFilterCount = [filterDiam, filterLC, filterDents, filterPM || null].filter(Boolean).length

  const resetFilters = () => { setFilterDiam(null); setFilterLC(null); setFilterDents(null); setFilterPM(false) }

  const switchTab = (id: string) => {
    setActiveTab(id)
    setSearch('')
    resetFilters()
  }

  if (!isAuthenticated) { navigate('/'); return null }

  const setQty = (ref: string, delta: number, maxStock: number) =>
    setQuantities(prev => ({ ...prev, [ref]: Math.min(maxStock, Math.max(0, (prev[ref] || 0) + delta)) }))

  const setQtyDirect = (ref: string, val: string, maxStock: number) =>
    setQuantities(prev => ({ ...prev, [ref]: Math.min(maxStock, Math.max(0, parseInt(val) || 0)) }))

  const total = catalog.reduce((s, item) => s + (quantities[item.ref] || 0) * item.prix, 0)
  const itemCount = catalog.reduce((s, item) => s + (quantities[item.ref] || 0), 0)
  const hasItems = itemCount > 0

  const sendOrder = async () => {
    if (orderStatus === 'loading') return
    setOrderStatus('loading')
    setOrderError('')
    const items = catalog
      .filter(item => (quantities[item.ref] || 0) > 0)
      .map(item => ({
        ref: item.ref,
        designation: item.designation,
        queue: item.queue !== '/' ? item.queue : '',
        quantity: quantities[item.ref],
        price: item.prix,
        sheet: item.sheet,
        row: item.row,
      }))
    try {
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName: clientName ?? 'Client SPINCUT', items }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Erreur serveur')
      setOrderStatus('success')
      setQuantities({})
      fetch('/api/catalog').then(r => r.json()).then(data => { if (Array.isArray(data)) setCatalog(data) }).catch(() => {})
    } catch (e: unknown) {
      setOrderStatus('error')
      setOrderError(e instanceof Error ? e.message : 'Erreur inconnue')
    }
  }

  const showFilters = !search && (diameters.length > 1 || lcValues.length > 1 || dentsValues.length > 1 || hasPM)

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col">

      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#0d0d0d] border-b border-[#1e1e1e]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <SpincutLogo />
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowSearch(s => !s); if (showSearch) setSearch('') }}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[#666] hover:text-white transition-colors"
            >
              {showSearch
                ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeWidth={2} d="M21 21l-4.35-4.35"/></svg>
              }
            </button>
            <Link to="/calculator" className="text-[#666] hover:text-white text-sm transition-colors flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Calculateur
            </Link>
          </div>
        </div>

        {/* Search bar */}
        {showSearch && (
          <div className="max-w-2xl mx-auto px-4 pb-3">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher une référence ou désignation…"
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#444] outline-none focus:border-[#d4780f]"
            />
          </div>
        )}

        {/* Category tabs */}
        {!search && (
          <div ref={tabsRef} className="flex overflow-x-auto scrollbar-hide border-t border-[#1a1a1a]" style={{ scrollbarWidth: 'none' }}>
            {catalogLoading
              ? <div className="px-4 py-3 text-xs text-[#444]">Chargement…</div>
              : tabs.map(([id, meta]) => {
                  const catCount = catalog.filter(p => p.category === id).reduce((s, p) => s + (quantities[p.ref] || 0), 0)
                  return (
                    <button
                      key={id}
                      onClick={() => switchTab(id)}
                      className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
                        activeTab === id ? 'text-white' : 'text-[#555] hover:text-[#888]'
                      }`}
                    >
                      {meta.label}
                      {catCount > 0 && (
                        <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#d4780f]/20 text-[#d4780f]">{catCount}</span>
                      )}
                      {activeTab === id && <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#d4780f] rounded-full" />}
                    </button>
                  )
                })
            }
          </div>
        )}

        {/* Filters strip */}
        {showFilters && (
          <div className="border-t border-[#1a1a1a] bg-[#0a0a0a]">
            <div className="max-w-2xl mx-auto px-3 py-2 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {activeFilterCount > 0 && (
                <button onClick={resetFilters} className="flex-shrink-0 text-[11px] px-2.5 py-1 rounded-lg border border-red-800/50 text-red-400 bg-red-900/10 font-medium whitespace-nowrap">
                  ✕ Effacer ({activeFilterCount})
                </button>
              )}
              {diameters.length > 1 && diameters.map(d => (
                <button key={d} onClick={() => setFilterDiam(prev => prev === d ? null : d)}
                  className={`flex-shrink-0 text-[11px] px-2.5 py-1 rounded-lg border font-medium whitespace-nowrap transition-colors ${
                    filterDiam === d ? 'bg-[#d4780f] border-[#d4780f] text-white' : 'bg-[#1a1a1a] border-[#2a2a2a] text-[#666]'
                  }`}
                >Ø{d}</button>
              ))}
              {lcValues.length > 1 && lcValues.map(lc => (
                <button key={lc} onClick={() => setFilterLC(prev => prev === lc ? null : lc)}
                  className={`flex-shrink-0 text-[11px] px-2.5 py-1 rounded-lg border font-medium whitespace-nowrap transition-colors ${
                    filterLC === lc ? 'bg-[#d4780f] border-[#d4780f] text-white' : 'bg-[#1a1a1a] border-[#2a2a2a] text-[#666]'
                  }`}
                >LC{lc}</button>
              ))}
              {dentsValues.length > 1 && dentsValues.map(d => (
                <button key={d} onClick={() => setFilterDents(prev => prev === d ? null : d)}
                  className={`flex-shrink-0 text-[11px] px-2.5 py-1 rounded-lg border font-medium whitespace-nowrap transition-colors ${
                    filterDents === d ? 'bg-[#d4780f] border-[#d4780f] text-white' : 'bg-[#1a1a1a] border-[#2a2a2a] text-[#666]'
                  }`}
                >Z{d}</button>
              ))}
              {hasPM && (
                <button onClick={() => setFilterPM(p => !p)}
                  className={`flex-shrink-0 text-[11px] px-2.5 py-1 rounded-lg border font-medium whitespace-nowrap transition-colors ${
                    filterPM ? 'bg-purple-600 border-purple-600 text-white' : 'bg-[#1a1a1a] border-[#2a2a2a] text-[#666]'
                  }`}
                >Polimiroir</button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full pb-28">

        {catalogLoading && (
          <div className="flex items-center justify-center py-20 gap-3 text-[#444]">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            Chargement du catalogue…
          </div>
        )}

        {catalogError && !catalogLoading && (
          <div className="m-4 rounded-xl bg-[#2a0000] border border-red-800 px-4 py-3">
            <p className="text-red-400 text-sm">{catalogError}</p>
          </div>
        )}

        {!catalogLoading && !catalogError && search && (
          <div className="px-4 pt-3 pb-1">
            <p className="text-[#555] text-xs">{filtered.length} résultat{filtered.length !== 1 ? 's' : ''} pour « {search} »</p>
          </div>
        )}

        {!catalogLoading && !catalogError && (
          <div className="divide-y divide-[#161616]">
            {filtered.length === 0 && (activeTab || search) ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <p className="text-[#444] text-sm">Aucun produit</p>
                {activeFilterCount > 0 && (
                  <button onClick={resetFilters} className="text-[#d4780f] text-xs underline">Effacer les filtres</button>
                )}
              </div>
            ) : filtered.map(item => {
              const qty = quantities[item.ref] || 0
              const selected = qty > 0
              const outOfStock = item.stock === 0
              return (
                <div
                  key={item.ref}
                  className={`px-4 py-4 flex items-center gap-4 transition-colors ${
                    selected ? 'bg-[#130e00]' : 'bg-[#0d0d0d]'
                  } ${outOfStock ? 'opacity-40' : ''}`}
                >
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className="font-mono text-[10px] text-[#444] bg-[#1a1a1a] px-1.5 py-0.5 rounded">{item.ref}</span>
                      <StockBadge stock={item.stock} />
                      {item.pm && <span className="text-[10px] font-semibold text-purple-400 bg-purple-900/20 px-1.5 py-0.5 rounded">Polimiroir</span>}
                    </div>
                    <p className={`text-sm font-medium leading-snug ${selected ? 'text-white' : 'text-[#ccc]'}`}>{item.designation}</p>
                    {selected && <p className="text-[#d4780f] text-xs mt-0.5 font-medium">{fmt(qty * item.prix)} € HT</p>}
                  </div>

                  {/* Price + controls */}
                  <div className="flex-shrink-0 flex flex-col items-end gap-2">
                    {item.prix > 0
                      ? <span className={`font-bold text-base ${selected ? 'text-[#d4780f]' : 'text-[#d4780f]/70'}`}>{fmt(item.prix)}€</span>
                      : <span className="text-[#444] text-xs">Sur devis</span>
                    }
                    {!outOfStock && item.prix > 0 && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setQty(item.ref, -1, item.stock)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg transition-colors ${
                            qty > 0 ? 'bg-[#d4780f] text-white' : 'bg-[#1a1a1a] border border-[#2a2a2a] text-[#555]'
                          }`}
                        >−</button>
                        {qty > 0 && (
                          <input
                            type="number" min={0} max={item.stock}
                            value={qty}
                            onChange={e => setQtyDirect(item.ref, e.target.value, item.stock)}
                            className="w-9 text-center bg-transparent text-[#d4780f] font-bold text-sm outline-none"
                          />
                        )}
                        <button
                          onClick={() => setQty(item.ref, +1, item.stock)}
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
      </main>

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
                <div className="flex-1 min-w-0">
                  <p className="text-[#888] text-xs">{itemCount} article{itemCount > 1 ? 's' : ''}</p>
                  <p className="text-[#d4780f] font-bold text-lg leading-tight">{fmt(total)} € HT</p>
                </div>
              )}
              <button
                onClick={sendOrder}
                disabled={!hasItems || orderStatus === 'loading'}
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
