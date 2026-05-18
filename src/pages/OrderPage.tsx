import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useClientAuth, getAccessCodes, getClientCode } from '../hooks/useAuth'
import SpincutLogo from '../components/SpincutLogo'

interface Product {
  ref: string
  designation: string
  queue: string
  diameter: number
  cuttingLength: number
  price: number
}

interface Category {
  id: string
  label: string
  description: string
  products: Product[]
  comingSoon?: boolean
}

const CATEGORIES: Category[] = [
  {
    id: 'classique',
    label: 'Fraise Classique',
    description: 'Bois massif, MDF, contreplaqué, PVC, PMMA, aluminium',
    products: [],
    comingSoon: true,
  },
  {
    id: 'compression',
    label: 'Fraise Compression',
    description: '2 faces nettes — mélaminé, contreplaqué, MDF, stratifié HPL/CPL',
    products: [
      { ref: '10363122', designation: 'Ø3,175 LC22 LT50 Z2+2', queue: 'Q3,175', diameter: 3.175, cuttingLength: 22, price: 17.90 },
      { ref: '10360422', designation: 'Ø4 LC22 LT50 Z2+2',     queue: 'Q4',     diameter: 4,     cuttingLength: 22, price: 16.90 },
      { ref: '10360522', designation: 'Ø5 LC22 LT50 Z2+2',     queue: 'Q5',     diameter: 5,     cuttingLength: 22, price: 26.90 },
      { ref: '10380622', designation: 'Ø6 LC22 LT50 Z3+3',     queue: 'Q6',     diameter: 6,     cuttingLength: 22, price: 27.90 },
      { ref: '10380822', designation: 'Ø8 LC22 LT60 Z3+3',     queue: 'Q8',     diameter: 8,     cuttingLength: 22, price: 49.90 },
      { ref: '10380632', designation: 'Ø6 LC32 LT70 Z3+3',     queue: 'Q6',     diameter: 6,     cuttingLength: 32, price: 34.90 },
      { ref: '10380832', designation: 'Ø8 LC32 LT70 Z3+3',     queue: 'Q8',     diameter: 8,     cuttingLength: 32, price: 64.90 },
    ],
  },
  {
    id: 'diamant',
    label: 'Diamant (PCD)',
    description: 'Longévité maximale — MDF, HDF, mélaminé, aggloméré, composites, Trespa',
    products: [],
    comingSoon: true,
  },
  {
    id: 'ravageuse',
    label: 'Ravageuse',
    description: 'Ébauche rapide — bois massif tendre et dur, panneaux épais',
    products: [],
    comingSoon: true,
  },
  {
    id: 'percage',
    label: 'Perçage',
    description: 'Mèches et outils de perçage — bois, panneaux, plastiques',
    products: [],
    comingSoon: true,
  },
]

const ALL_PRODUCTS = CATEGORIES.flatMap(c => c.products)

function fmt(n: number) { return n.toFixed(2).replace('.', ',') }
function fmtD(d: number) { return d === 3.175 ? '3,175' : String(d) }

