import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClientAuth, getClientCode } from '../hooks/useAuth'
import BottomNav from '../components/BottomNav'

interface StockTool {
  id: string
  type: string
  diametre: number
  lc: number
  lt: number
  dents: string
  qty: number
  addedAt: number
}

const TOOL_TYPES = [
  'Carbure monobloc',
  'Diamant',
  'Compression',
  'Ravageuse',
]

const EMPTY_FORM = { type: '', diametre: '', lc: '', lt: '', dents: '' }

export default function StockPage() {
  const navigate = useNavigate()
  const { isAuthenticated, logout } = useClientAuth()

  const clientCode = getClientCode()
  const stockKey = `spincut_stock2_${clientCode ?? 'guest'}`

  const [tools, setTools] = useState<StockTool[]>(() => {
    try { return JSON.parse(localStorage.getItem(`spincut_stock2_${getClientCode() ?? 'guest'}`) ?? '[]') } catch { return [] }
  })

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    try { localStorage.setItem(stockKey, JSON.stringify(tools)) } catch {}
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
      type: form.type,
      diametre: d,
      lc,
      lt,
      dents: form.dents.trim(),
      qty: 0,
      addedAt: Date.now(),
    }
    setTools(prev => [tool, ...prev])
    closeForm()
  }

  const updateQty = (id: string, delta: number) =>
    setTools(prev => prev.map(t => t.id === id ? { ...t, qty: Math.max(0, t.qty + delta) } : t))

  const remove = (id: string) =>
    setTools(prev => prev.filter(t => t.id !== id))

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

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pb-36 pt-4 space-y-4">

        {/* Header row */}
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-wider" style={{ color: '#555' }}>
            {tools.length === 0 ? 'Aucun outil' : `${tools.length} outil${tools.length > 1 ? 's' : ''}`}
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

        {/* Stock list */}
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
            {tools.map(tool => (
              <div key={tool.id} className="rounded-2xl overflow-hidden" style={{ background: '#111', border: '1px solid #2a2a2a' }}>
                <div className="px-4 pt-3 pb-2 flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-bold text-sm">Ø {tool.diametre} mm</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#2a1400', color: '#d4780f' }}>{tool.type}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                      <span className="text-[11px]" style={{ color: '#666' }}>Z={tool.dents}</span>
                      <span className="text-[11px]" style={{ color: '#666' }}>LC={tool.lc}mm</span>
                      <span className="text-[11px]" style={{ color: '#666' }}>LT={tool.lt}mm</span>
                    </div>
                  </div>
                  <button onClick={() => remove(tool.id)} className="flex-shrink-0 p-1.5 text-[#333] hover:text-red-400 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>

                <div className="px-4 pb-3 flex items-center gap-3 border-t border-[#1a1a1a]">
                  <span className="text-[11px] text-[#555]">Quantité :</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQty(tool.id, -1)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg text-white"
                      style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
                    >−</button>
                    <span
                      className="w-10 text-center font-black text-lg"
                      style={{ color: tool.qty === 0 ? '#f87171' : tool.qty <= 2 ? '#fbbf24' : '#4ade80' }}
                    >{tool.qty}</span>
                    <button
                      onClick={() => updateQty(tool.id, +1)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg text-white"
                      style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
                    >+</button>
                  </div>
                  {tool.qty === 0 && (
                    <span className="ml-auto text-[10px] font-bold" style={{ color: '#f87171' }}>Rupture</span>
                  )}
                  {tool.qty > 0 && tool.qty <= 2 && (
                    <span className="ml-auto text-[10px] font-bold" style={{ color: '#fbbf24' }}>Stock faible</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add tool bottom sheet */}
      {showForm && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.8)' }}
          onClick={closeForm}
        >
          <div
            className="w-full max-w-lg rounded-t-2xl p-5 space-y-3"
            style={{ background: '#161616', border: '1px solid #2a2a2a' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-white font-bold text-sm">Ajouter un outil</p>
              <button onClick={closeForm} className="text-[#555] hover:text-white text-2xl leading-none">×</button>
            </div>

            {/* Type d'outil */}
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

            {/* Diamètre + Dents */}
            <div className="grid grid-cols-2 gap-2">
              <NumberField label="Diamètre (mm)" value={form.diametre} onChange={v => setField('diametre', v)} placeholder="ex: 6" />
              <TextField label="Dents (Z)" value={form.dents} onChange={v => setField('dents', v)} placeholder="ex: 2 ou 2+2" />
            </div>

            {/* LC + LT */}
            <div className="grid grid-cols-2 gap-2">
              <NumberField label="LC — Long. coupe (mm)" value={form.lc} onChange={v => setField('lc', v)} placeholder="ex: 20" />
              <NumberField label="LT — Long. totale (mm)" value={form.lt} onChange={v => setField('lt', v)} placeholder="ex: 60" />
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
        type="number"
        inputMode="decimal"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
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
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none placeholder-[#444]"
        style={{ background: '#0d0d0d', border: '1px solid #2a2a2a' }}
      />
    </div>
  )
}
