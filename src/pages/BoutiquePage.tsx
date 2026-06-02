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
  classique:   { label: 'Fraise Classique',        order: 1 },
  polimiroir:  { label: 'Fraise Polimiroir',        order: 2 },
  compression: { label: 'Fraise Compression',       order: 3 },
  diamant:     { label: 'Diamant (PCD)',             order: 4 },
  ravageuse:   { label: 'Ravageuse',                order: 5 },
  alu:         { label: 'Aluminium',                order: 6 },
  gravure:     { label: 'Fraise Gravure',           order: 7 },
  percage:     { label: 'Perçage',                  order: 8 },
  rainurer:    { label: 'Fraise à Rainurer',        order: 9 },
  affleurer:   { label: 'Fraise à Affleurer',       order: 10 },
  feuillure:   { label: 'Fraise à Feuillure',       order: 11 },
  faconner:    { label: 'Fraise à Façonner',        order: 12 },
  plaquette:   { label: 'Fraise à Plaquette',       order: 13 },
  accessoires: { label: 'Accessoires',              order: 14 },
}

// Photos: déposer dans /public/images/categories/
// Formats acceptés : .jpg .png .webp  —  Taille recommandée : 800×800px fond blanc
const CATEGORY_IMAGES: Record<string, string> = {
  classique:   '/images/categories/classique.jpg',
  polimiroir:  '/images/categories/classique.jpg',   // même visuel que classique
  compression: '/images/categories/compression.jpg',
  diamant:     '/images/categories/diamant.jpg',
  ravageuse:   '/images/categories/ravageuse.jpg',
  alu:         '/images/categories/alu.jpg',
  gravure:     '/images/categories/gravure.jpg',
  percage:     '/images/categories/percage.jpg',
  rainurer:    '/images/categories/classique.jpg',
  affleurer:   '/images/categories/classique.jpg',
  feuillure:   '/images/categories/classique.jpg',
  faconner:    '/images/categories/classique.jpg',
  plaquette:   '/images/categories/classique.jpg',
  accessoires: '/images/categories/accessoires.jpg',
  lame:        '/images/categories/lame.jpg',
}

const CATEGORY_DESC: Record<string, string> = {
  classique:   'Bois massif, panneaux, MDF',
  polimiroir:  'PVC, acrylique, plastiques',
  compression: 'Mélaminé, CTP double face',
  diamant:     'HPL, Mélaminé, MDF, panneaux abrasifs',
  ravageuse:   'Ébauche bois et aluminium',
  alu:         'Aluminium toutes nuances',
  gravure:     'Gravure V-carve, marquage',
  percage:     'Perçage vertical CNC',
  rainurer:    'Rainures et assemblages',
  affleurer:   'Affleurage et défonçage',
  feuillure:   'Feuillures et panneaux',
  faconner:    'Profils décoratifs',
  plaquette:   'Fraisage indexable',
  accessoires: 'Collets, aspiration, kits',
}

function fmt(n: number) { return n.toFixed(2).replace('.', ',') }
function uid(p: CatalogProduct) { return `${p.ref}__${p.row}` }

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <span className="flex items-center gap-1 text-[10px] font-semibold text-red-400"><span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />Rupture</span>
  if (stock <= 5) return <span className="flex items-center gap-1 text-[10px] font-semibold text-orange-400"><span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block" />Stock faible ({stock})</span>
  return <span className="flex items-center gap-1 text-[10px] text-[#555]"><span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />En stock ({stock})</span>
}

// ── Schéma technique automatique ──────────────────────────────────────────────
// ── Image catégorie avec placeholder ──────────────────────────────────────────
function CategoryImage({ category, shopTab, className = '', style }: { category: string; shopTab: string; className?: string; style?: React.CSSProperties }) {
  const [err, setErr] = useState(false)
  const src = shopTab === 'lames' ? CATEGORY_IMAGES['lame'] : (CATEGORY_IMAGES[category] ?? CATEGORY_IMAGES['classique'])
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: '#0d0d0d', ...style }}>
      {/* Placeholder visible quand photo manquante */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1a0800 0%, #0a0500 100%)' }}>
        <span className="text-[#d4780f22] font-black text-4xl select-none">S</span>
      </div>
      {!err && (
        <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover"
          onError={() => setErr(true)}/>
      )}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.55) 100%)' }}/>
    </div>
  )
}

