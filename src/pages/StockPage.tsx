import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClientAuth, getClientCode, getAccessCodes, isTestMode } from '../hooks/useAuth'
import BottomNav from '../components/BottomNav'
import TestModeBanner from '../components/TestModeBanner'

interface StockTool {
  id: string
  type: string
  diametre: number
  lc: number
  lt: number
  dents: string
  notes: string
  qty: number
  seuil: number | null
  orderQty: number | null
  addedAt: number
  position: number | null
}

const TOOL_TYPES = [
  'Carbure monobloc',
  'Diamant',
  'Compression',
  'Ravageuse',
]

const TYPE_META: Record<string, { color: string; bg: string; border: string; abbr: string }> = {
  'Carbure monobloc': { color: '#d4780f', bg: '#1a0900', border: '#d4780f22', abbr: 'MC' },
  'Diamant':          { color: '#38bdf8', bg: '#001a28', border: '#38bdf822', abbr: 'PCD' },
  'Compression':      { color: '#a78bfa', bg: '#130d22', border: '#a78bfa22', abbr: 'COMP' },
  'Ravageuse':        { color: '#fbbf24', bg: '#1a1200', border: '#fbbf2422', abbr: 'RAV' },
}

const EMPTY_FORM = { type: '', diametre: '', lc: '', lt: '', dents: '', notes: '' }

