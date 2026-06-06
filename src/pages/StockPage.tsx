import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClientAuth, getClientCode } from '../hooks/useAuth'
import BottomNav from '../components/BottomNav'

interface CatalogProduct {
  sheet: string; row: number; ref: string
  prix: number; stock: number; designation: string
}

interface StockItem {
  ref: string
  designation: string
  qty: number
  minQty: number
  updatedAt: number
}

function uid(p: CatalogProduct) { return `${p.ref}__${p.row}` }

function stockStatus(item: StockItem): 'ok' | 'low' | 'empty' {
  if (item.qty === 0) return 'empty'
  if (item.qty < item.minQty) return 'low'
  return 'ok'
}

export default function StockPage() {
  const navigate = useNavigate()
  const { isAuthenticated, logout } = useClientAuth()

  const clientCode = getClientCode()
  const cartKey  = `spincut_cart_${clientCode ?? 'guest'}`
  const stockKey = `spincut_stock_${clientCode ?? 'guest'}`

  const [catalog, setCatalog] = useState<CatalogProduct[]>(() => {
    try { return JSON.parse(localStorage.getItem('spincut_catalog_cache') ?? '[]') } catch { return [] }
  })
  const [stock, setStock] = useState<StockItem[]>(() => {
    try { return JSON.parse(localStorage.getItem(`spincut_stock_${getClientCode() ?? 'guest'}`) ?? '[]') } catch { return [] }
  })
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem(`spincut_cart_${getClientCode() ?? 'guest'}`) ?? '{}') } catch { return {} }
  })
  const [showAddStock, setShowAddStock] = useState(false)
  const [stockSearch, setStockSearch]   = useState('')
  const [addedToCart, setAddedToCart]   = useState<string | null>(null)

  useEffect(() => {
    try { localStorage.setItem(stockKey, JSON.stringify(stock)) } catch { /* ignore */ }
  }, [stock, stockKey])

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

  const itemCount = Object.values(quantities).reduce((s, v) => s + v, 0)
  const total = catalog
    .filter(p => (quantities[uid(p)] || 0) > 0)
    .reduce((s, p) => s + (quantities[uid(p)] || 0) * p.prix, 0)

  if (!isAuthenticated) { navigate('/'); return null }
  localStorage.setItem('spincut_last_section', '/stock')

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

  const alertCount = stock.filter(s => stockStatus(s) !== 'ok').length

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-black border-b border-[#1a1a1a]">
        <div className="max-w-2xl mx-auto px-4 py-2 relative flex items-center justify-center">
          <button onClick={() => navigate('/profil')}
            className="absolute left-4 flex items-center gap-1 text-[#555] hover:text-white text-xs transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            Profil
          </button>
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

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pb-36 pt-4 space-y-4">

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-bold text-base">Mon Stock</p>
            <p className="text-[#555] text-xs mt-0.5">
              {stock.length === 0
                ? 'Suivez vos outils et commandez au bon moment'
                : `${stock.length} outil${stock.length > 1 ? 's' : ''} suivis${alertCount > 0 ? ` · ${alertCount} alerte${alertCount > 1 ? 's' : ''}` : ''}`
              }
            </p>
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
            Ajouté au panier — allez dans l'onglet Suivi
          </div>
        )}

        {/* Stock list */}
        {stock.length > 0 ? (
          <div className="space-y-3">
            {stock.map(item => {
              const status = stockStatus(item)
              const cfg = {
                ok:    { color: '#4ade80', bg: '#0d1a0d', label: 'OK',      border: '#1a4a1a' },
                low:   { color: '#fbbf24', bg: '#1a1400', label: 'Faible',  border: '#3a2a00' },
                empty: { color: '#f87171', bg: '#1a0505', label: 'Rupture', border: '#4a1010' },
              }[status]
              const canOrder = catalog.some(p => p.ref === item.ref)
              return (
                <div key={item.ref} className="rounded-2xl overflow-hidden" style={{ background: '#111', border: `1px solid ${cfg.border}` }}>
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
          <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
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

      <BottomNav cartCount={itemCount} cartTotal={total} />
    </div>
  )
}
