import { useState, useEffect, useRef, FormEvent, ReactNode } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useClientAuth } from '../hooks/useAuth'
import { PARTNERS } from '../data/partners'

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
  { id: 'services', label: 'Nos services' },
  { id: 'partenaires', label: 'Partenaires' },
  { id: 'contact', label: 'Contact' },
]

const ICON = { width: 24, height: 24, fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, viewBox: '0 0 24 24' }

const SERVICES: { title: string; desc: string; icon: ReactNode }[] = [
  {
    title: 'Boutique en ligne 24h/24',
    desc: 'Fraises CNC, outils de défonceuse et lames carbure disponibles à tout moment, avec le stock en temps réel.',
    icon: <svg {...ICON}><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
  },
  {
    title: 'Calculateur CNC',
    desc: 'Vitesse de broche et avance optimisées selon votre outil, votre matière et votre machine.',
    icon: <svg {...ICON}><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="11" x2="8" y2="11"/><line x1="12" y1="11" x2="12" y2="11"/><line x1="16" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="8" y2="15"/><line x1="12" y1="15" x2="12" y2="15"/><line x1="16" y1="15" x2="16" y2="18"/><line x1="8" y1="18" x2="12" y2="18"/></svg>,
  },
  {
    title: 'Gestion de stock outils',
    desc: "Suivez vos outils en atelier et sur machine, avec une alerte automatique avant la rupture.",
    icon: <svg {...ICON}><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>,
  },
]