export default function OrderPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useClientAuth()
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({ compression: true })
  const [filterDiam, setFilterDiam] = useState<Record<string, number | null>>({})
  const [filterLC, setFilterLC] = useState<Record<string, number | null>>({})

  const clientCode = getClientCode()
  const clientInfo = clientCode ? getAccessCodes().find(c => c.code === clientCode) : null
  const clientName = clientInfo?.clientName ?? null

  const [orderStatus, setOrderStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [orderError, setOrderError] = useState('')

  const setQty = (ref: string, delta: number) =>
    setQuantities(prev => ({ ...prev, [ref]: Math.max(0, (prev[ref] || 0) + delta) }))

  const setQtyDirect = (ref: string, val: string) =>
    setQuantities(prev => ({ ...prev, [ref]: Math.max(0, parseInt(val) || 0) }))

  const toggleCat = (id: string) => setOpenCats(prev => ({ ...prev, [id]: !prev[id] }))

  const toggleDiam = (catId: string, d: number) =>
    setFilterDiam(prev => ({ ...prev, [catId]: prev[catId] === d ? null : d }))

  const toggleLC = (catId: string, lc: number) =>
    setFilterLC(prev => ({ ...prev, [catId]: prev[catId] === lc ? null : lc }))

  const total = ALL_PRODUCTS.reduce((s, item) => s + (quantities[item.ref] || 0) * item.price, 0)
  const hasItems = ALL_PRODUCTS.some(item => (quantities[item.ref] || 0) > 0)
  const itemCount = ALL_PRODUCTS.reduce((s, item) => s + (quantities[item.ref] || 0), 0)

  if (!isAuthenticated) { navigate('/'); return null }

  const sendOrder = async () => {
    if (orderStatus === 'loading') return
    setOrderStatus('loading')
    setOrderError('')

    const items = ALL_PRODUCTS
      .filter(item => (quantities[item.ref] || 0) > 0)
      .map(item => ({
        ref: item.ref,
        designation: item.designation,
        queue: item.queue,
        quantity: quantities[item.ref],
        price: item.price,
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
            {clientName ? `Bonjour ${clientName} — sélectionnez vos outils` : 'Sélectionnez vos outils et validez par WhatsApp'}
          </p>
        </div>

        {CATEGORIES.map(cat => {
          const isOpen = openCats[cat.id] ?? false
          const activeDiam = filterDiam[cat.id] ?? null
          const activeLC = filterLC[cat.id] ?? null

          const diameters = [...new Set(cat.products.map(p => p.diameter))].sort((a, b) => a - b)
          const lengths = [...new Set(cat.products.map(p => p.cuttingLength))].sort((a, b) => a - b)

          const filtered = cat.products.filter(p =>
            (activeDiam === null || p.diameter === activeDiam) &&
            (activeLC === null || p.cuttingLength === activeLC)
          )

          const catCount = cat.products.reduce((s, item) => s + (quantities[item.ref] || 0), 0)
          const catTotal = cat.products.reduce((s, item) => s + (quantities[item.ref] || 0) * item.price, 0)

          return (
            <div key={cat.id} className="rounded-2xl border border-[#1e1e1e] overflow-hidden">

              {/* Header catégorie */}
              <button
                onClick={() => !cat.comingSoon && toggleCat(cat.id)}
                className={`w-full px-4 py-3.5 flex items-center justify-between bg-[#111] transition-colors ${cat.comingSoon ? 'cursor-default' : 'hover:bg-[#161616]'}`}
              >
                <div className="text-left min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-semibold text-sm">{cat.label}</span>
                    {cat.comingSoon && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1e1e1e] text-[#555] border border-[#2a2a2a]">
                        Bientôt disponible
                      </span>
                    )}
                    {catCount > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#d4780f]/20 text-[#d4780f]">
                        {catCount} article{catCount > 1 ? 's' : ''} — {fmt(catTotal)}€
                      </span>
                    )}
                  </div>
                  <p className="text-[#555] text-xs mt-0.5">{cat.description}</p>
                </div>
                {!cat.comingSoon && (
                  <svg className={`w-4 h-4 text-[#555] flex-shrink-0 ml-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>

              {/* Contenu */}
              {isOpen && !cat.comingSoon && (
                <div className="border-t border-[#1e1e1e]">

                  {/* Filtres */}
                  {(diameters.length > 1 || lengths.length > 1) && (
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
                            >
                              Ø {fmtD(d)}
                            </button>
                          ))}
                        </div>
                      )}
                      {lengths.length > 1 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[#555] text-[10px] font-semibold uppercase tracking-wider w-8">LC</span>
                          {lengths.map(lc => (
                            <button key={lc} onClick={() => toggleLC(cat.id, lc)}
                              className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                                activeLC === lc
                                  ? 'bg-[#d4780f] border-[#d4780f] text-white'
                                  : 'bg-[#1e1e1e] border-[#2a2a2a] text-[#888] hover:border-[#d4780f] hover:text-white'
                              }`}
                            >
                              LC {lc}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Produits */}
                  <div className="divide-y divide-[#1a1a1a]">
                    {filtered.length === 0 ? (
                      <p className="px-4 py-6 text-xs text-[#444] text-center">Aucun produit pour ces filtres</p>
                    ) : (
                      filtered.map(item => {
                        const qty = quantities[item.ref] || 0
                        const selected = qty > 0
                        return (
                          <div key={item.ref}
                            className={`px-4 py-3 flex items-center gap-3 transition-colors ${selected ? 'bg-[#1a1200]' : 'bg-[#0d0d0d]'}`}
                          >
                            <div className="flex-1 min-w-0">
                              <span className="font-mono text-[10px] text-[#555] bg-[#1e1e1e] px-1.5 py-0.5 rounded">{item.ref}</span>
                              <p className="text-white text-sm font-medium mt-1">
                                {item.designation} <span className="text-[#555]">{item.queue}</span>
                              </p>
                              {selected && (
                                <p className="text-[#d4780f] text-xs mt-0.5">Sous-total : {fmt(qty * item.price)}€ HT</p>
                              )}
                            </div>
                            <div className="flex-shrink-0 flex items-center gap-2">
                              <span className="text-[#d4780f] font-bold text-sm w-14 text-right">{fmt(item.price)}€</span>
                              <div className="flex items-center gap-1">
                                <button onClick={() => setQty(item.ref, -1)}
                                  className="w-7 h-7 rounded-lg bg-[#1e1e1e] border border-[#2a2a2a] text-[#888] hover:text-white hover:border-[#d4780f] transition-colors flex items-center justify-center font-bold text-base leading-none"
                                >−</button>
                                <input type="number" min={0}
                                  value={qty === 0 ? '' : qty}
                                  onChange={e => setQtyDirect(item.ref, e.target.value)}
                                  placeholder="0"
                                  className={`w-9 text-center bg-[#1e1e1e] border rounded-lg text-sm font-bold py-1 outline-none transition-colors ${
                                    selected ? 'border-[#d4780f] text-[#d4780f]' : 'border-[#2a2a2a] text-[#555]'
                                  }`}
                                />
                                <button onClick={() => setQty(item.ref, +1)}
                                  className="w-7 h-7 rounded-lg bg-[#1e1e1e] border border-[#2a2a2a] text-[#888] hover:text-white hover:border-[#d4780f] transition-colors flex items-center justify-center font-bold text-base leading-none"
                                >+</button>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        <p className="text-[#333] text-xs text-center pt-2">Prix HT — Tarifs réservés aux clients SPINCUT</p>
      </div>

      {/* Barre commande fixe */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0d0d0d]/95 backdrop-blur border-t border-[#1e1e1e] px-4 py-3">
        <div className="max-w-2xl mx-auto space-y-2">

          {/* Succès */}
          {orderStatus === 'success' && (
            <div className="rounded-xl bg-[#0a2010] border border-green-800 px-4 py-3 flex items-center gap-3">
              <span className="text-green-400 text-lg">✓</span>
              <div>
                <p className="text-green-400 text-sm font-semibold">Commande envoyée !</p>
                <p className="text-green-700 text-xs mt-0.5">Votre devis a été créé — SPINCUT vous recontacte sous 24h.</p>
              </div>
              <button onClick={() => setOrderStatus('idle')} className="ml-auto text-green-700 hover:text-green-400 text-lg">×</button>
            </div>
          )}

          {/* Erreur */}
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
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
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
