import { useState, useEffect, useMemo } from 'react'
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

const CATEGORY_META: Record<string, { label: string; description: string; order: number }> = {
  classique:   { label: 'Fraise Classique',   description: 'Bois massif, MDF, contreplaqué, PVC, PMMA', order: 1 },
  compression: { label: 'Fraise Compression', description: '2 faces nettes — mélaminé, contreplaqué, MDF, stratifié HPL/CPL', order: 2 },
  diamant:     { label: 'Diamant (PCD)',      description: 'Longévité maximale — MDF, HDF, mélaminé, composites, Trespa', order: 3 },
  ravageuse:   { label: 'Ravageuse',          description: 'Ébauche rapide — bois massif tendre et dur, panneaux épais', order: 4 },
  alu:         { label: 'Aluminium',          description: 'Fraises spéciales aluminium et métaux non ferreux', order: 5 },
  gravure:     { label: 'Fraise Gravure',     description: 'Gravure et découpe fine — V-bit 30° et 60°', order: 6 },
  percage:     { label: 'Perçage',            description: 'Mèches et outils de perçage — bois, panneaux, plastiques', order: 7 },
  accessoires: { label: 'Accessoires',        description: 'Collets ER32, kits aspiration et équipements', order: 8 },
}

function fmt(n: number) { return n.toFixed(2).replace('.', ',') }

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return (
    <span className="flex items-center gap-1 text-[10px] font-semibold text-red-400">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
      Rupture
    </span>
  )
  if (stock <= 5) return (
    <span className="flex items-center gap-1 text-[10px] font-semibold text-orange-400">
      <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block" />
      Stock faible ({stock})
    </span>
  )
  return (
    <span className="flex items-center gap-1 text-[10px] text-[#555]">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
      En stock ({stock})
    </span>
  )
}

