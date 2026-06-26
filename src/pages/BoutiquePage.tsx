import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClientAuth, getClientCode, getAccessCodes } from '../hooks/useAuth'
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
  diamant:     { label: 'Fraise Diamant (PCD)',       order: 4 },
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

function AutoPhoto({ urls, externalIdx }: { urls: string[]; externalIdx?: number }) {
  const [localIdx, setLocalIdx] = useState(0)
  useEffect(() => {
    if (externalIdx !== undefined) return
    if (urls.length <= 1) return
    const t = setInterval(() => setLocalIdx(i => (i + 1) % urls.length), 1500)
    return () => clearInterval(t)
  }, [urls.length, externalIdx])
  const idx = externalIdx !== undefined ? externalIdx % Math.max(urls.length, 1) : localIdx
  return (
    <>
      {urls.map((src, i) => (
        <img key={src} src={src} alt=""
          className="absolute inset-0 w-full h-full object-contain transition-opacity duration-700"
          style={{ opacity: i === idx ? 1 : 0, padding: '8px' }} />
      ))}
    </>
  )
}
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
  '91106011':   '/images/cmt/cmt-06.png',
  '91107011':   '/images/cmt/cmt-06.png',
  '91108011':   '/images/cmt/cmt-06.png',
  '91110011':   '/images/cmt/cmt-06.png',
  '91119011':   '/images/cmt/cmt-06.png',
  '91120011':   '/images/cmt/cmt-06.png',
  '91206011':   '/images/cmt/cmt-03.png',
  '91210011':   '/images/cmt/cmt-03.png',
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
  '92408110':   '/images/cmt/cmt-34.png',  // CMT 924.081.10
}

const LAMES_PHOTO_MAP: Record<string, string> = {
  'FL08.01020':      '/images/cmt/cmt-16.png',
  '938.7.100.22.12': '/images/cmt/cmt-17.png',
  'DC300.02830':     '/images/cmt/cmt-18.png',
  '122.255.2532':    '/images/cmt/cmt-19.png',
  'LC2102403M':      '/images/cmt/cmt-20.png',  // Forézienne ATB bois
  'LC2104804M':      '/images/cmt/cmt-20.png',  // Forézienne ATB bois (shared)
  'LC2166004M':      '/images/cmt/cmt-21.png',  // Forézienne TF NEG alu
  'LC3006007M':      '/images/cmt/cmt-22.png',  // Forézienne HFP mélamine
  'F03FS09678':      '/images/cmt/cmt-24.png',
  'F03FS09748':      '/images/cmt/cmt-24.png',
  // Freud — scies portatives / plongeantes (app card en premier)
  'F03FS09798':      '/images/cmt/cmt-26.png',  // FR06L001H Mélaminé/Agglomérés/MDF
  'F03FS09865':      '/images/cmt/cmt-28.png',  // FR06L001H HPL/Surfaces dures
  // Freud — scie à onglets (app card en premier)
  'F03FS05346':      '/images/cmt/cmt-30.png',  // LU6A 1900 Acier/Métaux ferreux
  // Freud — scies à format / verticales (app card en premier)
  'F03FS09038':      '/images/cmt/cmt-32.png',  // LU3C 0300 Panneaux revêtus 2 faces
  'F03FS07295':      '/images/cmt/cmt-33.png',  // LU4D 0200 Coupe fine panneaux (lame seule)
  // Léman — scie à format
  '964.260.3024':    '/images/cmt/cmt-36.png',  // Ø260 Z24 ALT débit bois
  '122.255.2532':    '/images/cmt/cmt-37.png',  // Ø250 Z160 Fraise scie métal Léman
}

// Second photo keyed by primary photo URL (shared by the whole group)
const LAMES_PHOTO2_MAP: Record<string, string> = {
  '/images/cmt/cmt-24.png': '/images/cmt/cmt-23.png',
  '/images/cmt/cmt-26.png': '/images/cmt/cmt-25.png',  // F03FS09798 → blade
  '/images/cmt/cmt-28.png': '/images/cmt/cmt-27.png',  // F03FS09865 → blade
  '/images/cmt/cmt-30.png': '/images/cmt/cmt-29.png',  // F03FS05346 → blade
  '/images/cmt/cmt-32.png': '/images/cmt/cmt-31.png',  // F03FS09038 → blade
  '/images/cmt/cmt-34.png': '/images/cmt/cmt-35.png',  // CMT 92408110 → assembly
}

