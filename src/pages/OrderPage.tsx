import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useClientAuth, getAccessCodes, getClientCode } from '../hooks/useAuth'
import SpincutLogo from '../components/SpincutLogo'

interface Product {
  ref: string
  designation: string
  queue: string
  price: number
}

interface SubCategory {
  id: string
  label: string
  products: Product[]
}

interface Category {
  id: string
  label: string
  description: string
  subCategories: SubCategory[]
  comingSoon?: boolean
}

const CATEGORIES: Category[] = [
  {
    id: 'compression',
    label: 'Fraise Compression',
    description: '2 faces nettes — mélaminé, contreplaqué, MDF, stratifié HPL/CPL',
    subCategories: [
      {
        id: 'compression_lc22',
        label: 'LC22 — Longueur de coupe 22 mm',
        products: [
          { ref: '10363122', designation: 'Ø3,175 LC22 LT50 Z2+2', queue: 'Q3,175', price: 17.90 },
          { ref: '10360422', designation: 'Ø4 LC22 LT50 Z2+2',     queue: 'Q4',     price: 16.90 },
          { ref: '10360522', designation: 'Ø5 LC22 LT50 Z2+2',     queue: 'Q5',     price: 26.90 },
          { ref: '10380622', designation: 'Ø6 LC22 LT50 Z3+3',     queue: 'Q6',     price: 27.90 },
          { ref: '10380822', designation: 'Ø8 LC22 LT60 Z3+3',     queue: 'Q8',     price: 49.90 },
        ],
      },
      {
        id: 'compression_lc32',
        label: 'LC32 — Longueur de coupe 32 mm',
        products: [
          { ref: '10380632', designation: 'Ø6 LC32 LT70 Z3+3', queue: 'Q6', price: 34.90 },
          { ref: '10380832', designation: 'Ø8 LC32 LT70 Z3+3', queue: 'Q8', price: 64.90 },
        ],
      },
    ],
  },
  {
    id: 'carbure',
    label: 'Fraise Carbure',
    description: 'Bois massif, MDF, panneaux, PVC, PMMA, aluminium',
    comingSoon: true,
    subCategories: [
      { id: 'carbure_1d', label: '1 Dent', products: [] },
      { id: 'carbure_2d', label: '2 Dents', products: [] },
      { id: 'carbure_3d', label: '3 Dents', products: [] },
    ],
  },
  {
    id: 'diamant',
    label: 'Diamant (PCD)',
    description: 'Usage intensif — MDF, HDF, mélaminé, aggloméré, composites (pas bois massif)',
    comingSoon: true,
    subCategories: [
      { id: 'diamant_droite', label: 'Droite', products: [] },
      { id: 'diamant_compression', label: 'Compression', products: [] },
    ],
  },
  {
    id: 'ravageuse',
    label: 'Ravageuse',
    description: 'Ébauche rapide — bois massif tendre et dur, panneaux épais',
    comingSoon: true,
    subCategories: [
      { id: 'ravageuse_std', label: 'Standard', products: [] },
    ],
  },
]

const ALL_PRODUCTS = CATEGORIES.flatMap(c => c.subCategories.flatMap(s => s.products))

function fmt(n: number) { return n.toFixed(2).replace('.', ',') }

