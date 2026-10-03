import { useState, useEffect, useRef, FormEvent, ReactNode } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useClientAuth } from '../hooks/useAuth'
import { PARTNERS } from '../data/partners'
import { HERO_IMAGES, SERVICE_IMAGES, type ImageSlot } from '../data/siteImages'

function AppleMailIcon() {
  return (
    <span className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: '#1C8EF9' }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
        <path d="M22 8.608v8.142a3.25 3.25 0 0 1-3.066 3.245L18.75 20H5.25a3.25 3.25 0 0 1-3.245-3.066L2 16.75V8.608l9.652 5.056a.75.75 0 0 0 .696 0zM5.25 4h13.5a3.25 3.25 0 0 1 3.234 2.924L12 12.154l-9.984-5.23A3.25 3.25 0 0 1 5.25 4z"/>
      </svg>
    </span>
  )
}

function GmailIcon() {
  return (
    <span className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'white' }}>
      <svg width="28" height="28" viewBox="0 0 256 256">
        <path fill="#4285f4" d="M58.182 192.05V93.14L27.507 65.077L0 49.504v125.091c0 9.658 7.825 17.455 17.455 17.455z"/>
        <path fill="#34a853" d="M197.818 192.05h40.727c9.659 0 17.455-7.826 17.455-17.455V49.505l-31.156 17.837l-27.026 25.798z"/>
        <path fill="#ea4335" d="m58.182 93.14l-4.174-38.647l4.174-36.989L128 69.868l69.818-52.364l4.669 34.992l-4.669 40.644L128 145.504z"/>
        <path fill="#fbbc04" d="M197.818 17.504V93.14L256 49.504V26.231c0-21.585-24.64-33.89-41.89-20.945z"/>
        <path fill="#c5221f" d="m0 49.504l26.759 20.07L58.182 93.14V17.504L41.89 5.286C24.61-7.66 0 4.646 0 26.23z"/>
      </svg>
    </span>
  )
}

function OutlookIcon() {
  return (
    <span className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'white' }}>
      <svg width="28" height="28" viewBox="0 0 32 32">
        <path fill="#0072c6" d="M19.484 7.937v5.477l1.916 1.205a.5.5 0 0 0 .21 0l8.238-5.554a1.174 1.174 0 0 0-.959-1.128Z"/>
        <path fill="#0072c6" d="m19.484 15.457l1.747 1.2a.52.52 0 0 0 .543 0c-.3.181 8.073-5.378 8.073-5.378v10.066a1.408 1.408 0 0 1-1.49 1.555h-8.874zm-9.044-2.525a1.61 1.61 0 0 0-1.42.838a4.13 4.13 0 0 0-.526 2.218A4.05 4.05 0 0 0 9.02 18.2a1.6 1.6 0 0 0 2.771.022a4 4 0 0 0 .515-2.2a4.37 4.37 0 0 0-.5-2.281a1.54 1.54 0 0 0-1.366-.809"/>
        <path fill="#0072c6" d="M2.153 5.155v21.427L18.453 30V2Zm10.908 14.336a3.23 3.23 0 0 1-2.7 1.361a3.19 3.19 0 0 1-2.64-1.318A5.46 5.46 0 0 1 6.706 16.1a5.87 5.87 0 0 1 1.036-3.616a3.27 3.27 0 0 1 2.744-1.384a3.12 3.12 0 0 1 2.61 1.321a5.64 5.64 0 0 1 1 3.484a5.76 5.76 0 0 1-1.035 3.586"/>
      </svg>
    </span>
  )
}

const WHATSAPP_PATH = "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"

const NAV_LINKS = [
  { id: 'accueil', label: 'Accueil' },
  { id: 'services', label: 'Nos services' },
  { id: 'partenaires', label: 'Partenaires' },
  { id: 'contact', label: 'Contact' },
]

const ICON = { width: 24, height: 24, fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, viewBox: '0 0 24 24' }