const BADGES: { label: string; icon: ReactNode }[] = [
  { label: 'Expédié sous 24h', icon: <svg {...ICON} width={20} height={20}><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> },
  { label: 'Qualité garantie', icon: <svg {...ICON} width={20} height={20}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg> },
  { label: "Réponse en moins d'1h", icon: <svg {...ICON} width={20} height={20}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
]

// Logo SPINCUT recadré depuis la bannière (fond noir fondu via mix-blend-mode)
function BrandLogo() {
  return (
    <span className="relative block w-[132px] h-[44px] lg:w-[150px] lg:h-[50px] overflow-hidden" style={{ mixBlendMode: 'screen', maskImage: 'radial-gradient(ellipse 75% 70% at 50% 50%, black 55%, transparent 100%)', WebkitMaskImage: 'radial-gradient(ellipse 75% 70% at 50% 50%, black 55%, transparent 100%)' }}>
      <img
        src="/logo-banniere.png"
        alt="SPINCUT Outils CNC"
        className="absolute max-w-none w-[282px] -left-[73px] -top-[16px] lg:w-[320px] lg:-left-[83px] lg:-top-[18px]"
      />
    </span>
  )
}

function SectionHeading({ kicker, title }: { kicker: string; title: string }) {
  return (
    <Reveal className="text-center max-w-2xl mx-auto">
      <p className="text-spincut-gold text-xs font-semibold uppercase tracking-[0.3em]">{kicker}</p>
      <h2 className="mt-3 text-3xl lg:text-4xl font-bold text-white leading-tight">{title}</h2>
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
  const [current, setCurrent] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const photos = ['/photo1.jpg', '/photo2.jpg', '/photo3.jpg', '/photo4.png']
  const { isAuthenticated, login } = useClientAuth()
  const navigate = useNavigate()
  const [showLogin, setShowLogin] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [lightbox, setLightbox] = useState<number | null>(null)

  // Carrousel : transition fondue automatique
  useEffect(() => {
    const t = setInterval(() => setCurrent(c => (c + 1) % photos.length), 5000)
    return () => clearInterval(t)
  }, [current, photos.length])

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
          <a href="#top" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }} aria-label="SPINCUT — accueil">
            <BrandLogo />
          </a>

          <nav className="hidden lg:flex items-center gap-10">
            {NAV_LINKS.map(l => (
              <a key={l.id} href={`#${l.id}`} onClick={e => { e.preventDefault(); scrollToSection(l.id) }}
                className="text-sm font-medium text-spincut-muted hover:text-spincut-gold transition-all duration-200">
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={openLogin}
              className="h-10 lg:h-11 px-4 lg:px-6 rounded-xl text-sm font-bold text-black bg-gradient-to-r from-spincut-gold to-spincut-gold-light hover:brightness-110 active:scale-95 transition-all duration-200"
            >
              Espace client
            </button>
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="lg:hidden w-10 h-10 rounded-xl border border-spincut-border flex items-center justify-center text-white"
              aria-label="Menu" aria-expanded={menuOpen}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
                {menuOpen
                  ? <path d="M6 6l12 12M18 6L6 18"/>
                  : <path d="M4 7h16M4 12h16M4 17h16"/>}
              </svg>
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
        {/* ── HERO ── */}
        <section className="relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute -top-40 right-0 w-[600px] h-[600px] rounded-full bg-spincut-gold/10 blur-3xl"/>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-0 lg:min-h-[80vh] grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <Reveal>
              <p className="text-spincut-gold text-xs sm:text-sm font-semibold uppercase tracking-[0.3em]">
                Précision · Performance · Innovation
              </p>
              <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight">
                Les meilleurs ont le code.
                <span className="block text-spincut-gold mt-1">Et vous, vous l'avez ?</span>
              </h1>
              <p className="mt-6 text-spincut-muted text-base sm:text-lg max-w-xl leading-relaxed">
                Fraises CNC, outils de défonceuse et lames carbure pour les professionnels du bois.
                Commandez en ligne, calculez vos paramètres de coupe et suivez votre stock d'outils.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={requestAccess}
                  className="h-13 px-7 rounded-xl font-bold text-black bg-gradient-to-r from-spincut-gold to-spincut-gold-light hover:brightness-110 active:scale-95 transition-all duration-200"
                >
                  Demander un accès
                </button>
                <button
                  onClick={openLogin}
                  className="h-13 px-7 rounded-xl font-bold border border-spincut-gold text-spincut-gold hover:bg-spincut-gold/10 active:scale-95 transition-all duration-200"
                >
                  Espace client
                </button>
              </div>
            </Reveal>

            <Reveal delay={150}>
              <div
                className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-spincut-border shadow-2xl shadow-black/60"
                onTouchStart={e => setTouchStart(e.touches[0].clientX)}
                onTouchEnd={e => {
                  if (touchStart === null) return
                  const delta = touchStart - e.changedTouches[0].clientX
                  if (Math.abs(delta) > 40)
                    setCurrent(c => delta > 0 ? (c + 1) % photos.length : (c - 1 + photos.length) % photos.length)
                  setTouchStart(null)
                }}
              >
                {photos.map((src, i) => (
                  <img
                    key={src}
                    src={src}
                    alt=""
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${i === current ? 'opacity-100' : 'opacity-0'}`}
                  />
                ))}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"/>
                <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-1.5">
                  {photos.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrent(i)}
                      aria-label={`Photo ${i + 1}`}
                      className={`h-1.5 rounded-full transition-all duration-200 ${i === current ? 'w-6 bg-spincut-gold' : 'w-1.5 bg-white/40'}`}
                    />
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── NOS SERVICES ── */}
        <section id="services" className="scroll-mt-20 py-16 lg:py-24 border-t border-spincut-border/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading kicker="Nos services" title="Tout votre outillage, au même endroit" />
            <div className="mt-10 lg:mt-14 grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
              {SERVICES.map((s, i) => (
                <Reveal key={s.title} delay={i * 100}>
                  <div className="h-full bg-spincut-card rounded-2xl border border-spincut-border p-6 lg:p-8 transition-all duration-200 hover:-translate-y-1 hover:border-spincut-gold/50">
                    <div className="w-12 h-12 rounded-xl bg-spincut-gold/10 border border-spincut-gold/30 flex items-center justify-center text-spincut-gold">
                      {s.icon}
                    </div>
                    <h3 className="mt-5 text-lg font-bold text-white">{s.title}</h3>
                    <p className="mt-2 text-spincut-muted text-sm leading-relaxed">{s.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal>
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {BADGES.map(b => (
                  <div key={b.label} className="flex items-center justify-center gap-3 rounded-xl border border-spincut-border bg-spincut-surface px-4 py-3">
                    <span className="text-spincut-gold">{b.icon}</span>
                    <span className="text-sm font-semibold text-white">{b.label}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── PHOTOS ── */}
        <section className="py-16 lg:py-24 bg-spincut-surface border-y border-spincut-border/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading kicker="En images" title="Nos outils à l'œuvre" />
            <div className="mt-10 lg:mt-14 grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              {photos.map((src, i) => (
                <Reveal key={src} delay={i * 80}>
                  <button
                    onClick={() => setLightbox(i)}
                    className="group block w-full aspect-square rounded-2xl overflow-hidden border border-spincut-border"
                    aria-label={`Agrandir la photo ${i + 1}`}
                  >
                    <img src={src} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"/>
                  </button>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── PARTENAIRES ── */}
        <section id="partenaires" className="scroll-mt-20 py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading kicker="Nos partenaires" title="Ils nous font confiance" />
            <div className="mt-10 lg:mt-14 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
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

        {/* ── DEMANDE D'ACCÈS ── */}
        <section id="acces" className="scroll-mt-20 pb-16 lg:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal>
              <div className="relative overflow-hidden rounded-3xl border border-spincut-gold/30 bg-gradient-to-br from-spincut-card to-spincut-bg p-6 sm:p-10 lg:p-14 grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
                <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-spincut-gold/10 blur-3xl"/>
                <div className="relative">
                  <p className="text-spincut-gold text-xs font-semibold uppercase tracking-[0.3em]">Accès gratuit</p>
                  <h2 className="mt-4 text-3xl lg:text-4xl font-bold text-white leading-tight">Vous n'êtes pas encore client ?</h2>
                  <p className="mt-4 text-spincut-muted text-base leading-relaxed max-w-md">
                    Demandez votre code d'accès : une fois votre fiche client créée, vous le recevez automatiquement.
                  </p>
                  <ul className="mt-6 space-y-3">
                    {[
                      'Calculateur CNC',
                      'Boutique en ligne 24/24',
                      'Gestion de stock',
                    ].map(txt => (
                      <li key={txt} className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-spincut-gold/15 text-spincut-gold flex items-center justify-center text-xs font-bold">✓</span>
                        <span className="text-white text-sm sm:text-base">{txt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="relative bg-spincut-bg/60 rounded-2xl border border-spincut-border p-5 sm:p-6">
                  <button
                    onClick={() => setShowForm(v => !v)}
                    className={`w-full h-13 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95 ${showForm ? 'border border-spincut-border text-spincut-muted hover:text-white' : 'text-black bg-gradient-to-r from-spincut-gold to-spincut-gold-light hover:brightness-110'}`}
                  >
                    {showForm ? 'Annuler' : 'Demander mon accès gratuit →'}
                  </button>

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
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer id="contact" className="scroll-mt-20 border-t border-spincut-border bg-spincut-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 grid gap-10 md:grid-cols-3">
          <div>
            <BrandLogo />
            <p className="mt-4 text-spincut-muted text-sm leading-relaxed max-w-xs">
              Outils CNC pour les professionnels : fraises, outils de défonceuse et lames carbure.
            </p>
          </div>
          <div>
            <p className="text-spincut-gold text-xs font-semibold uppercase tracking-widest">Contact</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a href="tel:+33767739561" className="text-white hover:text-spincut-gold transition-all duration-200">07 67 73 95 61</a>
              </li>
              <li>
                <a href="mailto:scspincut@gmail.com" className="text-white hover:text-spincut-gold transition-all duration-200">scspincut@gmail.com</a>
              </li>
              <li>
                <a href="https://wa.me/33767739561" target="_blank" rel="noopener noreferrer" className="text-white hover:text-spincut-gold transition-all duration-200">WhatsApp</a>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-spincut-gold text-xs font-semibold uppercase tracking-widest">Livraison</p>
            <p className="mt-4 text-white text-sm">Livraison en Île-de-France</p>
            <p className="mt-1 text-spincut-muted text-sm">Envoi dans toute la France</p>
          </div>
        </div>
        <div className="border-t border-spincut-border/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-spincut-subtle text-center sm:text-left">
              © SPINCUT — Ces valeurs sont des recommandations standards. Un test avant production est conseillé.
            </p>
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
              Accès réservé aux clients SPINCUT ·{' '}
              <button onClick={requestAccess} className="text-spincut-gold hover:underline">Demander un accès</button>
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