export default function OrderPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useClientAuth()
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({ compression: true })
  const [openSubs, setOpenSubs] = useState<Record<string, boolean>>({ compression_lc22: true })

  const clientCode = getClientCode()
  const clientInfo = clientCode ? getAccessCodes().find(c => c.code === clientCode) : null
  const clientName = clientInfo?.clientName ?? null

  const setQty = (ref: string, delta: number) =>
    setQuantities(prev => ({ ...prev, [ref]: Math.max(0, (prev[ref] || 0) + delta) }))

  const setQtyDirect = (ref: string, val: string) =>
    setQuantities(prev => ({ ...prev, [ref]: Math.max(0, parseInt(val) || 0) }))

  const toggleCat = (id: string) => setOpenCats(prev => ({ ...prev, [id]: !prev[id] }))
  const toggleSub = (id: string) => setOpenSubs(prev => ({ ...prev, [id]: !prev[id] }))

  const total = ALL_PRODUCTS.reduce((s, item) => s + (quantities[item.ref] || 0) * item.price, 0)
  const hasItems = ALL_PRODUCTS.some(item => (quantities[item.ref] || 0) > 0)
  const itemCount = ALL_PRODUCTS.reduce((s, item) => s + (quantities[item.ref] || 0), 0)

  if (!isAuthenticated) { navigate('/'); return null }

  const sendOrder = () => {
    const lines = ALL_PRODUCTS
      .filter(item => (quantities[item.ref] || 0) > 0)
      .map(item => {
        const qty = quantities[item.ref]
        return `· ${item.designation} ${item.queue} (réf. ${item.ref}) ×${qty} = ${fmt(qty * item.price)}€`
      }).join('\n')
    const clientLine = clientName ? `Client : ${clientName}\n\n` : ''
    const msg = encodeURIComponent(`🛒 Commande SPINCUT\n\n${clientLine}${lines}\n\nTOTAL : ${fmt(total)}€ HT`)
    window.open(`https://wa.me/33767739561?text=${msg}`, '_blank')
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
          const catProducts = cat.subCategories.flatMap(s => s.products)
          const catCount = catProducts.reduce((s, item) => s + (quantities[item.ref] || 0), 0)
          const catTotal = catProducts.reduce((s, item) => s + (quantities[item.ref] || 0) * item.price, 0)

          return (
            <div key={cat.id} className="rounded-2xl border border-[#1e1e1e] overflow-hidden">

              {/* Catégorie header */}
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

              {/* Sous-catégories */}
              {isOpen && !cat.comingSoon && (
                <div className="border-t border-[#1e1e1e]">
                  {cat.subCategories.map(sub => {
                    const isSubOpen = openSubs[sub.id] ?? false
                    const subCount = sub.products.reduce((s, item) => s + (quantities[item.ref] || 0), 0)

                    return (
                      <div key={sub.id} className="border-b border-[#1a1a1a] last:border-b-0">

                        {/* Sous-catégorie header */}
                        <button
                          onClick={() => toggleSub(sub.id)}
                          className="w-full px-4 py-2.5 flex items-center justify-between bg-[#0f0f0f] hover:bg-[#161616] transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[#aaa] text-xs font-semibold">{sub.label}</span>
                            {subCount > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#d4780f]/20 text-[#d4780f] font-bold">
                                {subCount}
                              </span>
                            )}
                          </div>
                          <svg className={`w-3.5 h-3.5 text-[#444] transition-transform ${isSubOpen ? 'rotate-180' : ''}`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {/* Produits */}
                        {isSubOpen && (
                          <div className="divide-y divide-[#1a1a1a]">
                            {sub.products.length === 0 ? (
                              <p className="px-4 py-3 text-xs text-[#444] italic">Références à venir</p>
                            ) : (
                              sub.products.map(item => {
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
                                          className={`w-9 text-center bg-[#1e1e1e] border rounded-lg text-sm font-bold py-1 outline-none transition-colors ${selected ? 'border-[#d4780f] text-[#d4780f]' : 'border-[#2a2a2a] text-[#555]'}`}
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
                        )}
                      </div>
                    )
                  })}
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
          {hasItems && (
            <div className="flex items-center justify-between px-1">
              <span className="text-[#888] text-sm">{itemCount} article{itemCount > 1 ? 's' : ''}</span>
              <span className="text-[#d4780f] font-bold text-lg">{fmt(total)}€ HT</span>
            </div>
          )}
          <button
            onClick={sendOrder}
            disabled={!hasItems}
            className={`w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              hasItems
                ? 'bg-[#25D366] text-white hover:bg-[#1fb558] active:scale-95'
                : 'bg-[#1e1e1e] text-[#444] cursor-not-allowed border border-[#2a2a2a]'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            {hasItems ? `Envoyer ma commande — ${fmt(total)}€ HT` : 'Sélectionnez des produits'}
          </button>
        </div>
      </div>
    </div>
  )
}