export default function StockPage() {
  const navigate = useNavigate()
  const { isAuthenticated, logout } = useClientAuth()

  const clientCode = getClientCode()
  const clientInfo = clientCode ? getAccessCodes().find(c => c.code === clientCode) : null
  const clientName = clientInfo?.clientName ?? clientCode ?? 'Client'
  const stockKey = `spincut_stock2_${clientCode ?? 'guest'}`

  const [tools, setTools] = useState<StockTool[]>(() => {
    try { return JSON.parse(localStorage.getItem(`spincut_stock2_${getClientCode() ?? 'guest'}`) ?? '[]') } catch { return [] }
  })

  const atcCapacity = (() => {
    try {
      const m = JSON.parse(localStorage.getItem(`spincut_machine_${clientCode ?? 'guest'}`) ?? '{}')
      return m.atcCapacity ? parseInt(m.atcCapacity) : 0
    } catch { return 0 }
  })()

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [alertTool, setAlertTool] = useState<StockTool | null>(null)
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null)
  const [mountingToolId, setMountingToolId] = useState<string | null>(null)
  const [slotPickTarget, setSlotPickTarget] = useState<number | null>(null)

  useEffect(() => {
    if (!isTestMode()) {
      try { localStorage.setItem(stockKey, JSON.stringify(tools)) } catch {}
    }
  }, [tools, stockKey])

  if (!isAuthenticated) { navigate('/'); return null }
  localStorage.setItem('spincut_last_section', '/stock')

  const setField = (k: keyof typeof EMPTY_FORM, v: string) => {
    setForm(f => ({ ...f, [k]: v }))
    setFormError('')
  }

  const closeForm = () => { setShowForm(false); setForm(EMPTY_FORM); setFormError('') }

  const handleAdd = () => {
    const d = parseFloat(form.diametre)
    const lc = parseFloat(form.lc)
    const lt = parseFloat(form.lt)
    if (!form.type) return setFormError("Sélectionnez un type d'outil")
    if (!form.diametre || isNaN(d) || d <= 0) return setFormError('Diamètre invalide')
    if (!form.lc || isNaN(lc) || lc <= 0) return setFormError('Longueur de coupe invalide')
    if (!form.lt || isNaN(lt) || lt <= 0) return setFormError('Longueur totale invalide')
    if (!form.dents.trim()) return setFormError('Nombre de dents requis')
    const tool: StockTool = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type: form.type, diametre: d, lc, lt,
      dents: form.dents.trim(), notes: form.notes.trim(),
      qty: 0, seuil: null, orderQty: null,
      addedAt: Date.now(), position: null,
    }
    setTools(prev => [tool, ...prev])
    closeForm()
  }

  const updateQty = (id: string, delta: number) => {
    setTools(prev => prev.map(t => {
      if (t.id !== id) return t
      const newQty = Math.max(0, t.qty + delta)
      if (delta < 0 && t.seuil !== null && newQty <= t.seuil) {
        const triggered = { ...t, qty: newQty }
        setTimeout(() => { setAlertTool(triggered); sendEmailAlert(triggered) }, 50)
      }
      return { ...t, qty: newQty }
    }))
  }

  const setSeuil   = (id: string, val: string) => setTools(prev => prev.map(t => t.id === id ? { ...t, seuil: val === '' ? null : Math.max(0, parseInt(val) || 0) } : t))
  const setOrderQty = (id: string, val: string) => setTools(prev => prev.map(t => t.id === id ? { ...t, orderQty: val === '' ? null : Math.max(1, parseInt(val) || 1) } : t))
  const remove     = (id: string) => setTools(prev => prev.filter(t => t.id !== id))
  const mountTool  = (id: string, position: number) => setTools(prev => prev.map(t =>
    t.id === id ? { ...t, position } : t.position === position ? { ...t, position: null } : t
  ))
  const unmountTool = (id: string) => setTools(prev => prev.map(t => t.id === id ? { ...t, position: null } : t))

  const sendEmailAlert = (tool: StockTool) => {
    fetch('/api/stock-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientName,
        tool: { type: tool.type, diametre: tool.diametre, lc: tool.lc, lt: tool.lt, dents: tool.dents, notes: tool.notes },
        qty: tool.qty, orderQty: tool.orderQty ?? 1,
      }),
    }).catch(() => {})
  }

  const mounted   = tools.filter(t => t.position !== null).sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  const inStock   = atcCapacity > 0 ? tools.filter(t => t.position === null) : tools
  const stockList = atcCapacity > 0 ? inStock : tools

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">

      <header className="sticky top-0 z-30 bg-black border-b border-[#1a1a1a]">
        <div className="max-w-2xl mx-auto px-4 py-2 relative flex items-center justify-center">
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
      {isTestMode() && <TestModeBanner />}

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pb-36 pt-5 space-y-5">

        {/* ── MAGASIN ATC ── */}
        {atcCapacity > 0 && (
          <div className="rounded-2xl overflow-hidden" style={{ background: '#0c0c0c', border: '1px solid #1a1a1a' }}>

            {/* Header ATC */}
            <div className="px-4 pt-4 pb-3 flex items-center justify-between">
              <div>
                <p className="text-white font-bold text-sm">Magasin ATC</p>
                <p className="text-[11px] mt-0.5" style={{ color: '#444' }}>
                  {mounted.length === 0 ? 'Aucun outil chargé' : `${mounted.length} sur ${atcCapacity} postes`}
                </p>
              </div>
              {/* Circular progress */}
              <div className="relative w-12 h-12 flex-shrink-0">
                <svg className="w-12 h-12" style={{ transform: 'rotate(-90deg)' }} viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="19" fill="none" stroke="#1e1e1e" strokeWidth="4"/>
                  <circle cx="24" cy="24" r="19" fill="none" stroke="#d4780f" strokeWidth="4"
                    strokeDasharray={`${2 * Math.PI * 19}`}
                    strokeDashoffset={`${2 * Math.PI * 19 * (1 - mounted.length / atcCapacity)}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-black text-sm" style={{ color: mounted.length > 0 ? '#d4780f' : '#2a2a2a' }}>
                    {mounted.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Slot grid */}
            <div className="px-3 pb-4">
              <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.min(atcCapacity, 6)}, 1fr)` }}>
                {Array.from({ length: atcCapacity }, (_, i) => i + 1).map(pos => {
                  const tool = tools.find(t => t.position === pos)
                  const meta = tool ? (TYPE_META[tool.type] ?? TYPE_META['Carbure monobloc']) : null
                  return (
                    <button
                      key={pos}
                      onClick={() => {
                        if (tool) unmountTool(tool.id)
                        else setSlotPickTarget(pos)
                      }}
                      className="rounded-xl flex flex-col items-center justify-center transition-all active:scale-95"
                      style={{
                        minHeight: '64px',
                        background: tool
                          ? `linear-gradient(160deg, ${meta!.bg} 0%, #090909 100%)`
                          : '#0a0a0a',
                        border: `1px solid ${tool ? meta!.border : '#161616'}`,
                        boxShadow: tool ? `0 0 12px ${meta!.color}18` : 'none',
                      }}
                    >
                      <span className="text-[9px] font-bold mb-0.5" style={{ color: tool ? meta!.color + 'aa' : '#222' }}>{pos}</span>
                      {tool ? (
                        <>
                          <span className="text-white font-black text-sm leading-none">Ø{tool.diametre}</span>
                          <span className="text-[8px] font-bold mt-0.5" style={{ color: meta!.color }}>{meta!.abbr}</span>
                        </>
                      ) : (
                        <svg className="w-3 h-3 mt-0.5" fill="none" stroke="#1e1e1e" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                        </svg>
                      )}
                    </button>
                  )
                })}
              </div>
              {mounted.length > 0 && (
                <p className="text-center text-[10px] mt-3" style={{ color: '#2a2a2a' }}>
                  Touchez un poste occupé pour démonter
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── SECTION OUTILS ── */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-bold text-sm">
              {atcCapacity > 0 ? 'En réserve' : 'Mes outils'}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: '#444' }}>
              {tools.length === 0
                ? 'Aucun outil enregistré'
                : atcCapacity > 0
                  ? `${inStock.length} outil${inStock.length !== 1 ? 's' : ''} en stock`
                  : `${tools.length} outil${tools.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 py-2 px-4 rounded-xl text-sm font-bold text-white active:scale-95 transition-all"
            style={{ background: '#d4780f' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
            </svg>
            Ajouter
          </button>
        </div>

        {/* ── EMPTY STATE ── */}
        {tools.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #1a0900, #0a0400)', border: '1px solid #2a1200' }}>
              <svg className="w-10 h-10" fill="none" stroke="#d4780f33" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-base">Aucun outil enregistré</p>
              <p className="text-[#444] text-sm mt-1">Ajoutez vos fraises et outils CNC</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="py-3 px-8 rounded-2xl text-sm font-bold text-white active:scale-95 transition-all"
              style={{ background: 'linear-gradient(135deg, #d4780f, #b86400)' }}
            >
              + Ajouter mon premier outil
            </button>
          </div>
        )}

        {/* ── TOOL CARDS ── */}
        {stockList.length > 0 && (
          <div className="space-y-2">
            {stockList.map(tool => {
              const atAlert   = tool.seuil !== null && tool.qty <= tool.seuil
              const isEmpty   = tool.qty === 0
              const alertOpen = expandedAlertId === tool.id
              const hasAlert  = tool.seuil !== null || tool.orderQty !== null
              const statusColor = isEmpty ? '#ef4444' : atAlert ? '#f59e0b' : '#22c55e'
              const meta = TYPE_META[tool.type] ?? TYPE_META['Carbure monobloc']

              return (
                <div key={tool.id} className="rounded-2xl overflow-hidden"
                  style={{ background: '#0c0c0c', border: `1px solid ${isEmpty ? '#2a1010' : atAlert ? '#2a1e00' : '#1a1a1a'}` }}>

                  {/* Main row */}
                  <div className="flex items-stretch">
                    {/* Status strip */}
                    <div className="w-[3px] flex-shrink-0" style={{ background: statusColor, borderRadius: '12px 0 0 0' }}/>

                    {/* Content */}
                    <div className="flex-1 px-4 py-3.5 flex items-center gap-3">

                      {/* Type badge */}
                      <div className="w-11 h-11 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
                        style={{ background: meta.bg, border: `1px solid ${meta.border}` }}>
                        <span className="text-[9px] font-bold leading-none" style={{ color: meta.color }}>{meta.abbr}</span>
                        <span className="text-white font-black text-xs mt-0.5">Ø{tool.diametre}</span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: meta.color }}>{tool.type}</p>
                        <p className="text-white font-semibold text-sm leading-tight">
                          Ø{tool.diametre} mm · Z{tool.dents}
                        </p>
                        <p className="text-[10px] font-mono mt-0.5" style={{ color: '#3a3a3a' }}>
                          LC{tool.lc} · LT{tool.lt}{tool.notes ? ` · ${tool.notes}` : ''}
                        </p>
                      </div>

                      {/* Qty counter */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => updateQty(tool.id, -1)}
                          className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg active:scale-90 transition-transform"
                          style={{ background: '#161616', color: '#888', border: '1px solid #222' }}
                        >−</button>
                        <span className="w-9 text-center font-black text-2xl tabular-nums leading-none" style={{ color: statusColor }}>
                          {tool.qty}
                        </span>
                        <button
                          onClick={() => updateQty(tool.id, +1)}
                          className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg active:scale-90 transition-transform"
                          style={{ background: '#d4780f', color: 'white' }}
                        >+</button>
                      </div>
                    </div>
                  </div>

                  {/* Action bar */}
                  <div className="px-4 py-2 border-t flex items-center gap-2" style={{ background: '#080808', borderColor: '#151515' }}>
                    {atcCapacity > 0 && (
                      <button
                        onClick={() => setMountingToolId(tool.id)}
                        className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg"
                        style={{ color: '#666', background: '#111', border: '1px solid #1e1e1e' }}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
                        </svg>
                        Monter
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedAlertId(alertOpen ? null : tool.id)}
                      className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg"
                      style={{
                        color: hasAlert || alertOpen ? '#d4780f' : '#555',
                        background: hasAlert || alertOpen ? '#1a0e00' : '#111',
                        border: `1px solid ${hasAlert || alertOpen ? '#d4780f22' : '#1e1e1e'}`,
                      }}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                      </svg>
                      {hasAlert ? `Alerte ≤ ${tool.seuil}` : 'Alerte'}
                    </button>
                    <div className="flex-1"/>
                    <button
                      onClick={() => remove(tool.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ color: '#2a2a2a' }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>

                  {/* Alert config (collapsible) */}
                  {alertOpen && (
                    <div className="px-4 py-4 border-t grid grid-cols-2 gap-4" style={{ background: '#060606', borderColor: '#141414' }}>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#444' }}>Alerter si stock ≤</p>
                        <div className="flex items-center gap-2">
                          <input
                            type="number" min={0}
                            value={tool.seuil ?? ''}
                            onChange={e => setSeuil(tool.id, e.target.value)}
                            placeholder="—"
                            className="w-16 text-center font-black text-xl rounded-xl py-2 outline-none"
                            style={{ background: '#111', color: '#d4780f', border: '1px solid #2a2a2a' }}
                          />
                          <span className="text-xs" style={{ color: '#444' }}>unité(s)</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#444' }}>Quantité à livrer</p>
                        <div className="flex items-center gap-2">
                          <input
                            type="number" min={1}
                            value={tool.orderQty ?? ''}
                            onChange={e => setOrderQty(tool.id, e.target.value)}
                            placeholder="—"
                            className="w-16 text-center font-black text-xl rounded-xl py-2 outline-none"
                            style={{ background: '#111', color: '#4ade80', border: '1px solid #2a2a2a' }}
                          />
                          <span className="text-xs" style={{ color: '#444' }}>unité(s)</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Alert banner */}
                  {atAlert && (
                    <div className="px-4 py-2.5 border-t flex items-center gap-2.5" style={{ background: '#110a00', borderColor: '#2a1a00' }}>
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse" style={{ background: '#f59e0b' }}/>
                      <p className="text-xs font-semibold" style={{ color: '#f59e0b' }}>
                        Seuil atteint{tool.orderQty ? ` — ${tool.orderQty} unité${tool.orderQty > 1 ? 's' : ''} à livrer` : ''} · Notification envoyée
                      </p>
                    </div>
                  )}
                </div>
              )
            })}

            {atcCapacity > 0 && inStock.length === 0 && tools.length > 0 && (
              <p className="text-center text-sm py-6" style={{ color: '#2a2a2a' }}>
                Tous les outils sont sur la machine
              </p>
            )}
          </div>
        )}
      </main>

      {/* ── Slot pick (clic sur poste vide) ── */}
      {slotPickTarget !== null && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.85)' }}
          onClick={() => setSlotPickTarget(null)}>
          <div className="w-full max-w-sm rounded-t-2xl p-5 space-y-3" style={{ background: '#141414', border: '1px solid #2a2a2a' }}
            onClick={e => e.stopPropagation()}>
            <p className="text-white font-bold text-sm">Charger le poste {slotPickTarget}</p>
            {inStock.length === 0 ? (
              <p className="text-[#444] text-sm py-3">Aucun outil disponible en réserve</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {inStock.map(tool => {
                  const meta = TYPE_META[tool.type] ?? TYPE_META['Carbure monobloc']
                  return (
                    <button key={tool.id}
                      onClick={() => { mountTool(tool.id, slotPickTarget); setSlotPickTarget(null) }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left active:scale-[0.98] transition-all"
                      style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
                    >
                      <div className="w-9 h-9 rounded-lg flex flex-col items-center justify-center flex-shrink-0"
                        style={{ background: meta.bg, border: `1px solid ${meta.border}` }}>
                        <span className="text-[8px] font-bold" style={{ color: meta.color }}>{meta.abbr}</span>
                        <span className="text-white font-black text-[11px]">Ø{tool.diametre}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold">Ø{tool.diametre} mm · Z{tool.dents}</p>
                        <p className="text-[10px] font-mono mt-0.5" style={{ color: '#444' }}>LC{tool.lc} · LT{tool.lt}</p>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-1 rounded-lg" style={{ background: '#0d1a0d', color: '#4ade80' }}>
                        {tool.qty} en stock
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
            <button onClick={() => setSlotPickTarget(null)} className="w-full py-3 rounded-xl text-sm" style={{ color: '#444' }}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* ── Mount position picker ── */}
      {mountingToolId && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.8)' }}
          onClick={() => setMountingToolId(null)}>
          <div className="w-full max-w-sm rounded-t-2xl p-5 space-y-4" style={{ background: '#141414', border: '1px solid #2a2a2a' }}
            onClick={e => e.stopPropagation()}>
            <div>
              <p className="text-white font-bold text-sm">Choisir un poste magasin</p>
              <p className="text-[10px] mt-0.5" style={{ color: '#555' }}>
                {tools.filter(t => t.position !== null).length}/{atcCapacity} postes occupés
              </p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: atcCapacity }, (_, i) => i + 1).map(pos => {
                const occupied = tools.find(t => t.position === pos && t.id !== mountingToolId)
                return (
                  <button key={pos}
                    onClick={() => { mountTool(mountingToolId, pos); setMountingToolId(null) }}
                    className="aspect-square rounded-xl flex flex-col items-center justify-center transition-all active:scale-95"
                    style={{
                      background: occupied ? '#1a0e00' : '#1e1e1e',
                      border: `1.5px solid ${occupied ? '#3a2000' : '#2a2a2a'}`,
                    }}
                  >
                    <span className="text-xs font-black" style={{ color: occupied ? '#d4780f' : '#aaa' }}>{pos}</span>
                    {occupied && (
                      <span className="text-[8px] mt-0.5 text-center leading-tight px-1 truncate w-full" style={{ color: '#d4780f' }}>
                        Ø{occupied.diametre}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            <button onClick={() => setMountingToolId(null)} className="w-full py-3 rounded-xl text-sm" style={{ color: '#555' }}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* ── Add tool modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.9)' }}
          onClick={closeForm}>
          <div className="w-full max-w-md rounded-2xl p-5 space-y-3" style={{ background: '#141414', border: '1px solid #2a2a2a' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-white font-bold text-sm">Ajouter un outil</p>
              <button onClick={closeForm} className="text-[#555] hover:text-white text-2xl leading-none">×</button>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#555' }}>Type d'outil</p>
              <div className="grid grid-cols-2 gap-2">
                {TOOL_TYPES.map(t => {
                  const meta = TYPE_META[t] ?? TYPE_META['Carbure monobloc']
                  const selected = form.type === t
                  return (
                    <button key={t}
                      onClick={() => setField('type', t)}
                      className="py-2.5 px-3 rounded-xl text-xs font-semibold text-left transition-all active:scale-95"
                      style={{
                        background: selected ? meta.bg : '#0d0d0d',
                        border: `1px solid ${selected ? meta.color + '44' : '#2a2a2a'}`,
                        color: selected ? meta.color : '#555',
                      }}
                    >
                      {t}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <NumberField label="Diamètre (mm)" value={form.diametre} onChange={v => setField('diametre', v)} placeholder="ex: 6" />
              <TextField label="Dents (Z)" value={form.dents} onChange={v => setField('dents', v)} placeholder="ex: 2" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <NumberField label="LC coupe (mm)" value={form.lc} onChange={v => setField('lc', v)} placeholder="ex: 20" />
              <NumberField label="LT totale (mm)" value={form.lt} onChange={v => setField('lt', v)} placeholder="ex: 60" />
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#555' }}>Notes (optionnel)</p>
              <textarea
                value={form.notes}
                onChange={e => setField('notes', e.target.value)}
                placeholder="Marque, utilisation…"
                rows={2}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none placeholder-[#333] resize-none"
                style={{ background: '#0d0d0d', border: '1px solid #2a2a2a' }}
              />
            </div>

            {formError && <p className="text-red-400 text-xs">{formError}</p>}

            <button
              onClick={handleAdd}
              className="w-full py-3 rounded-xl text-sm font-bold text-white active:scale-95 transition-all"
              style={{ background: '#d4780f' }}
            >
              Ajouter au stock
            </button>
          </div>
        </div>
      )}

      {/* ── Alert popup ── */}
      {alertTool && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.92)' }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: '#141414', border: '1px solid #3a2a00' }}>
            <div className="px-5 pt-5 pb-3">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">⚠️</span>
                <p className="text-[#fbbf24] font-bold text-base">Seuil critique atteint !</p>
              </div>
              <p className="text-white font-semibold text-sm">{alertTool.type} Ø{alertTool.diametre}mm · Z={alertTool.dents}</p>
              <p className="text-[#555] text-xs mt-0.5">LC={alertTool.lc}mm · LT={alertTool.lt}mm</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 rounded-xl p-3 text-center" style={{ background: '#1a1000', border: '1px solid #3a2a00' }}>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: '#666' }}>Reste</p>
                  <p className="text-2xl font-black" style={{ color: '#fbbf24' }}>{alertTool.qty}</p>
                </div>
                <div className="flex-1 rounded-xl p-3 text-center" style={{ background: '#0d1a0d', border: '1px solid #1a4a1a' }}>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: '#666' }}>À livrer</p>
                  <p className="text-2xl font-black" style={{ color: '#4ade80' }}>{alertTool.orderQty ?? '?'}</p>
                </div>
              </div>
            </div>
            <div className="px-5 pb-5 mt-2 space-y-2">
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs" style={{ background: '#0d1a0d', color: '#4ade80' }}>
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                </svg>
                Notification envoyée automatiquement à SPINCUT
              </div>
              <button
                onClick={() => setAlertTool(null)}
                className="w-full py-3 rounded-xl text-sm font-bold text-white active:scale-95 transition-transform"
                style={{ background: '#1e1e1e' }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}

function NumberField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#555' }}>{label}</p>
      <input type="number" inputMode="decimal" value={value}
        onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none placeholder-[#333]"
        style={{ background: '#0d0d0d', border: '1px solid #2a2a2a' }}
      />
    </div>
  )
}

function TextField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#555' }}>{label}</p>
      <input type="text" value={value}
        onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none placeholder-[#333]"
        style={{ background: '#0d0d0d', border: '1px solid #2a2a2a' }}
      />
    </div>
  )
}
