import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClientAuth, getClientCode } from '../hooks/useAuth'
import BottomNav from '../components/BottomNav'

interface CatalogProduct {
  sheet: string; row: number; ref: string; famille: string
  diametre: string; lc: string; lt: string; dents: string
  angle: string; queue: string; sens: string
  prix: number; stock: number; pm: boolean; category: string; designation: string
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

const SHOP_TABS = [
  { id: 'cnc', label: 'Fraises CNC' },
  { id: 'cmt', label: 'Fraises Défonceuse' },
  { id: 'lames', label: 'Lames Circulaires Carbure' },
]

const HERO_PHOTOS = ['/photo1.jpg', '/photo2.jpg', '/photo3.jpg', '/photo4.png']

export default function BoutiquePage() {
  const navigate = useNavigate()
  const { isAuthenticated, logout } = useClientAuth()

  const clientCode = getClientCode()
  const cartKey = `spincut_cart_${clientCode ?? 'guest'}`

  const [homeView, setHomeView] = useState(true)
  const [favsView, setFavsView] = useState(false)
  const [heroBg, setHeroBg] = useState(0)
  const [shopTab, setShopTab] = useState<'cnc' | 'cmt' | 'lames'>('cnc')
  const [catalog, setCatalog] = useState<CatalogProduct[]>(() => {
    try { return JSON.parse(localStorage.getItem('spincut_catalog_cache') ?? '[]') } catch { return [] }
  })
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filterDiam, setFilterDiam] = useState<string | null>(null)
  const [filterLC, setFilterLC] = useState<string | null>(null)
  const [filterDents, setFilterDents] = useState<string | null>(null)
  const [filterPM, setFilterPM] = useState(false)