export default function OrderPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useClientAuth()

  const [catalog, setCatalog] = useState<CatalogProduct[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState('')
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({})
  const [filterDiam, setFilterDiam] = useState<Record<string, string | null>>({})
  const [filterLC, setFilterLC] = useState<Record<string, string | null>>({})
  const [filterDents, setFilterDents] = useState<Record<string, string | null>>({})
  const [filterPM, setFilterPM] = useState<Record<string, boolean>>({})
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
        } else {
          setCatalogError(data?.error ?? 'Erreur catalogue')
        }
        setCatalogLoading(false)
      })
      .catch(() => { setCatalogError('Impossible de charger le catalogue'); setCatalogLoading(false) })
  }, [])

  const groups = useMemo(() => {
    const byCategory: Record<string, CatalogProduct[]> = {}
    catalog.forEach(p => {
      if (!byCategory[p.category]) byCategory[p.category] = []
      byCategory[p.category].push(p)
    })
    return Object.entries(byCategory)
      .map(([id, products]) => ({
        id,
        ...(CATEGORY_META[id] ?? { label: id, description: '', order: 99 }),
        products,
      }))
      .sort((a, b) => a.order - b.order)
  }, [catalog])

  if (!isAuthenticated) { navigate('/'); return null }

  const setQty = (ref: string, delta: number, maxStock: number) =>
    setQuantities(prev => ({ ...prev, [ref]: Math.min(maxStock, Math.max(0, (prev[ref] || 0) + delta)) }))

  const setQtyDirect = (ref: string, val: string, maxStock: number) =>
    setQuantities(prev => ({ ...prev, [ref]: Math.min(maxStock, Math.max(0, parseInt(val) || 0)) }))

  const toggleCat = (id: string) => setOpenCats(prev => ({ ...prev, [id]: !prev[id] }))
  const toggleDiam = (catId: string, d: string) =>
    setFilterDiam(prev => ({ ...prev, [catId]: prev[catId] === d ? null : d }))
  const toggleLC = (catId: string, lc: string) =>
    setFilterLC(prev => ({ ...prev, [catId]: prev[catId] === lc ? null : lc }))
  const toggleDents = (catId: string, d: string) =>
    setFilterDents(prev => ({ ...prev, [catId]: prev[catId] === d ? null : d }))
  const togglePM = (catId: string) =>
    setFilterPM(prev => ({ ...prev, [catId]: !prev[catId] }))

  const total = catalog.reduce((s, item) => s + (quantities[item.ref] || 0) * item.prix, 0)
  const hasItems = catalog.some(item => (quantities[item.ref] || 0) > 0)
  const itemCount = catalog.reduce((s, item) => s + (quantities[item.ref] || 0), 0)

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
      fetch('/api/catalog')
        .then(r => r.json())
        .then(data => { if (Array.isArray(data)) setCatalog(data) })
        .catch(() => {})
    } catch (e: unknown) {
      setOrderStatus('error')
      setOrderError(e instanceof Error ? e.message : 'Erreur inconnue')
    }
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      <header className="border-b border-[#1e1e1e] px-4 py-3 flex items-center justify-between sticky top-0 bg-[#0d0d0d] z-10">
        <SpincutLogo />
        <Link to="/calculator" className="text-[#888] hover:text-white text-sm transition-colors flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Calculateur
        </Link>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-3 pb-36">
        <div>
          <h1 className="text-xl font-bold text-white">Catalogue SPINCUT</h1>
          <p className="text-[#555] text-sm mt-0.5">
            {clientName ? `Bonjour ${clientName} — sélectionnez vos outils` : 'Sélectionnez vos outils et validez'}
          </p>
        </div>

        {catalogLoading && (
          <div className="flex items-center justify-center py-12 gap-3 text-[#555]">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Chargement du catalogue…
          </div>
        )}

        {catalogError && !catalogLoading && (
          <div className="rounded-xl bg-[#2a0000] border border-red-800 px-4 py-3">
            <p className="text-red-400 text-sm">{catalogError}</p>
          </div>
        )}

        {!catalogLoading && !catalogError && groups.map(cat => {
          const isOpen = openCats[cat.id] ?? false
          const activeDiam = filterDiam[cat.id] ?? null
          const activeLC = filterLC[cat.id] ?? null
          const activeDents = filterDents[cat.id] ?? null
          const activePM = filterPM[cat.id] ?? false

          const diameters = [...new Set(cat.products.map(p => p.diametre).filter(d => d && d !== '/'))].sort((a, b) =>
            parseFloat(a) - parseFloat(b) || a.localeCompare(b)
          )
          const lcValues = [...new Set(cat.products.map(p => p.lc).filter(l => l && l !== '/'))].sort((a, b) =>
            parseFloat(a) - parseFloat(b)
          )
          const dentsValues = [...new Set(cat.products.map(p => p.dents).filter(d => d && d !== '/'))].sort()
          const hasPM = cat.products.some(p => p.pm)

          const filtered = cat.products.filter(p =>
            (activeDiam === null || p.diametre === activeDiam) &&
            (activeLC === null || p.lc === activeLC) &&
            (activeDents === null || p.dents === activeDents) &&
            (!activePM || p.pm)
          )

          const catCount = cat.products.reduce((s, item) => s + (quantities[item.ref] || 0), 0)
          const catTotal = cat.products.reduce((s, item) => s + (quantities[item.ref] || 0) * item.prix, 0)

          return (
            <div key={cat.id} className="rounded-2xl border border-[#1e1e1e] overflow-hidden">
              <button
                onClick={() => toggleCat(cat.id)}
                className="w-full px-4 py-3.5 flex items-center justify-between bg-[#111] hover:bg-[#161616] transition-colors"
              >
                <div className="text-left min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-semibold text-sm">{cat.label}</span>
                    {catCount > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#d4780f]/20 text-[#d4780f]">
                        {catCount} article{catCount > 1 ? 's' : ''} — {fmt(catTotal)}€
                      </span>
                    )}
                  </div>
                  <p className="text-[#555] text-xs mt-0.5">{cat.description}</p>
                </div>
                <svg className={`w-4 h-4 text-[#555] flex-shrink-0 ml-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isOpen && (
                <div className="border-t border-[#1e1e1e]">
                  {(diameters.length > 1 || lcValues.length > 1 || dentsValues.length > 1 || hasPM) && (
                    <div className="px-4 py-3 space-y-2 bg-[#0f0f0f] border-b border-[#1a1a1a]">
                      {diameters.length > 1 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[#555] text-[10px] font-semibold uppercase tracking-wider w-8">Ø</span>
                          {diameters.map(d => (
                            <button key={d} onClick={() => toggleDiam(cat.id, d)}
                              className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                                activeDiam === d
                                  ? 'bg-[#d4780f] border-[#d4780f] text-white'
                                  : 'bg-[#1e1e1e] border-[#2a2a2a] text-[#888] hover:border-[#d4780f] hover:text-white'
                              }`}
                            >Ø {d}</button>
                          ))}
                        </div>
                      )}
                      {lcValues.length > 1 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[#555] text-[10px] font-semibold uppercase tracking-wider w-8">LC</span>
                          {lcValues.map(lc => (
                            <button key={lc} onClick={() => toggleLC(cat.id, lc)}
                              className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                                activeLC === lc
                                  ? 'bg-[#d4780f] border-[#d4780f] text-white'
                                  : 'bg-[#1e1e1e] border-[#2a2a2a] text-[#888] hover:border-[#d4780f] hover:text-white'
                              }`}
                            >LC {lc}</button>
                          ))}
                        </div>
                      )}
                      {dentsValues.length > 1 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[#555] text-[10px] font-semibold uppercase tracking-wider w-8">Z</span>
                          {dentsValues.map(d => (
                            <button key={d} onClick={() => toggleDents(cat.id, d)}
                              className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                                activeDents === d
                                  ? 'bg-[#d4780f] border-[#d4780f] text-white'
                                  : 'bg-[#1e1e1e] border-[#2a2a2a] text-[#888] hover:border-[#d4780f] hover:text-white'
                              }`}
                            >Z{d}</button>
                          ))}
                        </div>
                      )}
                      {hasPM && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[#555] text-[10px] font-semibold uppercase tracking-wider w-8">PM</span>
                          <button onClick={() => togglePM(cat.id)}
                            className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                              activePM
                                ? 'bg-[#d4780f] border-[#d4780f] text-white'
                                : 'bg-[#1e1e1e] border-[#2a2a2a] text-[#888] hover:border-[#d4780f] hover:text-white'
                            }`}
                          >Polimiroir</button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="divide-y divide-[#1a1a1a]">
                    {filtered.length === 0 ? (
                      <p className="px-4 py-6 text-xs text-[#444] text-center">Aucun produit pour ces filtres</p>
                    ) : filtered.map(item => {
                      const qty = quantities[item.ref] || 0
                      const selected = qty > 0
                      const outOfStock = item.stock === 0
                      return (
                        <div key={item.ref}
                          className={`px-4 py-3 flex items-center gap-3 transition-colors ${
                            selected ? 'bg-[#1a1200]' : outOfStock ? 'opacity-50 bg-[#0d0d0d]' : 'bg-[#0d0d0d]'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-[10px] text-[#555] bg-[#1e1e1e] px-1.5 py-0.5 rounded">{item.ref}</span>
                              <StockBadge stock={item.stock} />
                              {(item.pm || item.designation.includes('Polimiroir')) && (
                                <span className="text-[10px] font-semibold text-purple-400 bg-purple-900/30 px-1.5 py-0.5 rounded">Polimiroir</span>
                              )}
                            </div>
                            <p className="text-white text-sm font-medium mt-1">{item.designation}</p>
                            {selected && (
                              <p className="text-[#d4780f] text-xs mt-0.5">Sous-total : {fmt(qty * item.prix)}€ HT</p>
                            )}
                          </div>
                          <div className="flex-shrink-0 flex items-center gap-2">
                            {item.prix > 0 ? (
                              <span className="text-[#d4780f] font-bold text-sm w-16 text-right">{fmt(item.prix)}€</span>
                            ) : (
                              <span className="text-[#555] text-xs w-16 text-right">Sur devis</span>
                            )}
                            {!outOfStock && item.prix > 0 && (
                              <div className="flex items-center gap-1">
                                <button onClick={() => setQty(item.ref, -1, item.stock)}
                                  className="w-7 h-7 rounded-lg bg-[#1e1e1e] border border-[#2a2a2a] text-[#888] hover:text-white hover:border-[#d4780f] transition-colors flex items-center justify-center font-bold text-base leading-none"
                                >−</button>
                                <input type="number" min={0} max={item.stock}
                                  value={qty === 0 ? '' : qty}
                                  onChange={e => setQtyDirect(item.ref, e.target.value, item.stock)}
                                  placeholder="0"
                                  className={`w-9 text-center bg-[#1e1e1e] border rounded-lg text-sm font-bold py-1 outline-none transition-colors ${
                                    selected ? 'border-[#d4780f] text-[#d4780f]' : 'border-[#2a2a2a] text-[#555]'
                                  }`}
                                />
                                <button onClick={() => setQty(item.ref, +1, item.stock)}
                                  className="w-7 h-7 rounded-lg bg-[#1e1e1e] border border-[#2a2a2a] text-[#888] hover:text-white hover:border-[#d4780f] transition-colors flex items-center justify-center font-bold text-base leading-none"
                                >+</button>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        <p className="text-[#333] text-xs text-center pt-2">Prix HT — Tarifs réservés aux clients SPINCUT</p>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#0d0d0d]/95 backdrop-blur border-t border-[#1e1e1e] px-4 py-3">
        <div className="max-w-2xl mx-auto space-y-2">
          {orderStatus === 'success' && (
            <div className="rounded-xl bg-[#0a2010] border border-green-800 px-4 py-3 flex items-center gap-3">
              <span className="text-green-400 text-lg">✓</span>
              <div>
                <p className="text-green-400 text-sm font-semibold">Commande envoyée !</p>
                <p className="text-green-700 text-xs mt-0.5">Votre bon de commande a été créé — SPINCUT vous recontacte sous 24h.</p>
              </div>
              <button onClick={() => setOrderStatus('idle')} className="ml-auto text-green-700 hover:text-green-400 text-lg">×</button>
            </div>
          )}
          {orderStatus === 'error' && (
            <div className="rounded-xl bg-[#2a0000] border border-red-800 px-4 py-3 flex items-center gap-3">
              <span className="text-red-400 text-lg">⚠️</span>
              <p className="text-red-400 text-sm flex-1">{orderError || 'Une erreur est survenue, réessayez.'}</p>
              <button onClick={() => setOrderStatus('idle')} className="text-red-700 hover:text-red-400 text-lg">×</button>
            </div>
          )}
          {orderStatus !== 'success' && (
            <>
              {hasItems && (
                <div className="flex items-center justify-between px-1">
                  <span className="text-[#888] text-sm">{itemCount} article{itemCount > 1 ? 's' : ''}</span>
                  <span className="text-[#d4780f] font-bold text-lg">{fmt(total)}€ HT</span>
                </div>
              )}
              <button
                onClick={sendOrder}
                disabled={!hasItems || orderStatus === 'loading'}
                className={`w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  hasItems && orderStatus !== 'loading'
                    ? 'bg-[#d4780f] text-white hover:bg-[#b86400] active:scale-95'
                    : 'bg-[#1e1e1e] text-[#444] cursor-not-allowed border border-[#2a2a2a]'
                }`}
              >
                {orderStatus === 'loading' ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Envoi en cours…
                  </>
                ) : hasItems ? (
                  `Commander — ${fmt(total)}€ HT`
                ) : (
                  'Sélectionnez des produits'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