const SHOP_TABS = [
  { id: 'cnc',   label: 'Fraises CNC' },
  { id: 'cmt',   label: 'Fraises Défonceuse' },
  { id: 'lames', label: 'Lames Carbure' },
]

const HERO_PHOTOS = ['/photo1.jpg', '/photo2.jpg', '/photo3.jpg', '/photo4.png']

const CMT_PHOTO_MAP: Record<string, string> = {
  '19812011':   '/images/cmt/cmt-02.png',
  '91106011':   '/images/cmt/cmt-03.png',
  '91107011':   '/images/cmt/cmt-03.png',
  '91108011':   '/images/cmt/cmt-03.png',
  '91110011':   '/images/cmt/cmt-03.png',
  '91119011':   '/images/cmt/cmt-03.png',
  '91120011':   '/images/cmt/cmt-03.png',
  '91206011':   '/images/cmt/cmt-06.png',
  '91210011':   '/images/cmt/cmt-06.png',
  '91216011B':  '/images/cmt/cmt-01.png',
  '70612711':   '/images/cmt/cmt-14.png',
  '90612711':   '/images/cmt/cmt-14.png',
  '90619111':   '/images/cmt/cmt-14.png',
  '90118011':   '/images/cmt/cmt-07.png',
  '90212011':   '/images/cmt/cmt-04.png',
  '90225011':   '/images/cmt/cmt-04.png',
  '93535011':   '/images/cmt/cmt-05.png',
  '51218011':   '/images/cmt/cmt-13.jpg',
  '51219011':   '/images/cmt/cmt-13.jpg',
  '92705011':   '/images/cmt/cmt-08.png',
  '93922211':   '/images/cmt/cmt-10.png',
  '91506011':   '/images/cmt/cmt-11.png',
  '65804511':   '/images/cmt/cmt-09.png',
  'W170.210.R': '/images/cmt/cmt-12.png',
  '82233511':   '/images/cmt/cmt-15.png',
}

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
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null)

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

  useEffect(() => { localStorage.setItem('spincut_last_section', '/boutique') }, [])
  useEffect(() => {
    if (!homeView) return
    const t = setInterval(() => setHeroBg(i => (i + 1) % HERO_PHOTOS.length), 2500)
    return () => clearInterval(t)
  }, [homeView])
  useEffect(() => {
    try { localStorage.setItem(cartKey, JSON.stringify(quantities)) } catch {}
  }, [quantities, cartKey])
  useEffect(() => {
    fetch('/api/catalog')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCatalog(data)
          try { localStorage.setItem('spincut_catalog_cache', JSON.stringify(data)) } catch {}
        } else setCatalogError(data?.error ?? 'Erreur catalogue')
        setCatalogLoading(false)
      })
      .catch(() => { setCatalogError('Impossible de charger le catalogue'); setCatalogLoading(false) })
  }, [])

  const activeTabCatalog = useMemo(() => {
    if (shopTab === 'cnc')   return catalog.filter(p => ['STOCK A0','STOCK A2'].includes(p.sheet))
    if (shopTab === 'cmt')   return catalog.filter(p => p.sheet === 'STOCK A1')
    return catalog.filter(p => p.sheet === 'STOCK A3')
  }, [shopTab, catalog])

  const tabs = useMemo(() => {
    const cats = new Set(activeTabCatalog.map(p => p.category))
    return Object.entries(CATEGORY_META).filter(([id]) => cats.has(id)).sort((a, b) => a[1].order - b[1].order)
  }, [activeTabCatalog])

  const usesCategories = shopTab === 'cnc'

  const categoryProducts = useMemo(() =>
    usesCategories
      ? (activeCategory ? activeTabCatalog.filter(p => p.category === activeCategory) : [])
      : activeTabCatalog,
  [activeTabCatalog, activeCategory, usesCategories])

  const diameters   = useMemo(() => [...new Set(categoryProducts.map(p => p.diametre).filter(d => d && d !== '/'))].sort((a, b) => parseFloat(a) - parseFloat(b)), [categoryProducts])
  const lcValues    = useMemo(() => [...new Set(categoryProducts.map(p => p.lc).filter(l => l && l !== '/'))].sort((a, b) => parseFloat(a) - parseFloat(b)), [categoryProducts])
  const dentsValues = useMemo(() => [...new Set(categoryProducts.map(p => p.dents).filter(d => d && d !== '/'))].sort(), [categoryProducts])
  const filtered    = useMemo(() => categoryProducts.filter(p =>
    (filterDiam  === null || p.diametre === filterDiam) &&
    (filterLC    === null || p.lc      === filterLC)    &&
    (filterDents === null || p.dents   === filterDents)
  ), [categoryProducts, filterDiam, filterLC, filterDents])

  const activeFilterCount = [filterDiam, filterLC, filterDents].filter(Boolean).length
  const resetFilters = () => { setFilterDiam(null); setFilterLC(null); setFilterDents(null) }

  const setQty = (key: string, delta: number, max: number) =>
    setQuantities(prev => ({ ...prev, [key]: Math.min(max, Math.max(0, (prev[key] || 0) + delta)) }))
  const setQtyDirect = (key: string, val: string, max: number) =>
    setQuantities(prev => ({ ...prev, [key]: Math.min(max, Math.max(0, parseInt(val) || 0)) }))

  const favoriteItems = useMemo(() => catalog.filter(p => favorites.has(uid(p))), [catalog, favorites])

  const selectCategory = (id: string) => { setActiveCategory(id); setFiltersOpen(false); resetFilters() }
  const goHome  = () => { setHomeView(true); setFavsView(false); setActiveCategory(null); resetFilters(); setFiltersOpen(false) }
  const enterTab = (tab: 'cnc' | 'cmt' | 'lames') => { setHomeView(false); setFavsView(false); setShopTab(tab); setActiveCategory(null); resetFilters() }
  const enterFavs = () => { setHomeView(false); setFavsView(true); setActiveCategory(null); resetFilters() }

  if (!isAuthenticated) { navigate('/'); return null }

  // ── Product row (shared between product list + favs) ──────────────────────
  const renderProductRow = (item: CatalogProduct) => {
    const key = uid(item)
    const qty = quantities[key] || 0
    const selected = qty > 0
    const outOfStock = item.stock === 0
    return (
      <div key={key}
        className={`px-4 py-3.5 flex items-center gap-3 transition-colors ${selected ? 'bg-[#130e00]' : 'bg-black'} ${outOfStock ? 'opacity-40' : ''}`}
      >
        {/* Gauche — tapper pour ouvrir la fiche */}
        <button
          className="flex-1 min-w-0 text-left"
          onClick={() => setSelectedProduct(item)}
        >
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className="font-mono text-[10px] text-[#444] bg-[#1a1a1a] px-1.5 py-0.5 rounded">{item.ref}</span>
            <StockBadge stock={item.stock}/>
            {item.pm && <span className="text-[9px] font-bold bg-[#0d2a0d] text-green-400 px-1 py-0.5 rounded border border-green-800/40">PM</span>}
            <button
              onClick={e => { e.stopPropagation(); toggleFav(key) }}
              className="ml-0.5"
              style={{ color: favorites.has(key) ? '#e03c3c' : '#333' }}
            >
              <svg width="12" height="12" fill={favorites.has(key) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <p className={`text-sm font-medium leading-snug ${selected ? 'text-white' : 'text-[#ccc]'}`}>{item.designation}</p>
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="#333" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
            </svg>
          </div>
          {selected && <p className="text-[#d4780f] text-xs mt-0.5 font-medium">{fmt(qty * item.prix)} € HT</p>}
        </button>

        {/* Droite — prix + quantité */}
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
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-black border-b border-[#1a1a1a]">
        <div className="max-w-2xl mx-auto px-4 py-2 relative flex items-center justify-center">
          {!homeView && (
            <button onClick={goHome} className="absolute left-4 flex items-center gap-1 text-[#555] hover:text-white text-xs transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}/>
              </svg>
            </button>
          )}
          <img src="/logo-banniere.png" alt="SPINCUT Outils CNC" style={{ height: '60px', objectFit: 'contain', mixBlendMode: 'screen', maskImage: 'radial-gradient(ellipse 95% 90% at 50% 50%, black 50%, transparent 100%)', WebkitMaskImage: 'radial-gradient(ellipse 95% 90% at 50% 50%, black 50%, transparent 100%)' }} />
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
        {!homeView && !favsView && (
          <div className="flex border-b border-[#1a1a1a] max-w-2xl mx-auto">
            {SHOP_TABS.map(t => (
              <button key={t.id}
                onClick={() => { setShopTab(t.id as typeof shopTab); setActiveCategory(null); resetFilters() }}
                className="flex-1 py-3 flex items-center justify-center transition-colors"
                style={{ borderBottom: shopTab === t.id ? '2px solid #d4780f' : '2px solid transparent' }}
              >
                <span className="text-[11px] font-bold leading-tight text-center"
                  style={{ color: shopTab === t.id ? '#d4780f' : '#888' }}>{t.label}</span>
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full pb-24">

        {/* ── HOME VIEW ── */}
        {homeView && (
          <>
            <div className="relative overflow-hidden" style={{ height: '210px' }}>
              {HERO_PHOTOS.map((src, i) => (
                <div key={i} className="absolute inset-0 transition-opacity duration-1000"
                  style={{ opacity: i === heroBg ? 1 : 0, backgroundImage: `url(${src})`, backgroundSize: 'cover', backgroundPosition: 'center' }}/>
              ))}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.7) 78%, #000 100%)' }}/>
              <div className="absolute bottom-3 right-4 flex gap-1">
                {HERO_PHOTOS.map((_, i) => (
                  <button key={i} onClick={() => setHeroBg(i)}
                    style={{ width: i === heroBg ? '14px' : '5px', height: '5px', borderRadius: '3px', background: i === heroBg ? '#d4780f' : 'rgba(255,255,255,0.3)', border: 'none', padding: 0, transition: 'all 0.2s', cursor: 'pointer' }}/>
                ))}
              </div>
            </div>

            <div className="px-4 space-y-3 pt-5 pb-6">
              <div className="flex gap-2 pt-1">
                {[{ icon: '⚡', label: 'Expédié sous 24h' }, { icon: '✓', label: 'Qualité garantie' }, { icon: '⏱', label: 'Réponse < 1h' }].map(b => (
                  <div key={b.label} className="flex-1 rounded-xl px-2 py-2.5 flex flex-col items-center gap-1 text-center" style={{ background: '#0d0d0d', border: '1px solid #1e1e1e' }}>
                    <span className="text-base leading-none">{b.icon}</span>
                    <span className="text-[9px] font-semibold leading-tight" style={{ color: '#555' }}>{b.label}</span>
                  </div>
                ))}
              </div>

              <p className="text-[10px] font-bold uppercase tracking-widest pt-1" style={{ color: '#444' }}>Boutique</p>

              <button onClick={() => enterTab('cnc')} className="w-full rounded-2xl relative overflow-hidden active:scale-[0.98] transition-all text-left" style={{ height: '130px', background: 'linear-gradient(135deg, #1a0800 0%, #030100 100%)', border: '1px solid #d4780f44' }}>
                <div className="absolute inset-0 flex items-center px-5">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-black text-xl leading-tight">Fraises CNC</p>
                  </div>
                  <div style={{ width: '4px', height: '60px', background: 'linear-gradient(to bottom, #d4780f, #3a1e0044)', borderRadius: '2px', flexShrink: 0 }}/>
                </div>
              </button>

              <button onClick={() => enterTab('cmt')} className="w-full rounded-2xl relative overflow-hidden active:scale-[0.98] transition-all text-left" style={{ height: '130px', background: 'linear-gradient(135deg, #1e1c14 0%, #0c0b08 100%)', border: '1px solid #f0dbb044' }}>
                <div className="absolute inset-0 flex items-center px-5">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-black text-xl leading-tight">Fraises Défonceuse</p>
                  </div>
                  <div style={{ width: '4px', height: '60px', background: 'linear-gradient(to bottom, #f0dbb0, #3a3420)', borderRadius: '2px', flexShrink: 0 }}/>
                </div>
              </button>

              <button onClick={() => enterTab('lames')} className="w-full rounded-2xl relative overflow-hidden active:scale-[0.98] transition-all text-left" style={{ height: '130px', background: 'linear-gradient(135deg, #1a1a1a 0%, #080808 100%)', border: '1px solid #3a3a3a' }}>
                <div className="absolute inset-0 flex items-center px-5">
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-xl leading-tight" style={{ color: '#d0d0d0' }}>Lames Circulaires Carbure</p>
                  </div>
                  <div style={{ width: '4px', height: '60px', background: 'linear-gradient(to bottom, #aaaaaa, #3a3a3a)', borderRadius: '2px', flexShrink: 0 }}/>
                </div>
              </button>

              <button
                onClick={favorites.size > 0 ? enterFavs : () => enterTab('cnc')}
                className="w-full rounded-2xl relative overflow-hidden active:scale-[0.98] transition-all text-left"
                style={{ height: '90px', background: 'linear-gradient(135deg, #1a0507 0%, #080002 100%)', border: `1px solid ${favorites.size > 0 ? '#5a1a20' : '#2a1015'}` }}
              >
                <div className="absolute inset-0 flex items-center px-5">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-black text-lg leading-tight">Mes outils favoris</p>
                    {favorites.size > 0
                      ? <p className="text-xs mt-1 font-semibold" style={{ color: '#e03c3c' }}>{favorites.size} outil{favorites.size > 1 ? 's' : ''} sauvegardé{favorites.size > 1 ? 's' : ''}</p>
                      : <p className="text-xs mt-1" style={{ color: '#5a2a2a' }}>Aucun favori — appuyez sur ♥ sur un produit</p>
                    }
                  </div>
                  <svg width="30" height="30" fill={favorites.size > 0 ? '#e03c3c' : '#3a1a1a'} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                  </svg>
                </div>
              </button>
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
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-4">
                <svg className="w-12 h-12 text-[#333]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                </svg>
                <p className="text-[#444] text-sm">Aucun outil en favori</p>
                <p className="text-[#333] text-xs">Appuyez sur ♥ sur un produit pour l'ajouter</p>
                <button
                  onClick={() => { setFavsView(false); setHomeView(false) }}
                  className="mt-2 py-2.5 px-6 rounded-xl text-sm font-bold text-white active:scale-95 transition-all"
                  style={{ background: '#d4780f' }}
                >
                  Voir la boutique
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#161616]">
                {favoriteItems.map(item => renderProductRow(item))}
              </div>
            )}
          </>
        )}

        {/* ── SHOP VIEW ── */}
        {!homeView && !favsView && (
          <>
            {/* Barre retour / filtres */}
            {!catalogLoading && !catalogError && (activeCategory || !usesCategories) && (
              <div className="px-4 pt-4 pb-1 flex items-center gap-2">
                {usesCategories ? (
                  <button onClick={() => { setActiveCategory(null); resetFilters(); setFiltersOpen(false) }}
                    className="flex items-center gap-1 text-xs text-[#555] hover:text-white transition-colors flex-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5M12 19l-7-7 7-7"/></svg>
                    {activeCategory ? CATEGORY_META[activeCategory]?.label : ''}
                  </button>
                ) : (
                  <span className="flex-1 text-xs text-[#555]">{filtered.length} produit{filtered.length !== 1 ? 's' : ''}</span>
                )}
                {activeFilterCount > 0 && <button onClick={resetFilters} className="text-xs text-[#555] hover:text-red-400 transition-colors">Effacer</button>}
                {usesCategories && <span className="text-xs text-[#444]">{filtered.length} produit{filtered.length !== 1 ? 's' : ''}</span>}
                <button onClick={() => setFiltersOpen(o => !o)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${activeFilterCount > 0 ? 'bg-[#d4780f] border-[#d4780f] text-white' : 'bg-[#1a1a1a] border-[#2a2a2a] text-[#888]'}`}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M7 12h10M11 20h2"/></svg>
                  Filtres{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                </button>
              </div>
            )}

            {/* Panneau filtres */}
            {(activeCategory || !usesCategories) && filtersOpen && (
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
                </div>
              </div>
            )}

            {catalogLoading && (
              <div className="flex items-center justify-center py-20 gap-3 text-[#444]">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Chargement…
              </div>
            )}

            {catalogError && (
              <div className="m-4 rounded-xl bg-[#2a0000] border border-red-800 px-4 py-3">
                <p className="text-red-400 text-sm">{catalogError}</p>
              </div>
            )}

            {/* ── Grille catégories avec photos ── */}
            {!catalogLoading && !catalogError && !activeCategory && usesCategories && (
              <div className="px-4 pt-5 pb-4">
                {activeTabCatalog.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                    <p className="text-white font-bold text-lg">Catalogue en cours de construction</p>
                    <p className="text-[#555] text-sm max-w-xs">Les produits seront disponibles très prochainement.</p>
                    <a href="https://wa.me/33767739561" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white mt-2"
                      style={{ background: '#1a5e1a' }}>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      Me prévenir à l'ouverture
                    </a>
                  </div>
                ) : (
                  <>
                    <p className="text-[#444] text-[10px] uppercase tracking-widest font-bold mb-3">Catégories</p>
                    <div className="grid grid-cols-2 gap-3">
                      {tabs.map(([id, meta]) => {
                        const count = activeTabCatalog.filter(p => p.category === id).length
                        return (
                          <button key={id} onClick={() => selectCategory(id)}
                            className="rounded-2xl overflow-hidden text-left active:scale-[0.97] transition-all"
                            style={{ background: '#111', border: '1px solid #1e1e1e' }}
                          >
                            {/* Zone photo */}
                            <CategoryImage category={id} shopTab={shopTab} className="rounded-t-2xl" style={{ height: '120px' }}/>
                            {/* Zone texte */}
                            <div className="px-3 py-2.5">
                              <div className="flex items-start justify-between gap-1">
                                <p className="text-white font-semibold text-sm leading-tight">{meta.label}</p>
                                <span className="text-[#d4780f] text-[10px] font-bold flex-shrink-0 mt-0.5">{count}</span>
                              </div>
                              {CATEGORY_DESC[id] && (
                                <p className="text-[#555] text-[11px] mt-0.5 leading-tight">{CATEGORY_DESC[id]}</p>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Grille photos CMT ── */}
            {!catalogLoading && !catalogError && shopTab === 'cmt' && (
              <div className="px-4 pt-4 pb-4">
                <p className="text-[#444] text-[10px] uppercase tracking-widest font-bold mb-3">
                  {activeTabCatalog.length} produits
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {activeTabCatalog.map(product => {
                    const key = uid(product)
                    const photoUrl = CMT_PHOTO_MAP[product.ref] ?? null
                    const qty = quantities[key] || 0
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedProduct(product)}
                        className="rounded-2xl overflow-hidden text-left active:scale-[0.97] transition-all"
                        style={{ background: '#111', border: `1px solid ${qty > 0 ? '#d4780f55' : '#1e1e1e'}` }}
                      >
                        {/* Photo */}
                        <div className="relative overflow-hidden" style={{ height: '140px', background: '#f5f5f5' }}>
                          {photoUrl
                            ? <img src={photoUrl} alt="" className="absolute inset-0 w-full h-full object-contain" style={{ padding: '8px' }} />
                            : <div className="absolute inset-0 flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg, #1a0800 0%, #0a0500 100%)' }}>
                                <span className="text-[#d4780f22] font-black text-4xl select-none">S</span>
                              </div>
                          }
                          <div className="absolute inset-x-0 bottom-0 h-8" style={{ background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.35))' }}/>
                          {qty > 0 && (
                            <span className="absolute top-2 right-2 bg-[#d4780f] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                              ×{qty}
                            </span>
                          )}
                          <span className="absolute bottom-2 left-2 text-[8px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={{ background: product.stock > 0 ? 'rgba(74,222,128,0.15)' : 'rgba(239,68,68,0.15)', color: product.stock > 0 ? '#4ade80' : '#ef4444' }}>
                            {product.stock > 0 ? '● Stock' : '● Rupture'}
                          </span>
                        </div>
                        {/* Infos */}
                        <div className="px-2.5 py-2.5">
                          <p className="text-[#d4780f] font-mono text-[9px] mb-0.5">{product.ref}</p>
                          <p className="text-white text-[11px] font-semibold leading-tight line-clamp-2">{product.designation}</p>
                          <div className="mt-1.5">
                            {product.prix > 0
                              ? <span className="text-[#d4780f] font-bold text-sm">{fmt(product.prix)} €</span>
                              : <span className="text-[#444] text-[10px]">Sur devis</span>
                            }
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Liste produits (CNC + Lames) ── */}
            {!catalogLoading && !catalogError && shopTab !== 'cmt' && (activeCategory || !usesCategories) && (
              <div className="divide-y divide-[#161616]">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-2">
                    <p className="text-[#444] text-sm">Aucun produit pour ces filtres</p>
                    {activeFilterCount > 0 && <button onClick={resetFilters} className="text-[#d4780f] text-xs underline">Effacer les filtres</button>}
                  </div>
                ) : filtered.map(item => renderProductRow(item))}
              </div>
            )}
          </>
        )}
      </main>

      <BottomNav cartCount={cartCount} cartTotal={cartTotal}/>

      {/* ── Fiche produit — bottom sheet ── */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ background: 'rgba(0,0,0,0.75)' }}
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="w-full max-w-2xl mx-auto rounded-t-2xl overflow-y-auto"
            style={{ background: '#111', maxHeight: '88vh', border: '1px solid #2a2a2a', borderBottom: 'none' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-[#333]"/>
            </div>

            {/* Photo produit */}
            <div className="mx-4 mt-2 rounded-xl overflow-hidden relative" style={{ height: '200px', background: '#f5f5f5' }}>
              {shopTab === 'cmt' && CMT_PHOTO_MAP[selectedProduct.ref] ? (
                <>
                  <img src={CMT_PHOTO_MAP[selectedProduct.ref]} alt="" className="w-full h-full object-contain rounded-xl" style={{ padding: '12px' }} />
                  <div className="absolute inset-x-0 bottom-0 h-10 rounded-b-xl" style={{ background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.3))' }}/>
                </>
              ) : (
                <CategoryImage category={selectedProduct.category} shopTab={shopTab} className="w-full h-full rounded-xl"/>
              )}
              {selectedProduct.pm && (
                <span className="absolute top-2.5 right-2.5 bg-[#0d2a0d]/90 text-green-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-700/50">Polimiroir</span>
              )}
              <div className="absolute bottom-2.5 left-3">
                <span className="bg-black/60 text-[#d4780f] text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {CATEGORY_META[selectedProduct.category]?.label ?? selectedProduct.category}
                </span>
              </div>
            </div>

            <div className="px-4 pt-4 pb-6 space-y-4">

              {/* Référence + désignation */}
              <div>
                <span className="font-mono text-[10px] text-[#555] bg-[#1a1a1a] px-1.5 py-0.5 rounded">{selectedProduct.ref}</span>
                <p className="text-white font-semibold text-base mt-1.5 leading-snug">{selectedProduct.designation}</p>
              </div>

              {/* Specs (Ø · I · L · S) */}
              <div className="flex gap-2 flex-wrap">
                {[
                  { l: 'Ø', v: selectedProduct.diametre, u: 'mm' },
                  { l: 'I', v: selectedProduct.lc,       u: 'mm' },
                  { l: 'L', v: selectedProduct.lt,       u: 'mm' },
                  { l: 'S', v: selectedProduct.queue,    u: 'mm' },
                ].filter(s => s.v && s.v !== '/').map(s => (
                  <div key={s.l} className="flex-1 min-w-[48px] bg-[#1a1a1a] rounded-xl p-2.5 text-center border border-[#252525]">
                    <p className="text-[#d4780f] text-[10px] font-bold">{s.l}</p>
                    <p className="text-white font-mono font-bold text-sm mt-0.5">{s.v}</p>
                    <p className="text-[#444] text-[9px]">{s.u}</p>
                  </div>
                ))}
              </div>

              {/* Stock + prix + panier */}
              <div className="flex items-center justify-between pt-2 border-t border-[#1e1e1e]">
                <div>
                  <StockBadge stock={selectedProduct.stock}/>
                  {selectedProduct.prix > 0 && (
                    <p className="text-[#d4780f] font-black text-2xl mt-1.5">
                      {fmt(selectedProduct.prix)} €
                      <span className="text-[#555] text-xs font-normal ml-1">HT</span>
                    </p>
                  )}
                </div>
                {selectedProduct.stock > 0 && selectedProduct.prix > 0 && (() => {
                  const key = uid(selectedProduct)
                  const qty = quantities[key] || 0
                  return qty === 0 ? (
                    <button
                      onClick={() => setQty(key, 1, selectedProduct.stock)}
                      className="px-6 py-3 rounded-xl text-sm font-bold text-white active:scale-95 transition-all"
                      style={{ background: '#d4780f' }}
                    >
                      + Ajouter
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button onClick={() => setQty(key, -1, selectedProduct.stock)}
                        className="w-10 h-10 rounded-xl bg-[#d4780f] flex items-center justify-center font-bold text-xl text-white">−</button>
                      <span className="w-8 text-center text-[#d4780f] font-bold text-lg">{qty}</span>
                      <button onClick={() => setQty(key, +1, selectedProduct.stock)}
                        className="w-10 h-10 rounded-xl bg-[#d4780f] flex items-center justify-center font-bold text-xl text-white">+</button>
                    </div>
                  )
                })()}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  )
}