  const favKey = `spincut_favs_${clientCode ?? 'guest'}`
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(`spincut_favs_${clientCode ?? 'guest'}`) ?? '[]')) } catch { return new Set() }
  })
  const toggleFav = (id: string) => setFavorites(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    try { localStorage.setItem(favKey, JSON.stringify([...next])) } catch {}
    return next
  })

  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem(cartKey) ?? '{}') } catch { return {} }
  })

  const cartCount = useMemo(() => Object.values(quantities).reduce((s, v) => s + v, 0), [quantities])
  const cartTotal = useMemo(() => catalog.reduce((s, p) => s + (quantities[uid(p)] || 0) * p.prix, 0), [catalog, quantities])

  useEffect(() => {
    localStorage.setItem('spincut_last_section', '/boutique')
  }, [])

  useEffect(() => {
    if (!homeView) return
    const t = setInterval(() => setHeroBg(i => (i + 1) % HERO_PHOTOS.length), 2500)
    return () => clearInterval(t)
  }, [homeView])

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
        } else setCatalogError(data?.error ?? 'Erreur catalogue')
        setCatalogLoading(false)
      })
      .catch(() => { setCatalogError('Impossible de charger le catalogue'); setCatalogLoading(false) })
  }, [])

  const activeTabCatalog = useMemo(() => {
    if (shopTab === 'cnc') return catalog.filter(p => ['STOCK A0', 'STOCK B0', 'STOCK A2', 'STOCK B2'].includes(p.sheet))
    if (shopTab === 'cmt') return catalog.filter(p => ['STOCK A1', 'STOCK B1'].includes(p.sheet))
    return catalog.filter(p => ['STOCK A3', 'STOCK B3'].includes(p.sheet))
  }, [shopTab, catalog])

  const tabs = useMemo(() => {
    const cats = new Set(activeTabCatalog.map(p => p.category))
    return Object.entries(CATEGORY_META).filter(([id]) => cats.has(id)).sort((a, b) => a[1].order - b[1].order)
  }, [activeTabCatalog])

  const categoryProducts = useMemo(() =>
    activeCategory ? activeTabCatalog.filter(p => p.category === activeCategory) : [],
  [activeTabCatalog, activeCategory])

  const diameters = useMemo(() => [...new Set(categoryProducts.map(p => p.diametre).filter(d => d && d !== '/'))].sort((a, b) => parseFloat(a) - parseFloat(b)), [categoryProducts])
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

  const setQty = (key: string, delta: number, max: number) =>
    setQuantities(prev => ({ ...prev, [key]: Math.min(max, Math.max(0, (prev[key] || 0) + delta)) }))
  const setQtyDirect = (key: string, val: string, max: number) =>
    setQuantities(prev => ({ ...prev, [key]: Math.min(max, Math.max(0, parseInt(val) || 0)) }))

  const favoriteItems = useMemo(() => catalog.filter(p => favorites.has(uid(p))), [catalog, favorites])

  const selectCategory = (id: string) => { setActiveCategory(id); setFiltersOpen(false); resetFilters() }
  const goHome = () => { setHomeView(true); setFavsView(false); setActiveCategory(null); resetFilters(); setFiltersOpen(false) }
  const enterTab = (tab: 'cnc' | 'cmt' | 'lames') => { setHomeView(false); setFavsView(false); setShopTab(tab); setActiveCategory(null); resetFilters() }
  const enterFavs = () => { setHomeView(false); setFavsView(true); setActiveCategory(null); resetFilters() }


  if (!isAuthenticated) { navigate('/'); return null }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-black border-b border-[#1a1a1a]">
        <div className="max-w-2xl mx-auto px-4 py-2 relative flex items-center justify-center">
          {/* Back to home button — visible in shop view */}
          {!homeView && (
            <button onClick={goHome} className="absolute left-4 flex items-center gap-1 text-[#555] hover:text-white text-xs transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}/>
              </svg>
            </button>
          )}
          <img src="/logo.png" alt="SPINCUT Outils CNC" style={{ height: '200px', objectFit: 'contain', mixBlendMode: 'screen', maskImage: 'radial-gradient(ellipse 88% 80% at 50% 50%, black 35%, transparent 100%)', WebkitMaskImage: 'radial-gradient(ellipse 88% 80% at 50% 50%, black 35%, transparent 100%)' }} />
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

        {/* Shop tabs — only in shop view, not in favs view */}
        {!homeView && !favsView && (
          <div className="flex border-b border-[#1a1a1a] max-w-2xl mx-auto">
            {SHOP_TABS.map(t => (
              <button
                key={t.id}
                onClick={() => { setShopTab(t.id as typeof shopTab); setActiveCategory(null); resetFilters() }}
                className="flex-1 py-3 flex flex-col items-center gap-0.5 transition-colors"
                style={{ borderBottom: shopTab === t.id ? '2px solid #d4780f' : '2px solid transparent' }}
              >
                <span className="text-[11px] font-bold leading-tight text-center" style={{ color: shopTab === t.id ? '#d4780f' : '#888' }}>{t.label}</span>
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full pb-24">

        {/* ── HOME VIEW ── */}
        {homeView && (
          <>
            {/* Hero with rotating photos */}
            <div className="relative overflow-hidden" style={{ height: '300px', background: '#000' }}>
              {HERO_PHOTOS.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  className="transition-opacity duration-1000"
                  style={{
                    opacity: i === heroBg ? 1 : 0,
                    position: 'absolute',
                    top: 0, left: 0,
                    width: '100%', height: '100%',
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
              ))}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.7) 78%, #000 100%)' }} />
              {/* Photo dots */}
              <div className="absolute bottom-3 right-4 flex gap-1">
                {HERO_PHOTOS.map((_, i) => (
                  <button key={i} onClick={() => setHeroBg(i)}
                    style={{ width: i === heroBg ? '14px' : '5px', height: '5px', borderRadius: '3px', background: i === heroBg ? '#d4780f' : 'rgba(255,255,255,0.3)', border: 'none', padding: 0, transition: 'all 0.2s', cursor: 'pointer' }}
                  />
                ))}
              </div>
            </div>

            <div className="px-4 space-y-3 pt-5 pb-6">

                {/* Trust badges */}
              <div className="flex gap-2 pt-1">
                {[
                  { icon: '⚡', label: 'Expédié sous 24h' },
                  { icon: '✓', label: 'Qualité garantie' },
                  { icon: '⏱', label: 'Réponse < 1h' },
                ].map(b => (
                  <div key={b.label} className="flex-1 rounded-xl px-2 py-2.5 flex flex-col items-center gap-1 text-center" style={{ background: '#0d0d0d', border: '1px solid #1e1e1e' }}>
                    <span className="text-base leading-none">{b.icon}</span>
                    <span className="text-[9px] font-semibold leading-tight" style={{ color: '#555' }}>{b.label}</span>
                  </div>
                ))}
              </div>

              <p className="text-[10px] font-bold uppercase tracking-widest pt-1" style={{ color: '#444' }}>Boutique</p>

              {/* Fraises CNC — noir/orange pur */}
              <button
                onClick={() => enterTab('cnc')}
                className="w-full rounded-2xl relative overflow-hidden active:scale-[0.98] transition-all text-left"
                style={{ height: '130px', background: 'linear-gradient(135deg, #1a0800 0%, #030100 100%)', border: '1px solid #d4780f44' }}
              >
                <div className="absolute inset-0 flex items-center px-5">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-black text-xl leading-tight">Fraises CNC</p>
                    <p className="text-xs mt-2 font-black tracking-widest" style={{ color: '#d4780f' }}>SPINCUT</p>
                  </div>
                  <div style={{ width: '4px', height: '60px', background: 'linear-gradient(to bottom, #d4780f, #3a1e0044)', borderRadius: '2px', flexShrink: 0 }} />
                </div>
              </button>

              {/* Fraises Défonceuse — blanc/orange CMT */}
              <button
                onClick={() => enterTab('cmt')}
                className="w-full rounded-2xl relative overflow-hidden active:scale-[0.98] transition-all text-left"
                style={{ height: '130px', background: 'linear-gradient(135deg, #1e1c14 0%, #0c0b08 100%)', border: '1px solid #f0dbb044' }}
              >
                <div className="absolute inset-0 flex items-center px-5">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-black text-xl leading-tight">Fraises Défonceuse</p>
                    <p className="text-xs mt-2 font-black tracking-widest" style={{ color: '#f0dbb0' }}>CMT</p>
                  </div>
                  <div style={{ width: '4px', height: '60px', background: 'linear-gradient(to bottom, #f0dbb0, #3a3420)', borderRadius: '2px', flexShrink: 0 }} />
                </div>
              </button>

              {/* Lames Carbure — gris carbure métallique */}
              <button
                onClick={() => enterTab('lames')}
                className="w-full rounded-2xl relative overflow-hidden active:scale-[0.98] transition-all text-left"
                style={{ height: '130px', background: 'linear-gradient(135deg, #1a1a1a 0%, #080808 100%)', border: '1px solid #3a3a3a' }}
              >
                <div className="absolute inset-0 flex items-center px-5">
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-xl leading-tight" style={{ color: '#d0d0d0' }}>Lames Circulaires Carbure</p>
                  </div>
                  <div style={{ width: '4px', height: '60px', background: 'linear-gradient(to bottom, #aaaaaa, #3a3a3a)', borderRadius: '2px', flexShrink: 0 }} />
                </div>
              </button>

              {/* Mes outils favoris — uniquement si favoris */}
              {favorites.size > 0 && (
                <button
                  onClick={enterFavs}
                  className="w-full rounded-2xl relative overflow-hidden active:scale-[0.98] transition-all text-left"
                  style={{ height: '90px', background: 'linear-gradient(135deg, #1a0507 0%, #080002 100%)', border: '1px solid #5a1a20' }}
                >
                  <div className="absolute inset-0 flex items-center px-5">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-black text-lg leading-tight">Mes outils favoris</p>
                      <p className="text-xs mt-1 font-semibold" style={{ color: '#e03c3c' }}>{favorites.size} outil{favorites.size > 1 ? 's' : ''} sauvegardé{favorites.size > 1 ? 's' : ''}</p>
                    </div>
                    <svg width="30" height="30" fill="#e03c3c" viewBox="0 0 24 24" style={{ flexShrink: 0, opacity: 0.9 }}>
                      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                    </svg>
                  </div>
                </button>
              )}

            </div>
          </>
        )}

        {/* ── FAVORIS VIEW ── */}
        {!homeView && favsView && (
          <>
            <div className="px-4 pt-4 pb-2 flex items-center gap-2">
              <button onClick={goHome} className="flex items-center gap-1 text-xs text-[#555] hover:text-white transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5M12 19l-7-7 7-7"/></svg>
                Boutique
              </button>
              <span className="text-[#333] text-xs">·</span>
              <span className="flex items-center gap-1 text-xs" style={{ color: '#e03c3c' }}>
                <svg width="11" height="11" fill="currentColor" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                Mes outils favoris
              </span>
            </div>

            {favoriteItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-6">
                <div className="w-16 h-16 rounded-2xl bg-[#161616] border border-[#2a2a2a] flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#333]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-white font-bold text-base">Vous n'avez pas encore d'outils favoris</p>
                  <p className="text-[#444] text-sm mt-1">Appuyez sur ♥ sur un produit pour le sauvegarder ici</p>
                </div>
                <button
                  onClick={goHome}
                  className="py-3 px-6 rounded-xl text-sm font-bold text-white active:scale-95 transition-all"
                  style={{ background: '#d4780f' }}
                >
                  Découvrir la boutique →
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#161616]">
                {favoriteItems.map(item => {
                  const key = uid(item)
                  const qty = quantities[key] || 0
                  const selected = qty > 0
                  const outOfStock = item.stock === 0
                  return (
                    <div key={key} className={`px-4 py-4 flex items-center gap-4 transition-colors ${selected ? 'bg-[#130e00]' : 'bg-black'} ${outOfStock ? 'opacity-40' : ''}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className="font-mono text-[10px] text-[#444] bg-[#1a1a1a] px-1.5 py-0.5 rounded">{item.ref}</span>
                          <StockBadge stock={item.stock} />
                          <button onClick={() => toggleFav(key)} style={{ color: '#e03c3c', marginLeft: '2px' }}>
                            <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                          </button>
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
          </>
        )}

        {/* ── SHOP VIEW ── */}
        {!homeView && !favsView && (
          <>
            {(true) && (
              <>
                {/* Filter bar */}
                {!catalogLoading && !catalogError && activeCategory && (
                  <div className="px-4 pt-4 pb-1 flex items-center gap-2">
                    <button
                      onClick={() => { setActiveCategory(null); resetFilters(); setFiltersOpen(false) }}
                      className="flex items-center gap-1 text-xs text-[#555] hover:text-white transition-colors flex-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5M12 19l-7-7 7-7"/></svg>
                      {CATEGORY_META[activeCategory]?.label}
                    </button>
                    {activeFilterCount > 0 && <button onClick={resetFilters} className="text-xs text-[#555] hover:text-red-400 transition-colors">Effacer</button>}
                    <span className="text-xs text-[#444]">{filtered.length} produit{filtered.length !== 1 ? 's' : ''}</span>
                    <button
                      onClick={() => setFiltersOpen(o => !o)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${activeFilterCount > 0 ? 'bg-[#d4780f] border-[#d4780f] text-white' : 'bg-[#1a1a1a] border-[#2a2a2a] text-[#888]'}`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M7 12h10M11 20h2"/></svg>
                      Filtres{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                    </button>
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

                {catalogLoading && (
                  <div className="flex items-center justify-center py-20 gap-3 text-[#444]">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                    Chargement…
                  </div>
                )}

                {catalogError && <div className="m-4 rounded-xl bg-[#2a0000] border border-red-800 px-4 py-3"><p className="text-red-400 text-sm">{catalogError}</p></div>}

                {/* Category picker */}
                {!catalogLoading && !catalogError && !activeCategory && (
                  <div className="px-4 pt-5 space-y-2">
                    {activeTabCatalog.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                        <p className="text-white font-bold text-lg">Catalogue en cours de construction</p>
                        <p className="text-[#555] text-sm max-w-xs">Les produits seront disponibles très prochainement.</p>
                        <a
                          href="https://wa.me/33767739561"
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white mt-2"
                          style={{ background: '#1a5e1a' }}
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                          Me prévenir à l'ouverture
                        </a>
                      </div>
                    ) : (
                      <>
                        <p className="text-[#555] text-xs uppercase tracking-widest font-bold mb-4">Catégories</p>
                        {tabs.map(([id, meta]) => (
                          <button key={id} onClick={() => selectCategory(id)}
                            className="w-full px-4 py-3.5 rounded-xl bg-[#161616] border border-[#2a2a2a] text-left text-sm font-medium text-white hover:border-[#d4780f] hover:bg-[#1a1200] transition-colors flex items-center justify-between active:scale-[0.99]"
                          >
                            {meta.label}
                            <svg className="w-4 h-4 text-[#444]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                )}

                {/* Product list */}
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
                          className={`px-4 py-4 flex items-center gap-4 transition-colors ${selected ? 'bg-[#130e00]' : 'bg-black'} ${outOfStock ? 'opacity-40' : ''}`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap mb-1">
                              <span className="font-mono text-[10px] text-[#444] bg-[#1a1a1a] px-1.5 py-0.5 rounded">{item.ref}</span>
                              <StockBadge stock={item.stock} />
                              {item.pm && <span className="text-[10px] font-semibold text-purple-400 bg-purple-900/20 px-1.5 py-0.5 rounded">Polimiroir</span>}
                              <button onClick={() => toggleFav(key)} className="ml-0.5" style={{ color: favorites.has(key) ? '#e03c3c' : '#333' }}>
                                <svg width="13" height="13" fill={favorites.has(key) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                              </button>
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
              </>
            )}

          </>
        )}
      </main>

      <BottomNav cartCount={cartCount} cartTotal={cartTotal} />
    </div>
  )
}