const I = {
  cnc: <svg {...ICON}><path d="M12 2v6"/><path d="M9 8h6v4l-3 4-3-4z"/><path d="M12 16v6"/><path d="M4 22h16"/></svg>,
  wood: <svg {...ICON}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></svg>,
  sharpen: <svg {...ICON}><path d="M14.5 4.5l5 5L9 20H4v-5z"/><path d="M12 7l5 5"/></svg>,
  machine: <svg {...ICON}><rect x="3" y="10" width="18" height="8" rx="1"/><path d="M7 10V6h10v4"/><path d="M6 18v3M18 18v3"/><circle cx="12" cy="14" r="1.5"/></svg>,
  calc: <svg {...ICON}><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15v3M8 18h4"/></svg>,
  advice: <svg {...ICON}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/><path d="M8 9h8M8 13h5"/></svg>,
  training: <svg {...ICON}><path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/></svg>,
  shop: <svg {...ICON}><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
  stock: <svg {...ICON}><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>,
  orders: <svg {...ICON}><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>,
  truck: <svg {...ICON}><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  shield: <svg {...ICON}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>,
  clock: <svg {...ICON}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  pin: <svg {...ICON}><path d="M12 22s-7-6.2-7-12a7 7 0 0114 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>,
  key: <svg {...ICON}><circle cx="7.5" cy="15.5" r="4.5"/><path d="M10.7 12.3L21 2M17 6l3 3M14 9l2 2"/></svg>,
  image: <svg {...ICON}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>,
}

const SERVICES: { title: string; desc: string }[] = [
  { title: 'Machines à bois', desc: 'Machines à bois et CNC, sélectionnées pour votre production.' },
  { title: 'Outillage CNC', desc: 'Carbure ou diamant.' },
  { title: 'Outillage bois', desc: 'Outillage pour tous les métiers du bois.' },
  { title: 'Affûtage', desc: 'Pour tous vos outils coupants.' },
]

const CNC_EXPERTISE: { title: string; integrated?: boolean }[] = [
  { title: 'Outillage' },
  { title: 'Calculateur CNC', integrated: true },
  { title: 'Gestion de stock', integrated: true },
  { title: 'Conseil' },
  { title: 'Vente de machines CNC' },
]

const TRUST: { label: string; icon: ReactNode }[] = [
  { label: 'Expédié sous 24h', icon: I.truck },
  { label: 'Qualité garantie', icon: I.shield },
  { label: 'Réponse < 1h', icon: I.clock },
  { label: 'Livraison en Île-de-France · Envoi dans toute la France', icon: I.pin },
]

const STEPS = [
  { n: '01', title: 'Demandez votre accès', desc: 'Quelques informations suffisent, en moins d\'une minute.' },
  { n: '02', title: 'Recevez votre code', desc: 'Un code personnel, envoyé dès la création de votre fiche client.' },
  { n: '03', title: 'Entrez dans votre espace', desc: 'Commandez, calculez et gérez votre stock, 24h/24.' },
]

const UNLOCKS: { title: string; desc: string; icon: ReactNode }[] = [
  { title: 'Boutique en ligne 24h/24', icon: I.shop, desc: 'Tout le catalogue, avec le stock en temps réel.' },
  { title: 'Calculateur CNC intégré', icon: I.calc, desc: 'Vos paramètres de coupe en quelques secondes.' },
  { title: 'Gestion de stock outils', icon: I.stock, desc: 'Vos outils suivis, avec une alerte avant la rupture.' },
  { title: 'Suivi de vos commandes', icon: I.orders, desc: 'En cours, livrées, et recommande en un clic.' },
]

// Logo complet avec sa signature « Précision · Performance · Innovation »
function FullLogo({ className = '' }: { className?: string }) {
  return (
    <img
      src="/logo-banniere.png"
      alt="SPINCUT Outils CNC — Précision · Performance · Innovation"
      className={`block w-full object-contain ${className}`}
      style={{ mixBlendMode: 'screen', maskImage: 'radial-gradient(ellipse 58% 52% at 50% 52%, black 55%, transparent 100%)', WebkitMaskImage: 'radial-gradient(ellipse 58% 52% at 50% 52%, black 55%, transparent 100%)' }}
    />
  )
}