export default function BoutiquePage() {
  const navigate = useNavigate()
  const { isAuthenticated, logout } = useClientAuth()

  const clientCode = getClientCode()
  const cartKey = `spincut_cart_${clientCode ?? 'guest'}`
  const clientName = clientCode ? (getAccessCodes().find(c => c.code === clientCode)?.clientName ?? null) : null

  const [homeView, setHomeView] = useState(true)
  const [favsView, setFavsView] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [heroBg, setHeroBg] = useState(0)
  const [shopTab, setShopTab] = useState<'cnc' | 'cmt' | 'lames'>('cnc')
  const [catalog, setCatalog] = useState<CatalogProduct[]>(() => {
    try { return JSON.parse(localStorage.getItem('spincut_catalog_v3') ?? '[]') } catch { return [] }
  })
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filterDiam, setFilterDiam] = useState<string | null>(null)
  const [filterLC, setFilterLC] = useState<string | null>(null)
  const [filterDents, setFilterDents] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null)
  const [photoIndex, setPhotoIndex] = useState(0)
  const galleryRef = useRef<HTMLDivElement>(null)
  const [bsFilterØ, setBsFilterØ] = useState<string | null>(null)
  const [bsFilterI, setBsFilterI] = useState<string | null>(null)
  const [bsFilterS, setBsFilterS] = useState<string | null>(null)

  type DashOrder = { id: string; number: string; state: string; label: string; total: number; date: number; items: { ref: string; designation: string; qty: number }[] }
  type DashInvoice = { id: string; number: string; state: string; label: string; amount: number; dueAt?: number }
  const [dashOrders, setDashOrders] = useState<DashOrder[]>([])
  const [dashInvoices, setDashInvoices] = useState<DashInvoice[]>([])
  const [_dashLoading, setDashLoading] = useState(false)

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
  const toggleGroupFav = (products: CatalogProduct[]) => setFavorites(prev => {
    const next = new Set(prev)
    const anyFaved = products.some(p => prev.has(uid(p)))
    products.forEach(p => anyFaved ? next.delete(uid(p)) : next.add(uid(p)))
    try { localStorage.setItem(favKey, JSON.stringify([...next])) } catch {}
    return next
  })

  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem(cartKey) ?? '{}') } catch { return {} }
  })
  const [cartToast, setCartToast] = useState<{ label: string; visible: boolean }>({ label: '', visible: false })
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const showToast = useCallback((label: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setCartToast({ label, visible: true })
    toastTimer.current = setTimeout(() => setCartToast(t => ({ ...t, visible: false })), 2000)
  }, [])

  const cartCount = useMemo(() => Object.values(quantities).reduce((s, v) => s + v, 0), [quantities])
  const cartTotal = useMemo(() => catalog.reduce((s, p) => s + (quantities[uid(p)] || 0) * p.prix, 0), [catalog, quantities])

  const [syncPhotoIdx, setSyncPhotoIdx] = useState(0)
  useEffect(() => {
    if (shopTab !== 'lames' && shopTab !== 'cmt') return
    const t = setInterval(() => setSyncPhotoIdx(i => i + 1), 2000)
    return () => clearInterval(t)
  }, [shopTab])

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
          try { localStorage.setItem('spincut_catalog_v3', JSON.stringify(data)) } catch {}
        } else setCatalogError(data?.error ?? 'Erreur catalogue')
        setCatalogLoading(false)
      })
      .catch(() => { setCatalogError('Impossible de charger le catalogue'); setCatalogLoading(false) })
  }, [])

  useEffect(() => {
    if (!clientName) return
    const histKey = `spincut_orders_${clientCode ?? 'guest'}`
    let orderIds: string[] = []
    try {
      const hist = JSON.parse(localStorage.getItem(histKey) ?? '[]') as { orderId: string }[]
      orderIds = [...new Set(hist.map(h => h.orderId).filter(Boolean))]
    } catch {}
    setDashLoading(true)
    fetch('/api/client-dashboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientName, orderIds }),
    })
      .then(r => r.json())
      .then(data => {
        if (!data.error) {
          setDashOrders(data.orders ?? [])
          setDashInvoices(data.invoices ?? [])
        }
      })
      .catch(() => {})
      .finally(() => setDashLoading(false))
  }, [clientName])

  const activeTabCatalog = useMemo(() => {
    const isStock = (s: string) => typeof s === 'string' && s.toUpperCase().startsWith('STOCK')
    if (shopTab === 'cnc') {
      const exact = catalog.filter(p => ['STOCK A0','STOCK A2'].includes(p.sheet))
      // Fallback : si pas de match exact, tous les onglets STOCK (sauf A1 et A3 explicites)
      if (exact.length > 0) return exact
      return catalog.filter(p => isStock(p.sheet) && p.sheet !== 'STOCK A1' && p.sheet !== 'STOCK A3')
    }
    if (shopTab === 'cmt') {
      const exact = catalog.filter(p => p.sheet === 'STOCK A1')
      if (exact.length > 0) return exact
      return []
    }
    const exact = catalog.filter(p => p.sheet === 'STOCK A3')
    if (exact.length > 0) return exact
    return []
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

  // CMT groups — one entry per shared photo
  const cmtGroups = useMemo(() => {
    if (shopTab !== 'cmt') return []
    const map = new Map<string, CatalogProduct[]>()
    for (const p of activeTabCatalog) {
      const key = CMT_PHOTO_MAP[p.ref] ?? `_solo_${p.ref}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(p)
    }
    return [...map.entries()].map(([key, products]) => ({
      key, photoUrl: CMT_PHOTO_MAP[products[0].ref] ?? null, products,
    }))
  }, [activeTabCatalog, shopTab])

  const currentCMTGroup = useMemo(() => {
    if (!selectedProduct || shopTab !== 'cmt') return null
    const key = CMT_PHOTO_MAP[selectedProduct.ref] ?? `_solo_${selectedProduct.ref}`
    return cmtGroups.find(g => g.key === key) ?? null
  }, [selectedProduct, shopTab, cmtGroups])

  const lamesGroups = useMemo(() => {
    if (shopTab !== 'lames') return []
    const map = new Map<string, CatalogProduct[]>()
    for (const p of activeTabCatalog) {
      const key = LAMES_PHOTO_MAP[p.ref] ?? `_solo_${p.ref}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(p)
    }
    return [...map.entries()].map(([key, products]) => ({
      key, photoUrl: LAMES_PHOTO_MAP[products[0].ref] ?? null, products,
    }))
  }, [activeTabCatalog, shopTab])

  const currentLamesGroup = useMemo(() => {
    if (!selectedProduct || shopTab !== 'lames') return null
    const key = LAMES_PHOTO_MAP[selectedProduct.ref] ?? `_solo_${selectedProduct.ref}`
    return lamesGroups.find(g => g.key === key) ?? null
  }, [selectedProduct, shopTab, lamesGroups])

  const currentPhotoGroup = currentCMTGroup ?? currentLamesGroup
  const currentPhoto2 = currentPhotoGroup?.photoUrl ? (LAMES_PHOTO2_MAP[currentPhotoGroup.photoUrl] ?? null) : null

  // Cascading filters inside the modal
  const bsProds = currentPhotoGroup?.products ?? []
  // For lames: I=dents(Z), S=angle(alésage) — for CMT: I=lc, S=queue
  const bsFieldI = (p: CatalogProduct) => currentLamesGroup ? p.dents : p.lc
  const bsFieldS = (p: CatalogProduct) => currentLamesGroup ? p.angle : p.queue
  // All values (for display — never hidden)
  const bsAllØ = useMemo(() => [...new Set(bsProds.map(p => p.diametre).filter(v => v && v !== '/'))].sort((a, b) => parseFloat(a) - parseFloat(b)), [bsProds])
  const bsAllI = useMemo(() => [...new Set(bsProds.map(bsFieldI).filter(v => v && v !== '/'))].sort((a, b) => parseFloat(a) - parseFloat(b)), [bsProds, currentLamesGroup])
  const bsAllS = useMemo(() => [...new Set(bsProds.map(bsFieldS).filter(v => v && v !== '/'))].sort((a, b) => parseFloat(a) - parseFloat(b)), [bsProds, currentLamesGroup])
  // Compatible values — bidirectional: each dimension grays based on the other two
  const bsAvailØ = useMemo(() => new Set(
    bsProds.filter(p => (!bsFilterI || bsFieldI(p) === bsFilterI) && (!bsFilterS || bsFieldS(p) === bsFilterS))
      .map(p => p.diametre).filter(v => v && v !== '/')
  ), [bsProds, bsFilterI, bsFilterS, currentLamesGroup])
  const bsAvailI = useMemo(() => new Set(
    bsProds.filter(p => (!bsFilterØ || p.diametre === bsFilterØ) && (!bsFilterS || bsFieldS(p) === bsFilterS))
      .map(bsFieldI).filter(v => v && v !== '/')
  ), [bsProds, bsFilterØ, bsFilterS, currentLamesGroup])
  const bsAvailS = useMemo(() => new Set(
    bsProds.filter(p => (!bsFilterØ || p.diametre === bsFilterØ) && (!bsFilterI || bsFieldI(p) === bsFilterI))
      .map(bsFieldS).filter(v => v && v !== '/')
  ), [bsProds, bsFilterØ, bsFilterI, currentLamesGroup])

  const cmtMatchingVariants = useMemo(() => {
    if (!currentPhotoGroup) return selectedProduct ? [selectedProduct] : []
    const prods = currentPhotoGroup.products.filter(p =>
      (!bsFilterØ || p.diametre === bsFilterØ) &&
      (!bsFilterI || bsFieldI(p) === bsFilterI) &&
      (!bsFilterS || bsFieldS(p) === bsFilterS)
    )
    return prods.length > 0 ? prods : currentPhotoGroup.products
  }, [currentPhotoGroup, bsProds, bsFilterØ, bsFilterI, bsFilterS, selectedProduct])


  const setQty = (key: string, delta: number, max: number, label?: string) => {
    setQuantities(prev => {
      const prev_ = prev[key] || 0
      const next = Math.min(max, Math.max(0, prev_ + delta))
      if (delta > 0 && prev_ === 0 && next > 0 && label) {
        setTimeout(() => showToast(label), 0)
      }
      return { ...prev, [key]: next }
    })
  }
  const setQtyDirect = (key: string, val: string, max: number) =>
    setQuantities(prev => ({ ...prev, [key]: Math.min(max, Math.max(0, parseInt(val) || 0)) }))

  const favoriteItems = useMemo(() => catalog.filter(p => favorites.has(uid(p))), [catalog, favorites])

  // ── Search (scoped to active tab) ────────────────────────────────────────
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return null
    const match = (p: CatalogProduct) =>
      p.ref.toLowerCase().includes(q) ||
      (p.designation ?? '').toLowerCase().includes(q) ||
      (p.diametre ?? '').toLowerCase().includes(q) ||
      (p.famille ?? '').toLowerCase().includes(q) ||
      (CATEGORY_META[p.category]?.label ?? '').toLowerCase().includes(q)

    if (shopTab === 'cnc') {
      const matched = catalog.filter(p => ['STOCK A0', 'STOCK A2'].includes(p.sheet) && match(p))
      const cncGroups: { catId: string; label: string; products: CatalogProduct[] }[] = []
      for (const [catId, meta] of Object.entries(CATEGORY_META).sort((a, b) => a[1].order - b[1].order)) {
        const ps = matched.filter(p => p.category === catId)
        if (ps.length > 0) cncGroups.push({ catId, label: meta.label, products: ps })
      }
      return { cncGroups, cmtRes: [], lamesRes: [], total: matched.length }
    }

    if (shopTab === 'cmt') {
      const matchedRefs = new Set(catalog.filter(p => p.sheet === 'STOCK A1' && match(p)).map(p => p.ref))
      const map = new Map<string, CatalogProduct[]>()
      for (const p of catalog.filter(p => p.sheet === 'STOCK A1')) {
        const key = CMT_PHOTO_MAP[p.ref] ?? `_solo_${p.ref}`
        if (!map.has(key)) map.set(key, [])
        map.get(key)!.push(p)
      }
      const cmtRes = [...map.entries()]
        .filter(([, prods]) => prods.some(p => matchedRefs.has(p.ref)))
        .map(([key, products]) => ({ key, photoUrl: CMT_PHOTO_MAP[products[0].ref] ?? null, products }))
      return { cncGroups: [], cmtRes, lamesRes: [], total: cmtRes.reduce((s, g) => s + g.products.length, 0) }
    }

    // lames
    const matchedRefs = new Set(catalog.filter(p => p.sheet === 'STOCK A3' && match(p)).map(p => p.ref))
    const map = new Map<string, CatalogProduct[]>()
    for (const p of catalog.filter(p => p.sheet === 'STOCK A3')) {
      const key = LAMES_PHOTO_MAP[p.ref] ?? `_solo_${p.ref}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(p)
    }
    const lamesRes = [...map.entries()]
      .filter(([, prods]) => prods.some(p => matchedRefs.has(p.ref)))
      .map(([key, products]) => ({ key, photoUrl: LAMES_PHOTO_MAP[products[0].ref] ?? null, products }))
    return { cncGroups: [], cmtRes: [], lamesRes, total: lamesRes.reduce((s, g) => s + g.products.length, 0) }
  }, [searchQuery, shopTab, catalog])

  const clearSearch = () => setSearchQuery('')

  const selectCategory = (id: string) => { setActiveCategory(id); setFiltersOpen(false); resetFilters() }
  const goHome  = () => { setHomeView(true); setFavsView(false); setActiveCategory(null); resetFilters(); setFiltersOpen(false); clearSearch() }
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
            <p className={`text-sm font-medium leading-snug ${selected ? 'text-white' : 'text-[#ccc]'}`}>
              {CATEGORY_META[item.category]?.label && <span className="text-[#d4780f]">{CATEGORY_META[item.category].label} </span>}
              {item.designation}
            </p>
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
              <button onClick={() => setQty(key, +1, item.stock, item.ref)}
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
          <>
            <div className="flex border-b border-[#1a1a1a] max-w-2xl mx-auto">
              {SHOP_TABS.map(t => (
                <button key={t.id}
                  onClick={() => { setShopTab(t.id as typeof shopTab); setActiveCategory(null); resetFilters(); clearSearch() }}
                  className="flex-1 py-3 flex items-center justify-center transition-colors"
                  style={{ borderBottom: shopTab === t.id && !searchQuery ? '2px solid #d4780f' : '2px solid transparent' }}
                >
                  <span className="text-[11px] font-bold leading-tight text-center"
                    style={{ color: shopTab === t.id && !searchQuery ? '#d4780f' : '#888' }}>{t.label}</span>
                </button>
              ))}
            </div>
            <div className="px-4 py-2 max-w-2xl mx-auto">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  style={{ color: searchFocused || searchQuery ? '#d4780f' : '#444' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
                </svg>
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="Rechercher — réf, diamètre, type…"
                  className="w-full pl-9 pr-9 py-2 rounded-xl text-sm text-white outline-none placeholder-[#444] transition-colors"
                  style={{
                    background: '#0d0d0d',
                    border: `1px solid ${searchFocused || searchQuery ? '#d4780f55' : '#1e1e1e'}`,
                  }}
                />
                {searchQuery && (
                  <button onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </>
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

              {/* ── Commandes en cours ── */}
              {dashOrders.length > 0 && (
                <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #2a1a00', background: '#0a0600' }}>
                  <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #1a1000' }}>
                    <div className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="#d4780f" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                      </svg>
                      <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#d4780f' }}>Commandes en cours</p>
                    </div>
                    <button onClick={() => navigate('/commande')} className="text-[10px] text-[#555] hover:text-white transition-colors">Voir →</button>
                  </div>
                  {dashOrders.map((order, i) => (
                    <div key={order.id} className="px-4 py-3" style={{ borderBottom: i < dashOrders.length - 1 ? '1px solid #111' : 'none' }}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono" style={{ color: '#555' }}>{order.number || `#${order.id.slice(-6)}`}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{
                            background: order.state === 'signed' ? '#0d1a0d' : '#1a1000',
                            color: order.state === 'signed' ? '#4ade80' : '#d4780f',
                          }}>{order.label}</span>
                        </div>
                        <span className="text-sm font-bold text-white">{fmt(order.total)} <span className="text-[10px] font-normal text-[#555]">€ HT</span></span>
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

              {/* ── Factures à régler ── */}
              {dashInvoices.length > 0 && (
                <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #3a1010', background: '#080303' }}>
                  <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #1a0808' }}>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" style={{ animation: 'pulse 1.5s infinite' }} />
                      <p className="text-[11px] font-bold uppercase tracking-wider text-red-400">Factures à régler</p>
                    </div>
                    <span className="text-[10px] font-bold text-red-400">{dashInvoices.length} facture{dashInvoices.length > 1 ? 's' : ''}</span>
                  </div>
                  {dashInvoices.map((inv, i) => (
                    <div key={inv.id} className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: i < dashInvoices.length - 1 ? '1px solid #110505' : 'none' }}>
                      <div>
                        <span className="text-[11px] font-mono" style={{ color: '#888' }}>{inv.number || `#${inv.id.slice(-6)}`}</span>
                        {inv.dueAt && inv.dueAt > 0 && (
                          <p className="text-[10px] text-red-400 mt-0.5">Échéance : {new Date(inv.dueAt).toLocaleDateString('fr-FR')}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-white">{fmt(inv.amount)}</span>
                        <span className="text-[10px] font-normal text-[#555]"> € TTC</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

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
                  </div>
                  <div className="relative flex-shrink-0">
                    <svg width="30" height="30" fill={favorites.size > 0 ? '#e03c3c' : '#3a1a1a'} viewBox="0 0 24 24">
                      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                    </svg>
                    {favorites.size > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-white font-bold text-[10px] px-1" style={{ background: '#e03c3c', lineHeight: 1 }}>
                        {favorites.size}
                      </span>
                    )}
                  </div>
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

        {/* ── SEARCH RESULTS ── */}
        {!homeView && !favsView && searchResults && (
          <div className="pb-8">
            <div className="px-4 pt-4 pb-3 flex items-center gap-2">
              <p className="text-[#555] text-xs flex-1">
                <span className="text-white font-semibold">{searchResults.total}</span> résultat{searchResults.total !== 1 ? 's' : ''} pour «&nbsp;<span style={{ color: '#d4780f' }}>{searchQuery}</span>&nbsp;»
              </p>
              <button onClick={clearSearch} className="text-xs text-[#555] hover:text-white transition-colors">Effacer</button>
            </div>

            {searchResults.total === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-4">
                <svg className="w-10 h-10 text-[#2a2a2a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
                </svg>
                <p className="text-[#444] text-sm">Aucun résultat pour «&nbsp;{searchQuery}&nbsp;»</p>
                <p className="text-[#333] text-xs">Essayez une référence, un diamètre ou un type</p>
              </div>
            )}

            {/* CNC — groupé par catégorie */}
            {searchResults.cncGroups.length > 0 && (
              <div className="mb-2">
                <div className="px-4 py-2 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#444' }}>Fraises CNC</span>
                  <div className="flex-1 h-px" style={{ background: '#1e1e1e' }}/>
                </div>
                {searchResults.cncGroups.map(group => (
                  <div key={group.catId}>
                    <div className="px-4 py-1.5 flex items-center gap-2">
                      <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                        style={{ background: '#1a0a00', color: '#d4780f' }}>{group.label}</span>
                      <span className="text-[10px]" style={{ color: '#333' }}>{group.products.length}</span>
                    </div>
                    <div className="divide-y divide-[#161616]">
                      {group.products.map(p => renderProductRow(p))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CMT — cartes photo */}
            {searchResults.cmtRes.length > 0 && (
              <div className="mb-2">
                <div className="px-4 py-2 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#444' }}>Fraises Défonceuse CMT</span>
                  <div className="flex-1 h-px" style={{ background: '#1e1e1e' }}/>
                </div>
                <div className="px-4 grid grid-cols-2 gap-3">
                  {searchResults.cmtRes.map(group => {
                    const anyFaved = group.products.some(p => favorites.has(uid(p)))
                    const anyInStock = group.products.some(p => p.stock > 0)
                    const minPrix = Math.min(...group.products.map(p => p.prix).filter(v => v > 0))
                    const photo2 = group.photoUrl ? (LAMES_PHOTO2_MAP[group.photoUrl] ?? null) : null
                    const photoSrc = photo2
                      ? (Math.floor(syncPhotoIdx / 2) % 2 === 0 ? group.photoUrl : photo2)
                      : group.photoUrl
                    return (
                      <div key={group.key} className="rounded-2xl overflow-hidden flex flex-col"
                        style={{ background: '#111', border: '1px solid #1e1e1e' }}>
                        <div className="relative aspect-square bg-[#0a0a0a]" onClick={() => { setSelectedProduct(group.products[0]); setBsFilterØ(null); setBsFilterI(null); setBsFilterS(null) }}>
                          {photoSrc
                            ? <img src={photoSrc} alt="" className="w-full h-full object-contain p-3"/>
                            : <div className="w-full h-full flex items-center justify-center text-[#2a2a2a] text-3xl font-black">CMT</div>}
                          {!anyInStock && (
                            <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
                              <span className="text-[10px] font-bold text-red-400 bg-black/80 px-2 py-1 rounded-lg">Rupture</span>
                            </div>
                          )}
                          <button onClick={e => { e.stopPropagation(); toggleGroupFav(group.products) }}
                            className="absolute bottom-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90"
                            style={{ background: anyFaved ? '#d4780f' : 'rgba(0,0,0,0.7)', border: `1px solid ${anyFaved ? '#d4780f' : '#2a2a2a'}` }}>
                            <svg className="w-3.5 h-3.5" fill={anyFaved ? 'white' : 'none'} stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                            </svg>
                          </button>
                        </div>
                        <div className="p-3" onClick={() => { setSelectedProduct(group.products[0]); setBsFilterØ(null); setBsFilterI(null); setBsFilterS(null) }}>
                          <p className="text-white text-xs font-bold truncate">{group.products[0].designation || group.products[0].famille || group.products[0].ref}</p>
                          <p className="text-[10px] mt-0.5" style={{ color: '#555' }}>{group.products.length} variante{group.products.length > 1 ? 's' : ''}</p>
                          {minPrix > 0 && <p className="text-[11px] font-bold mt-1" style={{ color: '#d4780f' }}>dès {minPrix.toFixed(2).replace('.', ',')} €</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Lames — cartes photo */}
            {searchResults.lamesRes.length > 0 && (
              <div className="mb-2">
                <div className="px-4 py-2 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#444' }}>Lames Carbure</span>
                  <div className="flex-1 h-px" style={{ background: '#1e1e1e' }}/>
                </div>
                <div className="px-4 grid grid-cols-2 gap-3">
                  {searchResults.lamesRes.map(group => {
                    const anyFaved = group.products.some(p => favorites.has(uid(p)))
                    const anyInStock = group.products.some(p => p.stock > 0)
                    const minPrix = Math.min(...group.products.map(p => p.prix).filter(v => v > 0))
                    const photo2 = group.photoUrl ? (LAMES_PHOTO2_MAP[group.photoUrl] ?? null) : null
                    const photoSrc = photo2
                      ? (Math.floor(syncPhotoIdx / 2) % 2 === 0 ? group.photoUrl : photo2)
                      : group.photoUrl
                    return (
                      <div key={group.key} className="rounded-2xl overflow-hidden flex flex-col"
                        style={{ background: '#111', border: '1px solid #1e1e1e' }}>
                        <div className="relative aspect-square bg-[#0a0a0a]" onClick={() => { setSelectedProduct(group.products[0]); setBsFilterØ(null); setBsFilterI(null); setBsFilterS(null) }}>
                          {photoSrc
                            ? <img src={photoSrc} alt="" className="w-full h-full object-contain p-3"/>
                            : <div className="w-full h-full flex items-center justify-center text-[#2a2a2a] text-3xl font-black">LAME</div>}
                          {!anyInStock && (
                            <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
                              <span className="text-[10px] font-bold text-red-400 bg-black/80 px-2 py-1 rounded-lg">Rupture</span>
                            </div>
                          )}
                          <button onClick={e => { e.stopPropagation(); toggleGroupFav(group.products) }}
                            className="absolute bottom-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90"
                            style={{ background: anyFaved ? '#d4780f' : 'rgba(0,0,0,0.7)', border: `1px solid ${anyFaved ? '#d4780f' : '#2a2a2a'}` }}>
                            <svg className="w-3.5 h-3.5" fill={anyFaved ? 'white' : 'none'} stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                            </svg>
                          </button>
                        </div>
                        <div className="p-3" onClick={() => { setSelectedProduct(group.products[0]); setBsFilterØ(null); setBsFilterI(null); setBsFilterS(null) }}>
                          <p className="text-white text-xs font-bold truncate">{group.products[0].designation || group.products[0].famille || group.products[0].ref}</p>
                          <p className="text-[10px] mt-0.5" style={{ color: '#555' }}>{group.products.length} variante{group.products.length > 1 ? 's' : ''}</p>
                          {minPrix > 0 && <p className="text-[11px] font-bold mt-1" style={{ color: '#d4780f' }}>dès {minPrix.toFixed(2).replace('.', ',')} €</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── SHOP VIEW ── */}
        {!homeView && !favsView && !searchResults && (
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
                    <button
                      onClick={() => {
                        try { localStorage.removeItem('spincut_catalog_v3') } catch {}
                        window.location.reload()
                      }}
                      className="mt-1 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                      style={{ background: '#d4780f' }}
                    >
                      Recharger le catalogue
                    </button>
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
                  {cmtGroups.length} produit{cmtGroups.length > 1 ? 's' : ''}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {cmtGroups.map(group => {
                    const anyInStock = group.products.some(p => p.stock > 0)
                    const anyFaved   = group.products.some(p => favorites.has(uid(p)))
                    const totalQty   = group.products.reduce((s, p) => s + (quantities[uid(p)] || 0), 0)
                    const prices     = group.products.map(p => p.prix).filter(x => x > 0)
                    const minPrice   = prices.length ? Math.min(...prices) : 0
                    const groupName  = group.products.length === 1
                      ? group.products[0].designation
                      : group.products[0].designation.replace(/\s+[DSRZLI]=.*/i, '').replace(/\s+\d.*/,'').trim().replace(/[-–.,\s]+$/, '').trim()
                    return (
                      <div
                        key={group.key}
                        className="rounded-2xl overflow-hidden text-left active:scale-[0.97] transition-all"
                        style={{ background: '#111', border: `1px solid ${totalQty > 0 ? '#d4780f55' : '#1e1e1e'}` }}
                      >
                        {/* Photo */}
                        <div className="relative overflow-hidden" style={{ height: '140px', background: '#f5f5f5' }}
                          onClick={() => { setSelectedProduct(group.products[0]); setBsFilterØ(null); setBsFilterI(null); setBsFilterS(null); setPhotoIndex(0) }}>
                          {group.photoUrl
                            ? (() => {
                                const urls = [group.photoUrl, LAMES_PHOTO2_MAP[group.photoUrl]].filter(Boolean) as string[]
                                return urls.length > 1
                                  ? <AutoPhoto urls={urls} externalIdx={syncPhotoIdx} />
                                  : <img src={group.photoUrl} alt="" className="absolute inset-0 w-full h-full object-contain" style={{ padding: '8px' }} />
                              })()
                            : <div className="absolute inset-0 flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg, #1a0800 0%, #0a0500 100%)' }}>
                                <span className="text-[#d4780f22] font-black text-4xl select-none">S</span>
                              </div>
                          }
                          <div className="absolute inset-x-0 bottom-0 h-8" style={{ background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.35))' }}/>
                          {totalQty > 0 && (
                            <span className="absolute top-2 right-2 bg-[#d4780f] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">×{totalQty}</span>
                          )}
                          {group.products.length > 1 && (
                            <span className="absolute top-2 left-2 bg-black/60 text-[#d4780f] text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                              {group.products.length} dim.
                            </span>
                          )}
                          <span className="absolute bottom-2 left-2 text-[8px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={{ background: anyInStock ? 'rgba(74,222,128,0.15)' : 'rgba(239,68,68,0.15)', color: anyInStock ? '#4ade80' : '#ef4444' }}>
                            {anyInStock ? '● Stock' : '● Rupture'}
                          </span>
                          <button onClick={e => { e.stopPropagation(); toggleGroupFav(group.products) }}
                            className="absolute bottom-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90"
                            style={{ background: anyFaved ? '#e03c3c' : 'rgba(0,0,0,0.6)', border: `1px solid ${anyFaved ? '#e03c3c' : '#2a2a2a'}` }}>
                            <svg className="w-3.5 h-3.5" fill={anyFaved ? 'white' : 'none'} stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                            </svg>
                          </button>
                        </div>
                        {/* Infos */}
                        <div className="px-2.5 py-2.5" onClick={() => { setSelectedProduct(group.products[0]); setBsFilterØ(null); setBsFilterI(null); setBsFilterS(null); setPhotoIndex(0) }}>
                          <p className="text-white text-[11px] font-semibold leading-tight line-clamp-2">{groupName}</p>
                          <div className="mt-1.5">
                            {minPrice > 0
                              ? <span className="text-[#d4780f] font-bold text-sm">{group.products.length > 1 ? 'Dès ' : ''}{fmt(minPrice)} €</span>
                              : <span className="text-[#444] text-[10px]">Sur devis</span>
                            }
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Grille photos Lames ── */}
            {!catalogLoading && !catalogError && shopTab === 'lames' && (
              <div className="px-4 pt-4 pb-4">
                <p className="text-[#444] text-[10px] uppercase tracking-widest font-bold mb-3">
                  {lamesGroups.length} produit{lamesGroups.length > 1 ? 's' : ''}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {lamesGroups.map(group => {
                    const anyInStock = group.products.some(p => p.stock > 0)
                    const anyFaved   = group.products.some(p => favorites.has(uid(p)))
                    const totalQty   = group.products.reduce((s, p) => s + (quantities[uid(p)] || 0), 0)
                    const prices     = group.products.map(p => p.prix).filter(x => x > 0)
                    const minPrice   = prices.length ? Math.min(...prices) : 0
                    const groupName  = group.products.length === 1
                      ? group.products[0].designation
                      : group.products[0].designation.replace(/\s+[DSRZLI]=.*/i, '').replace(/\s+\d.*/,'').trim().replace(/[-–.,\s]+$/, '').trim()
                    return (
                      <div
                        key={group.key}
                        className="rounded-2xl overflow-hidden text-left active:scale-[0.97] transition-all"
                        style={{ background: '#111', border: `1px solid ${totalQty > 0 ? '#d4780f55' : '#1e1e1e'}` }}
                      >
                        <div className="relative overflow-hidden" style={{ height: '140px', background: '#f5f5f5' }}
                          onClick={() => { setSelectedProduct(group.products[0]); setBsFilterØ(null); setBsFilterI(null); setBsFilterS(null); setPhotoIndex(0) }}>
                          {group.photoUrl
                            ? <AutoPhoto urls={[group.photoUrl, LAMES_PHOTO2_MAP[group.photoUrl]].filter(Boolean) as string[]} externalIdx={syncPhotoIdx} />
                            : <div className="absolute inset-0 flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg, #1a0800 0%, #0a0500 100%)' }}>
                                <span className="text-[#d4780f22] font-black text-4xl select-none">S</span>
                              </div>
                          }
                          <div className="absolute inset-x-0 bottom-0 h-8" style={{ background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.35))' }}/>
                          {totalQty > 0 && (
                            <span className="absolute top-2 right-2 bg-[#d4780f] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">×{totalQty}</span>
                          )}
                          {group.products.length > 1 && (
                            <span className="absolute top-2 left-2 bg-black/60 text-[#d4780f] text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                              {group.products.length} dim.
                            </span>
                          )}
                          <span className="absolute bottom-2 left-2 text-[8px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={{ background: anyInStock ? 'rgba(74,222,128,0.15)' : 'rgba(239,68,68,0.15)', color: anyInStock ? '#4ade80' : '#ef4444' }}>
                            {anyInStock ? '● Stock' : '● Rupture'}
                          </span>
                          <button onClick={e => { e.stopPropagation(); toggleGroupFav(group.products) }}
                            className="absolute bottom-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90"
                            style={{ background: anyFaved ? '#e03c3c' : 'rgba(0,0,0,0.6)', border: `1px solid ${anyFaved ? '#e03c3c' : '#2a2a2a'}` }}>
                            <svg className="w-3.5 h-3.5" fill={anyFaved ? 'white' : 'none'} stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                            </svg>
                          </button>
                        </div>
                        <div className="px-2.5 py-2.5" onClick={() => { setSelectedProduct(group.products[0]); setBsFilterØ(null); setBsFilterI(null); setBsFilterS(null); setPhotoIndex(0) }}>
                          <p className="text-white text-[11px] font-semibold leading-tight line-clamp-2">{groupName}</p>
                          <div className="mt-1.5">
                            {minPrice > 0
                              ? <span className="text-[#d4780f] font-bold text-sm">{group.products.length > 1 ? 'Dès ' : ''}{fmt(minPrice)} €</span>
                              : <span className="text-[#444] text-[10px]">Sur devis</span>
                            }
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Liste produits (CNC + Lames sans photo) ── */}
            {!catalogLoading && !catalogError && shopTab !== 'cmt' && shopTab !== 'lames' && (activeCategory || !usesCategories) && (
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

      {/* Toast panier */}
      <div
        className="fixed left-1/2 z-50 transition-all duration-300"
        style={{
          bottom: cartToast.visible ? '88px' : '72px',
          transform: 'translateX(-50%)',
          opacity: cartToast.visible ? 1 : 0,
          pointerEvents: 'none',
        }}
      >
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-xl"
          style={{ background: '#d4780f', color: '#fff', whiteSpace: 'nowrap' }}>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
          <span className="text-sm font-semibold">{cartToast.label}</span>
        </div>
      </div>

      <BottomNav cartCount={cartCount} cartTotal={cartTotal}/>

      {/* ── Fiche produit — modal centré ── */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.82)' }}
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="w-full rounded-2xl overflow-hidden flex flex-col"
            style={{ background: '#111', maxHeight: '92vh', maxWidth: '500px', border: '1px solid #2a2a2a' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Photo — sticky, does not scroll */}
            <div className="relative w-full flex-shrink-0 overflow-hidden" style={{ background: '#f4f4f4', height: '240px' }}>
              {currentPhoto2 ? (
                <>
                  <div ref={galleryRef}
                    className="flex h-full overflow-x-auto snap-x snap-mandatory no-scrollbar"
                    onScroll={e => setPhotoIndex(Math.round((e.currentTarget.scrollLeft) / e.currentTarget.offsetWidth))}>
                    <div className="flex-shrink-0 w-full h-full snap-center">
                      <img src={currentPhotoGroup?.photoUrl ?? ''} alt="" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-shrink-0 w-full h-full snap-center">
                      <img src={currentPhoto2} alt="" className="w-full h-full object-contain" />
                    </div>
                  </div>
                  {/* Flèche gauche */}
                  {photoIndex > 0 && (
                    <button className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(0,0,0,0.45)' }}
                      onClick={() => { galleryRef.current?.scrollTo({ left: 0, behavior: 'smooth' }) }}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M6.5 1.5L3 5l3.5 3.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  )}
                  {/* Flèche droite */}
                  {photoIndex < 1 && (
                    <button className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(0,0,0,0.45)' }}
                      onClick={() => { galleryRef.current?.scrollTo({ left: galleryRef.current.offsetWidth, behavior: 'smooth' }) }}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3.5 1.5L7 5l-3.5 3.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  )}
                </>
              ) : currentPhotoGroup?.photoUrl ? (
                <img src={currentPhotoGroup.photoUrl} alt="" className="w-full h-full object-contain" />
              ) : (
                <CategoryImage category={selectedProduct.category} shopTab={shopTab} className="w-full h-full"/>
              )}
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.45)' }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
                  <path d="M1 1l10 10M11 1L1 11" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>
              {currentPhoto2 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-white opacity-90"/>
                  <div className="w-1.5 h-1.5 rounded-full bg-white opacity-40"/>
                </div>
              )}
            </div>

            <div className="overflow-y-auto flex-1 px-4 pt-4 pb-6 space-y-4">

              {/* Titre */}
              <p className="text-white font-semibold text-base leading-snug">
                {currentPhotoGroup
                  ? (currentPhotoGroup.products.length === 1
                      ? currentPhotoGroup.products[0].designation
                      : currentPhotoGroup.products[0].designation.replace(/\s+[DSRZLI]=.*/i, '').replace(/\s+\d.*/,'').trim().replace(/[-–.,\s]+$/, '').trim()
                    )
                  : selectedProduct.designation
                }
              </p>

              {/* Filtres cascadants */}
              {currentPhotoGroup && currentPhotoGroup.products.length > 1 && (
                <div className="space-y-2">
                  {([
                    { label: 'Ø',                                  all: bsAllØ, avail: bsAvailØ, active: bsFilterØ, set: setBsFilterØ },
                    { label: currentLamesGroup ? 'Z'       : 'I',  all: bsAllI, avail: bsAvailI, active: bsFilterI, set: setBsFilterI },
                    { label: currentLamesGroup ? 'Alésage' : 'S',  all: bsAllS, avail: bsAvailS, active: bsFilterS, set: setBsFilterS },
                  ] as const).filter(row => row.all.length > 0).map(row => (
                    <div key={row.label} className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
                      <span className="text-[#d4780f] text-[10px] font-bold flex-shrink-0 w-3">{row.label}</span>
                      {row.all.map(v => {
                        const isSelected = row.active === v
                        const isAvail = row.avail === null || row.avail.has(v)
                        return (
                          <button key={v}
                            onClick={() => isAvail ? row.set(isSelected ? null : v) : undefined}
                            className="flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-medium transition-all"
                            style={{
                              background: isSelected ? '#d4780f' : '#1a1a1a',
                              color: isSelected ? 'white' : isAvail ? '#bbb' : '#333',
                              border: `1px solid ${isSelected ? '#d4780f' : isAvail ? '#333' : '#1e1e1e'}`,
                              opacity: isAvail ? 1 : 0.4,
                              cursor: isAvail ? 'pointer' : 'default',
                            }}>
                            {v}
                          </button>
                        )
                      })}
                    </div>
                  ))}
                </div>
              )}

              {/* Liste de toutes les variantes correspondantes */}
              {(() => {
                const variants = currentPhotoGroup ? cmtMatchingVariants : [selectedProduct!]
                return (
                  <div className="space-y-2">
                    {variants.map(v => {
                      const key = uid(v)
                      const qty = quantities[key] || 0
                      return (
                        <div key={key} className="rounded-xl border border-[#252525] p-3 space-y-2"
                          style={{ background: qty > 0 ? '#130e00' : '#1a1a1a' }}>
                          {/* Ref + specs */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[10px] text-[#555] bg-black/40 px-1.5 py-0.5 rounded">{v.ref}</span>
                            <StockBadge stock={v.stock}/>
                          </div>
                          <div className="flex gap-1.5">
                            {(currentLamesGroup ? [
                              { l: 'Ø',         val: v.diametre },
                              { l: 'Ép. Dent',  val: v.lc },
                              { l: 'Ép. Corps', val: v.lt },
                              { l: 'Z',         val: v.dents },
                              { l: 'Alésage',   val: v.angle },
                            ] : [
                              { l: 'Ø', val: v.diametre },
                              { l: 'I', val: v.lc },
                              { l: 'L', val: v.lt },
                              { l: 'S', val: v.queue },
                            ]).filter(s => s.val && s.val !== '/').map(s => (
                              <div key={s.l} className="flex-1 bg-[#111] rounded-lg py-1.5 text-center border border-[#2a2a2a]">
                                <p className="text-[#d4780f] text-[9px] font-bold">{s.l}</p>
                                <p className="text-white font-mono font-semibold text-xs mt-0.5">{s.val}</p>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center justify-between">
                            {v.prix > 0
                              ? <span className="text-[#d4780f] font-black text-lg">{fmt(v.prix)} €<span className="text-[#555] text-xs font-normal ml-1">HT</span></span>
                              : <span className="text-[#444] text-xs">Sur devis</span>
                            }
                            {v.stock > 0 && v.prix > 0 && (
                              qty === 0 ? (
                                <button onClick={() => setQty(key, 1, v.stock, v.ref)}
                                  className="px-4 py-2 rounded-xl text-sm font-bold text-white active:scale-95 transition-all"
                                  style={{ background: '#d4780f' }}>
                                  + Ajouter
                                </button>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <button onClick={() => setQty(key, -1, v.stock)}
                                    className="w-9 h-9 rounded-xl bg-[#d4780f] flex items-center justify-center font-bold text-lg text-white">−</button>
                                  <span className="w-7 text-center text-[#d4780f] font-bold text-base">{qty}</span>
                                  <button onClick={() => setQty(key, +1, v.stock, v.ref)}
                                    className="w-9 h-9 rounded-xl bg-[#d4780f] flex items-center justify-center font-bold text-lg text-white">+</button>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}

            </div>
          </div>
        </div>
      )}

    </div>
  )
}
