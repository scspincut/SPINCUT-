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

  const closeForm = () => {
    setShowForm(false)
    setForm(EMPTY_FORM)
    setFormError('')
  }

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
      dents: form.dents.trim(),
      notes: form.notes.trim(),
      qty: 0, seuil: null, orderQty: null,
      addedAt: Date.now(),
      position: null,
    }
    setTools(prev => [tool, ...prev])
    closeForm()
  }

  const updateQty = (id: string, delta: number) => {
    setTools(prev => {
      const updated = prev.map(t => {
        if (t.id !== id) return t
        const newQty = Math.max(0, t.qty + delta)
        // Déclencher alerte si seuil atteint après une baisse
        if (delta < 0 && t.seuil !== null && newQty <= t.seuil) {
          const triggered = { ...t, qty: newQty }
          setTimeout(() => { setAlertTool(triggered); sendEmailAlert(triggered) }, 50)
        }
        return { ...t, qty: newQty }
      })
      return updated
    })
  }

  const setSeuil = (id: string, val: string) =>
    setTools(prev => prev.map(t => t.id === id ? { ...t, seuil: val === '' ? null : Math.max(0, parseInt(val) || 0) } : t))

  const setOrderQty = (id: string, val: string) =>
    setTools(prev => prev.map(t => t.id === id ? { ...t, orderQty: val === '' ? null : Math.max(1, parseInt(val) || 1) } : t))

  const remove = (id: string) =>
    setTools(prev => prev.filter(t => t.id !== id))

  const mountTool = (id: string, position: number) =>
    setTools(prev => prev.map(t =>
      t.id === id ? { ...t, position } :
      t.position === position ? { ...t, position: null } : t
    ))

  const unmountTool = (id: string) =>
    setTools(prev => prev.map(t => t.id === id ? { ...t, position: null } : t))

  const sendEmailAlert = (tool: StockTool) => {
    if (isTestMode()) return
    fetch('/api/stock-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientName,
        tool: { type: tool.type, diametre: tool.diametre, lc: tool.lc, lt: tool.lt, dents: tool.dents, notes: tool.notes },
        qty: tool.qty,
        orderQty: tool.orderQty ?? 1,
      }),
    }).catch(() => {})
  }

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

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pb-36 pt-4 space-y-4">

        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-wider" style={{ color: '#555' }}>
            {tools.length === 0 ? 'Aucun outil' : atcCapacity > 0
              ? `${tools.filter(t => t.position !== null).length} sur machine · ${tools.filter(t => t.position === null).length} en stock`
              : `${tools.length} outil${tools.length > 1 ? 's' : ''}`}
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold text-white active:scale-95 transition-all"
            style={{ background: '#d4780f' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
            </svg>
            Ajouter un outil
          </button>
        </div>

        {/* ── Sur la machine ── */}
        {atcCapacity > 0 && (() => {
          const mounted = tools.filter(t => t.position !== null).sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
          return (
            <div className="rounded-2xl overflow-hidden" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
              <div className="px-4 pt-4 pb-3 flex items-center justify-between">
                <div>
                  <p className="text-white font-bold text-sm">Sur la machine</p>
                  <p className="text-[10px] mt-0.5" style={{ color: '#555' }}>
                    {mounted.length}/{atcCapacity} postes magasin
                  </p>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: Math.min(atcCapacity, 12) }, (_, i) => (
                    <div key={i} className="w-1.5 h-5 rounded-sm" style={{ background: i < mounted.length ? '#d4780f' : '#2a2a2a' }} />
                  ))}
                  {atcCapacity > 12 && <span className="text-[10px] ml-1 self-center" style={{ color: '#444' }}>+{atcCapacity - 12}</span>}
                </div>
              </div>
              {mounted.length === 0 ? (
                <div className="px-4 pb-4">
                  <p className="text-[#333] text-xs">Aucun outil monté — utilisez 🔧 sur un outil en stock</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: '#1a1a1a' }}>
                  {mounted.map(tool => (
                    <div key={tool.id} className="px-4 py-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0" style={{ background: '#2a1400', color: '#d4780f', border: '1px solid #3a2000' }}>
                        {tool.position}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#2a1400', color: '#d4780f' }}>{tool.type}</span>
                          <span className="text-white text-xs font-bold">Ø{tool.diametre}</span>
                          <span className="text-[11px]" style={{ color: '#555' }}>Z={tool.dents} · LC={tool.lc}</span>
                        </div>
                        {tool.notes && <p className="text-[10px] mt-0.5 italic truncate" style={{ color: '#444' }}>{tool.notes}</p>}
                      </div>
                      <button
                        onClick={() => unmountTool(tool.id)}
                        className="px-2.5 py-1.5 rounded-lg text-[10px] font-semibold flex-shrink-0 active:scale-95 transition-all"
                        style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#666' }}
                      >Démonter</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })()}

        {/* ── En stock ── */}
        {tools.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#161616] border border-[#2a2a2a] flex items-center justify-center">
              <svg className="w-8 h-8 text-[#333]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
            </div>
            <div>
              <p className="text-white font-bold">Votre stock est vide</p>
              <p className="text-[#555] text-sm mt-1">Appuyez sur « Ajouter un outil » pour commencer</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {(() => {
              const inStock = atcCapacity > 0 ? tools.filter(t => t.position === null) : tools
              if (atcCapacity > 0 && inStock.length === 0) return (
                <p className="text-[#333] text-xs text-center py-4">Tous les outils sont montés sur la machine</p>
              )
              return inStock.map(tool => {
              const atAlert = tool.seuil !== null && tool.qty <= tool.seuil
              const isEmpty = tool.qty === 0
              const alertOpen = expandedAlertId === tool.id
              const borderColor = isEmpty ? '#4a1010' : atAlert ? '#b45309' : '#1e1e1e'
              const qtyColor   = isEmpty ? '#f87171' : atAlert ? '#fbbf24' : '#4ade80'
              const hasAlert   = tool.seuil !== null || tool.orderQty !== null
              return (
                <div key={tool.id} className="rounded-2xl overflow-hidden transition-all" style={{ background: '#111', border: `1px solid ${borderColor}` }}>

                  {/* ── Header ─────────────────────────────────────── */}
                  <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#2a1400', color: '#d4780f' }}>{tool.type}</span>
                        <span className="text-white font-bold text-sm">Ø{tool.diametre} mm</span>
                        <span className="text-xs" style={{ color: '#555' }}>Z={tool.dents} · LC={tool.lc} mm · LT={tool.lt} mm</span>
                      </div>
                      {tool.notes && <p className="text-xs mt-1 italic" style={{ color: '#444' }}>{tool.notes}</p>}
                    </div>

                    {/* Actions: monter + cloche + corbeille */}
                    <div className="flex items-center gap-1 flex-shrink-0 pt-0.5">
                      {atcCapacity > 0 && (
                        <button
                          onClick={() => setMountingToolId(tool.id)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                          style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
                          title="Monter sur machine"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="#555" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => setExpandedAlertId(alertOpen ? null : tool.id)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                        style={{ background: alertOpen || hasAlert ? '#2a1a00' : '#1a1a1a', border: `1px solid ${alertOpen || hasAlert ? '#d4780f44' : '#2a2a2a'}` }}
                        title="Configurer alerte"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke={alertOpen || hasAlert ? '#d4780f' : '#555'} strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => remove(tool.id)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                        style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
                      >
                        <svg className="w-3.5 h-3.5 text-[#444] hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* ── Quantité ─────────────────────────────────────── */}
                  <div className="px-4 py-3 border-t border-[#1a1a1a] flex items-center justify-between">
                    <span className="text-xs font-medium" style={{ color: '#555' }}>Quantité en stock</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateQty(tool.id, -1)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg text-white active:scale-90 transition-transform"
                        style={{ background: '#1e1e1e', border: '1px solid #2a2a2a' }}
                      >−</button>
                      <span className="w-12 text-center font-black text-2xl tabular-nums" style={{ color: qtyColor }}>{tool.qty}</span>
                      <button
                        onClick={() => updateQty(tool.id, +1)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg text-white active:scale-90 transition-transform"
                        style={{ background: '#1e1e1e', border: '1px solid #2a2a2a' }}
                      >+</button>
                    </div>
                  </div>

                  {/* ── Config alerte (collapsible) ───────────────────── */}
                  {alertOpen && (
                    <div className="px-4 py-4 border-t border-[#1e1e1e] grid grid-cols-2 gap-4" style={{ background: '#0e0e0e' }}>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#555' }}>Alerter si stock ≤</p>
                        <div className="flex items-center gap-2">
                          <input
                            type="number" min={0}
                            value={tool.seuil ?? ''}
                            onChange={e => setSeuil(tool.id, e.target.value)}
                            placeholder="—"
                            className="w-16 text-center font-black text-xl rounded-xl py-2 outline-none"
                            style={{ background: '#161616', color: '#d4780f', border: '1px solid #2a2a2a' }}
                          />
                          <span className="text-xs" style={{ color: '#555' }}>unité(s)</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#555' }}>Quantité à livrer</p>
                        <div className="flex items-center gap-2">
                          <input
                            type="number" min={1}
                            value={tool.orderQty ?? ''}
                            onChange={e => setOrderQty(tool.id, e.target.value)}
                            placeholder="—"
                            className="w-16 text-center font-black text-xl rounded-xl py-2 outline-none"
                            style={{ background: '#161616', color: '#4ade80', border: '1px solid #2a2a2a' }}
                          />
                          <span className="text-xs" style={{ color: '#555' }}>unité(s)</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Bannière alerte critique ──────────────────────── */}
                  {atAlert && (
                    <div className="px-4 py-3 border-t flex items-center gap-3" style={{ background: '#1a1000', borderColor: '#b45309' }}>
                      <span className="text-base flex-shrink-0">⚠️</span>
                      <div>
                        <p className="text-xs font-bold" style={{ color: '#fbbf24' }}>Seuil atteint</p>
                        <p className="text-[11px]" style={{ color: '#888' }}>
                          Notification envoyée{tool.orderQty ? ` — ${tool.orderQty} unité${tool.orderQty > 1 ? 's' : ''} à livrer` : ''}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          })()}
          </div>
        )}
      </main>

      {/* Mount position picker */}
      {mountingToolId && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.8)' }}
          onClick={() => setMountingToolId(null)}
        >
          <div
            className="w-full max-w-sm rounded-t-2xl p-5 space-y-4"
            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
            onClick={e => e.stopPropagation()}
          >
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
                  <button
                    key={pos}
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

      {/* Add tool modal — centré */}
      {showForm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.85)' }}
          onClick={closeForm}
        >
          <div
            className="w-full max-w-md rounded-2xl p-5 space-y-3"
            style={{ background: '#161616', border: '1px solid #2a2a2a' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-white font-bold text-sm">Ajouter un outil</p>
              <button onClick={closeForm} className="text-[#555] hover:text-white text-2xl leading-none">×</button>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#555' }}>Type d'outil</p>
              <select
                value={form.type}
                onChange={e => setField('type', e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{ background: '#0d0d0d', border: '1px solid #2a2a2a', color: form.type ? 'white' : '#444' }}
              >
                <option value="" disabled>Choisir…</option>
                {TOOL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <NumberField label="Diamètre (mm)" value={form.diametre} onChange={v => setField('diametre', v)} placeholder="ex: 6" />
              <TextField label="Dents (Z)" value={form.dents} onChange={v => setField('dents', v)} placeholder="ex: 2 ou 2+2" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <NumberField label="LC — Long. coupe (mm)" value={form.lc} onChange={v => setField('lc', v)} placeholder="ex: 20" />
              <NumberField label="LT — Long. totale (mm)" value={form.lt} onChange={v => setField('lt', v)} placeholder="ex: 60" />
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#555' }}>Notes (optionnel)</p>
              <textarea
                value={form.notes}
                onChange={e => setField('notes', e.target.value)}
                placeholder="Marque, fournisseur, utilisation spécifique…"
                rows={2}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none placeholder-[#444] resize-none"
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

      {/* Alert modal */}
      {alertTool && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.9)' }}
        >
          <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: '#161616', border: '1px solid #3a2a00' }}>
            <div className="px-5 pt-5 pb-3">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">⚠️</span>
                <p className="text-[#fbbf24] font-bold text-base">Seuil critique atteint !</p>
              </div>
              <p className="text-white font-semibold text-sm">{alertTool.type} Ø{alertTool.diametre}mm · Z={alertTool.dents}</p>
              <p className="text-[#555] text-xs mt-0.5">LC={alertTool.lc}mm · LT={alertTool.lt}mm</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 rounded-xl p-3 text-center" style={{ background: '#1a1000', border: '1px solid #3a2a00' }}>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: '#888' }}>Reste</p>
                  <p className="text-2xl font-black" style={{ color: '#fbbf24' }}>{alertTool.qty}</p>
                </div>
                <div className="flex-1 rounded-xl p-3 text-center" style={{ background: '#0d1a0d', border: '1px solid #1a4a1a' }}>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: '#888' }}>À livrer</p>
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
      <input
        type="number" inputMode="decimal" value={value}
        onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none placeholder-[#444]"
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
      <input
        type="text" value={value}
        onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none placeholder-[#444]"
        style={{ background: '#0d0d0d', border: '1px solid #2a2a2a' }}
      />
    </div>
  )
}