// Emplacement photo : affiche la photo si elle existe, sinon un visuel de remplacement soigné
function PhotoSlot({ slot, className = '' }: { slot: ImageSlot; className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-spincut-card via-spincut-surface to-spincut-bg ${className}`}>
      {slot.src ? (
        <img src={slot.src} alt={slot.label} loading="lazy" className="absolute inset-0 w-full h-full object-cover"/>
      ) : (
        <>
          <div aria-hidden className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #D4940A 1px, transparent 0)', backgroundSize: '18px 18px' }}/>
          <span aria-hidden className="absolute -right-4 -bottom-10 text-[11rem] leading-none font-black text-spincut-gold/[0.06] select-none">S</span>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-spincut-subtle">
            <span className="w-11 h-11 rounded-full border border-spincut-border flex items-center justify-center">{I.image}</span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">{slot.label}</span>
          </div>
        </>
      )}
    </div>
  )
}

function SectionHeading({ kicker, title, subtitle }: { kicker: string; title: string; subtitle?: string }) {
  return (
    <Reveal className="text-center max-w-3xl mx-auto">
      <p className="text-spincut-gold text-xs font-semibold uppercase tracking-[0.3em]">{kicker}</p>
      <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight">{title}</h2>
      {subtitle && <p className="mt-4 text-spincut-muted text-base lg:text-lg leading-relaxed">{subtitle}</p>}
    </Reveal>
  )
}

// Apparition légère au scroll (fondu + décalage), désactivée si l'utilisateur réduit les animations
function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) { setVisible(true); io.disconnect() }
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  )
}

export default function LoginPage() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [prospectName, setProspectName] = useState('')
  const [prospectPhone, setProspectPhone] = useState('')
  const [prospectEmail, setProspectEmail] = useState('')
  const [prospectCompany, setProspectCompany] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showMailMenu, setShowMailMenu] = useState(false)
  const [sendError, setSendError] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [emailSending, setEmailSending] = useState(false)
  const photos = ['/photo1.jpg', '/photo2.jpg', '/photo3.jpg', '/photo4.png']
  const { isAuthenticated, login } = useClientAuth()
  const navigate = useNavigate()
  const [showLogin, setShowLogin] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [lightbox, setLightbox] = useState<number | null>(null)

  // Échap ferme les fenêtres ouvertes ; flèches dans la galerie
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setShowLogin(false); setLightbox(null); setMenuOpen(false) }
      if (lightbox !== null && e.key === 'ArrowRight') setLightbox(i => i === null ? null : (i + 1) % photos.length)
      if (lightbox !== null && e.key === 'ArrowLeft') setLightbox(i => i === null ? null : (i - 1 + photos.length) % photos.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, photos.length])

  // Bloque le scroll de la page derrière une fenêtre ouverte
  useEffect(() => {
    const locked = showLogin || lightbox !== null
    document.body.style.overflow = locked ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [showLogin, lightbox])

  if (isAuthenticated) {
    navigate('/boutique', { replace: true })
    return null
  }

  const buildMessage = () => [
    `🆕 Nouvelle demande d'accès SPINCUT`,
    ``,
    `Nom : ${prospectName.trim()}`,
    prospectCompany.trim() ? `Société : ${prospectCompany.trim()}` : '',
    `Email : ${prospectEmail.trim()}`,
    prospectPhone.trim() ? `Téléphone : ${prospectPhone.trim()}` : '',
  ].filter(Boolean).join('\n')

  const handleWhatsApp = () => {
    if (!prospectName.trim() || !prospectPhone.trim()) {
      setSendError('Veuillez renseigner votre nom et votre numéro de téléphone pour envoyer via WhatsApp.')
      return
    }
    setSendError('')
    window.open(`https://wa.me/33767739561?text=${encodeURIComponent(buildMessage())}`, '_blank')
  }

  const handleEmail = async () => {
    if (!prospectName.trim() || !prospectEmail.trim()) {
      setSendError('Veuillez renseigner votre nom et votre email pour envoyer par email.')
      return
    }
    setSendError('')
    setEmailSending(true)
    try {
      const r = await fetch('/api/prospect-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: prospectName.trim(), email: prospectEmail.trim(), phone: prospectPhone.trim() || undefined, company: prospectCompany.trim() || undefined }),
      })
      if (r.ok) {
        setEmailSent(true)
      } else {
        const d = await r.json().catch(() => ({}))
        setSendError((d as any).error ?? 'Erreur lors de l\'envoi, réessayez.')
      }
    } catch {
      setSendError('Erreur réseau, réessayez.')
    } finally {
      setEmailSending(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await login(code)
    setLoading(false)
    if (result.ok) {
      navigate('/boutique')
    } else {
      setError(result.error ?? 'Code invalide. Contactez SPINCUT pour obtenir votre accès.')
    }
  }

  const openLogin = () => { setMenuOpen(false); setShowLogin(true) }

  const scrollToSection = (id: string) => {
    setMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const requestAccess = () => {
    setShowLogin(false)
    setShowForm(true)
    setTimeout(() => scrollToSection('acces'), 50)
  }

  return (
    <div className="min-h-screen bg-spincut-bg text-white">

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 bg-spincut-bg/80 backdrop-blur-md border-b border-spincut-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 lg:h-20 flex items-center justify-between gap-4">
          <div className="flex-1 lg:hidden">
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="w-10 h-10 rounded-xl border border-spincut-border flex items-center justify-center text-white"
              aria-label="Menu" aria-expanded={menuOpen}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
                {menuOpen
                  ? <path d="M6 6l12 12M18 6L6 18"/>
                  : <path d="M4 7h16M4 12h16M4 17h16"/>}
              </svg>
            </button>
          </div>
          <div aria-hidden className="hidden lg:block flex-1"/>

          <nav className="hidden lg:flex items-center gap-10">
            {NAV_LINKS.map(l => (
              <a key={l.id} href={`#${l.id}`} onClick={e => { e.preventDefault(); scrollToSection(l.id) }}
                className="text-sm font-medium text-spincut-muted hover:text-spincut-gold transition-all duration-200">
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex-1 flex items-center justify-end">
            <button
              onClick={openLogin}
              className="h-10 lg:h-11 px-4 lg:px-6 rounded-xl text-sm font-bold text-black bg-gradient-to-r from-spincut-gold to-spincut-gold-light hover:brightness-110 active:scale-95 transition-all duration-200"
            >
              Espace client
            </button>
          </div>
        </div>

        {/* Menu mobile */}
        {menuOpen && (
          <nav className="lg:hidden absolute top-full left-0 right-0 border-y border-spincut-border/60 bg-spincut-bg/95 backdrop-blur-md shadow-2xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-col">
              {NAV_LINKS.map(l => (
                <a key={l.id} href={`#${l.id}`} onClick={e => { e.preventDefault(); scrollToSection(l.id) }}
                  className="py-3 text-base font-medium text-white hover:text-spincut-gold border-b border-spincut-border/40 last:border-0 transition-all duration-200">
                  {l.label}
                </a>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main>
        {/* ════════ ACCUEIL ════════ */}
        <section id="accueil" className="scroll-mt-20 relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute -top-48 -right-24 w-[700px] h-[700px] rounded-full bg-spincut-gold/10 blur-3xl"/>
          <div aria-hidden className="pointer-events-none absolute top-1/2 -left-40 w-[420px] h-[420px] rounded-full bg-spincut-gold/5 blur-3xl"/>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-14 sm:pt-12 lg:pt-10 lg:pb-20 lg:min-h-[calc(100vh-5rem)] grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <Reveal className="lg:col-span-6 flex flex-col items-center text-center">
              <h1 className="sr-only">SPINCUT Outils CNC — Précision · Performance · Innovation</h1>
              <FullLogo className="w-[118%] max-w-[680px]" />
              <div className="mt-4 sm:mt-6">
                <button
                  onClick={() => scrollToSection('services')}
                  className="group h-13 px-7 rounded-xl font-bold whitespace-nowrap text-black bg-gradient-to-r from-spincut-gold to-spincut-gold-light shadow-lg shadow-spincut-gold/20 hover:brightness-110 active:scale-95 transition-all duration-200 inline-flex items-center gap-2"
                >
                  Découvrir nos services
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" className="transition-transform duration-200 group-hover:translate-y-0.5"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                </button>
              </div>
            </Reveal>

            {/* Visuel : emplacements photos outils */}
            <Reveal delay={150} className="lg:col-span-6">
              <div className="grid grid-cols-2 grid-rows-2 gap-3 sm:gap-4 h-[340px] sm:h-[460px] lg:h-[540px]">
                <PhotoSlot slot={HERO_IMAGES[0]} className="row-span-2 rounded-3xl border border-spincut-border shadow-2xl shadow-black/50"/>
                <PhotoSlot slot={HERO_IMAGES[1]} className="rounded-3xl border border-spincut-border"/>
                <PhotoSlot slot={HERO_IMAGES[2]} className="rounded-3xl border border-spincut-border"/>
              </div>
            </Reveal>
          </div>

          {/* Bandeau de réassurance */}
          <div className="relative border-y border-spincut-border/60 bg-spincut-surface/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
              {TRUST.map(t => (
                <div key={t.label} className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-spincut-gold/10 border border-spincut-gold/25 flex items-center justify-center text-spincut-gold [&_svg]:w-5 [&_svg]:h-5">{t.icon}</span>
                  <span className="text-sm font-semibold text-white leading-snug">{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════ NOS SERVICES ════════ */}
        <section id="services" className="scroll-mt-20 py-16 lg:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading
              kicker="Nos services"
              title="De l'outil à la machine, un seul interlocuteur."
              subtitle="Machines, outils, affûtage et accompagnement : tout ce dont vous avez besoin."
            />

            <div className="mt-12 lg:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
              {SERVICES.map((s, i) => (
                <Reveal key={s.title} delay={i * 90}>
                  <article className="group h-full flex flex-col bg-spincut-card rounded-2xl border border-spincut-border overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-spincut-gold/50 hover:shadow-2xl hover:shadow-black/40">
                    <PhotoSlot slot={SERVICE_IMAGES[i]} className="aspect-[16/9] sm:aspect-[4/3] border-b border-spincut-border"/>
                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="text-xl font-bold text-white">{s.title}</h3>
                      <p className="mt-2 text-spincut-muted text-sm leading-relaxed">{s.desc}</p>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>

            {/* Spécialité CNC */}
            <Reveal className="mt-8 lg:mt-10">
              <div className="relative overflow-hidden rounded-3xl border border-spincut-gold/30 bg-gradient-to-br from-spincut-card via-spincut-surface to-spincut-bg p-6 sm:p-10 lg:p-12">
                <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full bg-spincut-gold/10 blur-3xl"/>
                <div className="relative">
                  <div className="max-w-2xl">
                    <p className="text-spincut-gold text-xs font-semibold uppercase tracking-[0.3em]">Notre spécialité</p>
                    <h3 className="mt-3 text-3xl lg:text-4xl font-bold text-white leading-tight">La CNC, c'est notre métier.</h3>
                    <p className="mt-3 text-spincut-muted text-base lg:text-lg">La machine, les outils et les réglages : un seul expert.</p>
                  </div>
                  <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
                    {CNC_EXPERTISE.map(e => (
                      <div key={e.title} className="rounded-2xl bg-spincut-bg/60 border border-spincut-border p-5 transition-all duration-200 hover:border-spincut-gold/40">
                        <p className="font-bold text-white leading-snug">
                          {e.title}{e.integrated && <span className="text-spincut-gold"> *</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-5 text-xs text-spincut-muted"><span className="text-spincut-gold">*</span> Intégré à votre espace client.</p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Réalisations ── */}
        <section id="realisations" className="scroll-mt-20 py-16 lg:py-28 bg-spincut-surface border-y border-spincut-border/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading
              kicker="Réalisations"
              title="Vos réalisations avec nos outils"
              subtitle="Gravure, usinage, découpe : quelques pièces sorties des ateliers de nos clients."
            />
            <div className="mt-12 lg:mt-16 grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              {photos.map((src, i) => (
                <Reveal key={src} delay={i * 80}>
                  <button
                    onClick={() => setLightbox(i)}
                    className="group relative block w-full aspect-square rounded-2xl overflow-hidden border border-spincut-border"
                    aria-label={`Agrandir la réalisation ${i + 1}`}
                  >
                    <img src={src} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"/>
                    <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>
                    <span className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                    </span>
                  </button>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ════════ PARTENAIRES ════════ */}
        <section id="partenaires" className="scroll-mt-20 py-16 lg:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading
              kicker="Partenaires"
              title="Nos marques et fournisseurs"
              subtitle="Des fabricants reconnus, sélectionnés pour la qualité de leurs outils et de leurs machines."
            />
            <div className="mt-12 lg:mt-16 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
              {PARTNERS.map((p, i) => {
                const inner = p.logo
                  ? <img src={p.logo} alt={p.name} className="max-h-12 max-w-[80%] object-contain grayscale opacity-70 transition-all duration-300 group-hover:grayscale-0 group-hover:opacity-100"/>
                  : <span className="text-sm font-semibold text-spincut-subtle text-center px-2 transition-all duration-200 group-hover:text-spincut-muted">{p.name}</span>
                const cls = 'group h-24 rounded-2xl bg-spincut-card border border-spincut-border flex items-center justify-center transition-all duration-200 hover:border-spincut-gold/40'
                return (
                  <Reveal key={`${p.name}-${i}`} delay={i * 60}>
                    {p.url
                      ? <a href={p.url} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
                      : <div className={cls}>{inner}</div>}
                  </Reveal>
                )
              })}
            </div>
          </div>
        </section>

        {/* ════════ VOTRE CODE D'ACCÈS ════════ */}
        <section id="acces" className="scroll-mt-20 pb-16 lg:pb-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal>
              <div className="relative overflow-hidden rounded-[2rem] border border-spincut-gold/30 bg-gradient-to-br from-spincut-card via-spincut-surface to-spincut-bg">
                <div aria-hidden className="pointer-events-none absolute -bottom-40 -left-40 w-[520px] h-[520px] rounded-full bg-spincut-gold/10 blur-3xl"/>
                <div aria-hidden className="pointer-events-none absolute -top-40 -right-20 w-[420px] h-[420px] rounded-full bg-spincut-gold/10 blur-3xl"/>

                <div className="relative p-6 sm:p-10 lg:p-16 grid lg:grid-cols-12 gap-10 lg:gap-16">
                  {/* Gauche : pourquoi vouloir son code */}
                  <div className="lg:col-span-6">
                    <p className="text-spincut-gold text-xs font-semibold uppercase tracking-[0.3em]">Votre code d'accès</p>
                    <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-[1.1] tracking-tight">
                      Les meilleurs ont leur code.
                      <span className="block text-spincut-gold">Et vous, vous l'avez ?</span>
                    </h2>
                    <p className="mt-5 text-spincut-muted text-base lg:text-lg leading-relaxed max-w-lg">
                      Chaque client SPINCUT dispose de son propre code. Il ouvre un espace pensé pour les ateliers :
                    </p>
                    <ul className="mt-6 grid sm:grid-cols-2 gap-3">
                      {UNLOCKS.map(u => (
                        <li key={u.title} className="flex gap-3 rounded-2xl bg-spincut-bg/50 border border-spincut-border p-4">
                          <span className="flex-shrink-0 text-spincut-gold [&_svg]:w-5 [&_svg]:h-5 mt-0.5">{u.icon}</span>
                          <span>
                            <span className="block text-sm font-semibold text-white">{u.title}</span>
                            <span className="block text-xs text-spincut-muted mt-0.5 leading-relaxed">{u.desc}</span>
                          </span>
                        </li>
                      ))}
                    </ul>

                    <ol className="mt-10 space-y-5">
                      {STEPS.map(s => (
                        <li key={s.n} className="flex gap-4">
                          <span className="flex-shrink-0 w-10 h-10 rounded-full border border-spincut-gold/40 text-spincut-gold text-sm font-bold flex items-center justify-center">{s.n}</span>
                          <span>
                            <span className="block font-semibold text-white">{s.title}</span>
                            <span className="block text-sm text-spincut-muted">{s.desc}</span>
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Droite : formulaire de demande */}
                  <div className="lg:col-span-6 flex flex-col justify-center gap-6">
                    <div className="relative bg-spincut-bg/70 backdrop-blur rounded-2xl border border-spincut-border p-5 sm:p-6">
                      <button
                        onClick={() => setShowForm(v => !v)}
                        className={`w-full h-13 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95 ${showForm ? 'border border-spincut-border text-spincut-muted hover:text-white' : 'text-black bg-gradient-to-r from-spincut-gold to-spincut-gold-light shadow-lg shadow-spincut-gold/20 hover:brightness-110'}`}
                      >
                        {showForm ? 'Annuler' : 'Demander mon accès gratuit →'}
                      </button>
                      {!showForm && (
                        <p className="mt-3 text-center text-xs text-spincut-subtle">Gratuit et sans engagement · réponse &lt; 1h</p>
                      )}

                      {/* Formulaire — visible uniquement après clic */}
                      {showForm && (
                        <div className="mt-5 space-y-3 border-t border-spincut-border pt-5">
                          <p className="text-xs font-semibold text-spincut-gold">
                            Une fois votre fiche client créée, vous recevez automatiquement votre code.
                          </p>
                          <div className="grid sm:grid-cols-2 gap-3">
                            {[
                              { label: 'Nom complet *', value: prospectName, set: setProspectName, placeholder: 'Jean Dupont' },
                              { label: 'Société', value: prospectCompany, set: setProspectCompany, placeholder: 'Dupont SARL' },
                              { label: 'Email * (requis pour envoyer par email)', value: prospectEmail, set: setProspectEmail, placeholder: 'jean@exemple.com' },
                              { label: 'Téléphone * (requis pour WhatsApp)', value: prospectPhone, set: setProspectPhone, placeholder: '06 12 34 56 78' },
                            ].map(f => (
                              <div key={f.label}>
                                <label className="block text-spincut-muted text-xs uppercase tracking-wide mb-1">{f.label}</label>
                                <input
                                  type="text"
                                  value={f.value}
                                  onChange={e => f.set(e.target.value)}
                                  placeholder={f.placeholder}
                                  className="w-full px-4 h-12 bg-spincut-bg border border-spincut-border rounded-xl text-white text-sm placeholder-spincut-subtle outline-none transition-all duration-200 focus:border-spincut-gold focus:ring-1 focus:ring-spincut-gold"
                                />
                              </div>
                            ))}
                          </div>
                          <div className="space-y-2 pt-1">
                            <p className="text-[11px] text-center text-spincut-subtle">Choisissez comment envoyer votre demande</p>
                            <div className="grid sm:grid-cols-2 gap-2">
                              <button
                                onClick={handleWhatsApp}
                                className="w-full h-12 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-500 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
                                style={{ opacity: (!prospectName.trim() || !prospectPhone.trim()) ? 0.4 : 1 }}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                  <path d={WHATSAPP_PATH}/>
                                </svg>
                                Envoyer via WhatsApp
                              </button>
                              {emailSent ? (
                                <div className="w-full min-h-12 px-3 py-2 rounded-xl text-sm text-center font-semibold flex items-center justify-center" style={{ background: '#0d2a1a', border: '1px solid #1a4a2a', color: '#4ade80' }}>
                                  ✓ Demande envoyée — SPINCUT vous contactera bientôt
                                </div>
                              ) : (
                                <button
                                  onClick={handleEmail}
                                  disabled={emailSending}
                                  className="w-full h-12 rounded-xl text-sm font-semibold text-white bg-spincut-card border border-spincut-border hover:border-spincut-gold transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60"
                                  style={{ opacity: (!prospectName.trim() || !prospectEmail.trim()) ? 0.4 : 1 }}
                                >
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/>
                                  </svg>
                                  {emailSending ? 'Envoi…' : 'Envoyer par email'}
                                </button>
                              )}
                            </div>
                            {sendError && (
                              <p className="text-xs text-center" style={{ color: '#ef4444' }}>{sendError}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <p className="text-center text-sm text-spincut-muted">
                      Déjà client ?{' '}
                      <button onClick={openLogin} className="font-semibold text-spincut-gold hover:underline">Entrer mon code</button>
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* ════════ CONTACT ════════ */}
      <footer id="contact" className="scroll-mt-20 border-t border-spincut-border bg-spincut-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="text-center">
            <p className="text-spincut-gold text-xs font-semibold uppercase tracking-[0.3em]">Contact</p>
            <p className="mt-4 text-lg font-bold text-white tracking-wide">MOGANE RADJI Johan</p>
            <a href="tel:+33767739561" className="mt-2 block text-white hover:text-spincut-gold transition-all duration-200">07 67 73 95 61</a>
            <a href="mailto:scspincut@gmail.com" className="mt-1 block text-spincut-muted hover:text-spincut-gold transition-all duration-200">scspincut@gmail.com</a>
          </div>
        </div>
        <div className="border-t border-spincut-border/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex justify-center">
            <Link to="/admin" className="text-xs text-spincut-subtle hover:text-spincut-gold transition-all duration-200">
              Administration
            </Link>
          </div>
        </div>
      </footer>

      {/* ── Modale connexion — Espace client ── */}
      {showLogin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowLogin(false)}
        >
          <div
            role="dialog" aria-modal="true" aria-labelledby="login-title"
            className="relative w-full max-w-md bg-spincut-card rounded-2xl border border-spincut-border p-8 shadow-2xl flex flex-col gap-5"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowLogin(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg text-spincut-muted hover:text-white flex items-center justify-center text-2xl leading-none"
              aria-label="Fermer"
            >
              ×
            </button>
            <div className="flex flex-col items-center gap-2 text-center">
              <p className="text-spincut-gold text-xs font-semibold uppercase tracking-widest">Espace client</p>
              <h2 id="login-title" className="text-xl font-bold text-white">Entrer votre code d'accès Spincut</h2>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="text"
                value={code}
                onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
                placeholder="CODE D'ACCÈS"
                autoComplete="off"
                spellCheck={false}
                autoFocus
                className={`w-full px-4 h-13 bg-spincut-bg border rounded-xl text-white placeholder-spincut-subtle font-mono text-sm tracking-widest outline-none transition-all duration-200 focus:ring-1 ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-spincut-border focus:border-spincut-gold focus:ring-spincut-gold'}`}
              />

              {error && (
                <p className="text-sm" style={{ color: '#ef4444' }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-13 rounded-xl font-bold text-black bg-gradient-to-r from-spincut-gold to-spincut-gold-light transition-all duration-200 hover:brightness-110 disabled:opacity-60"
              >
                {loading ? 'Vérification…' : 'Se connecter'}
              </button>
            </form>

            <p className="text-center text-xs text-spincut-muted">
              Pas encore de code ?{' '}
              <button onClick={requestAccess} className="text-spincut-gold hover:underline">Demander mon accès</button>
            </p>
          </div>
        </div>
      )}

      {/* ── Lightbox photos ── */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img
            src={photos[lightbox]}
            alt=""
            className="max-w-full max-h-[85vh] object-contain rounded-xl"
            onClick={e => e.stopPropagation()}
          />
          <button onClick={() => setLightbox(null)} aria-label="Fermer"
            className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl flex items-center justify-center">×</button>
          <button onClick={e => { e.stopPropagation(); setLightbox(i => i === null ? null : (i - 1 + photos.length) % photos.length) }} aria-label="Photo précédente"
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl flex items-center justify-center">‹</button>
          <button onClick={e => { e.stopPropagation(); setLightbox(i => i === null ? null : (i + 1) % photos.length) }} aria-label="Photo suivante"
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl flex items-center justify-center">›</button>
        </div>
      )}

      {/* Mail app chooser */}
      {showMailMenu && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setShowMailMenu(false)}
        >
          <div
            className="w-full max-w-sm rounded-t-2xl p-5 space-y-3 bg-spincut-card border border-spincut-border"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-center text-xs tracking-widest uppercase mb-4" style={{ color: '#888' }}>
              Envoyer votre demande par email
            </p>

            <a
              href={`mailto:scspincut@gmail.com?subject=${encodeURIComponent('Demande accès SPINCUT')}&body=${encodeURIComponent(buildMessage())}`}
              className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl text-sm font-medium text-white"
              style={{ background: '#2a2a2a' }}
              onClick={() => setShowMailMenu(false)}
            >
              <AppleMailIcon />
              <span>
                <span className="block font-semibold">Apple Mail</span>
                <span className="block text-xs" style={{ color: '#888' }}>Application Mail par défaut</span>
              </span>
            </a>

            <a
              href={`https://mail.google.com/mail/?view=cm&fs=1&to=scspincut@gmail.com&su=${encodeURIComponent('Demande accès SPINCUT')}&body=${encodeURIComponent(buildMessage())}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl text-sm font-medium text-white"
              style={{ background: '#2a2a2a' }}
              onClick={() => setShowMailMenu(false)}
            >
              <GmailIcon />
              <span>
                <span className="block font-semibold">Gmail</span>
                <span className="block text-xs" style={{ color: '#888' }}>Ouvre Gmail dans le navigateur</span>
              </span>
            </a>

            <a
              href={`https://outlook.live.com/mail/0/deeplink/compose?to=scspincut@gmail.com&subject=${encodeURIComponent('Demande accès SPINCUT')}&body=${encodeURIComponent(buildMessage())}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl text-sm font-medium text-white"
              style={{ background: '#2a2a2a' }}
              onClick={() => setShowMailMenu(false)}
            >
              <OutlookIcon />
              <span>
                <span className="block font-semibold">Outlook</span>
                <span className="block text-xs" style={{ color: '#888' }}>Ouvre Outlook dans le navigateur</span>
              </span>
            </a>

            <a
              href={`mailto:scspincut@gmail.com?subject=${encodeURIComponent('Demande accès SPINCUT')}&body=${encodeURIComponent(buildMessage())}`}
              className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl text-sm font-medium text-white"
              style={{ background: '#2a2a2a' }}
              onClick={() => setShowMailMenu(false)}
            >
              <span className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: '#2a2a2a', border: '1px solid #3a3a3a' }}>
                <svg width="22" height="22" fill="none" stroke="#aaa" strokeWidth="1.8" viewBox="0 0 24 24">
                  <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/>
                </svg>
              </span>
              <span>
                <span className="block font-semibold" style={{ color: '#ccc' }}>Autre application</span>
                <span className="block text-xs" style={{ color: '#888' }}>Ouvre l'app mail par défaut du téléphone</span>
              </span>
            </a>

            <button
              onClick={() => setShowMailMenu(false)}
              className="w-full py-3 rounded-xl text-sm"
              style={{ color: '#666' }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
