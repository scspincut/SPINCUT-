import { useState, useEffect, useRef, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAdminAuth, getAccessCodes, saveAccessCodes } from '../hooks/useAuth'
import { AccessCode } from '../types'

function generateCode(name: string, existing: string[]): string {
  const normalized = name.toUpperCase()
    .replace(/[àáâãäåæçèéêëìíîïðñòóôõöùúûüý]/g, (c) => c.normalize('NFD')[0])
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ').trim()

  const stop = new Set(['DE', 'DU', 'LA', 'LE', 'LES', 'ET', 'EN', 'AU', 'AUX', 'L', 'D', 'UN', 'UNE'])
  const words = normalized.split(' ').filter(w => w.length > 0 && !stop.has(w))
  if (words.length === 0) words.push(normalized.replace(/\s/g, '') || 'CLI')

  const base = words.length === 1
    ? words[0]
    : words[0] + words.slice(1).map(w => w[0]).join('')

  if (!existing.includes(base)) return base
  for (let i = 2; i <= 99; i++) {
    const candidate = base + i
    if (!existing.includes(candidate)) return candidate
  }
  return base + Date.now().toString().slice(-2)
}

interface AdminOrder {
  uuid: string; clientName: string; clientCode: string; date: number
  items: string; total: number; status: string; updatedAt: number
  clientEmail: string; clientPhone: string; commPref: string
}

export default function AdminDashboardPage() {
  const { isAdmin, adminLogout } = useAdminAuth()
  const navigate = useNavigate()

  // Onglet actif
  const [activeTab, setActiveTab] = useState<'stock' | 'commandes'>('stock')

  // Commandes en cours
  const [adminOrders, setAdminOrders] = useState<AdminOrder[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState('')
  const [deliverStatus, setDeliverStatus] = useState<Record<string, 'idle' | 'loading' | 'done' | 'error'>>({})
  const [deliverWaUrls, setDeliverWaUrls] = useState<Record<string, string | null>>({})
  const [showDelivered, setShowDelivered] = useState(false)

  const fetchAdminOrders = async () => {
    setOrdersLoading(true); setOrdersError('')
    try {
      const r = await fetch('/api/orders-list')
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'Erreur serveur')
      setAdminOrders(Array.isArray(data) ? data : [])
    } catch (e) {
      setOrdersError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setOrdersLoading(false)
    }
  }

  const handleDeliver = async (orderId: string, status: 'livre' | 'livre_partiel') => {
    setDeliverStatus(prev => ({ ...prev, [orderId]: 'loading' }))
    try {
      const r = await fetch('/api/deliver-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'Erreur serveur')
      setDeliverStatus(prev => ({ ...prev, [orderId]: 'done' }))
      setDeliverWaUrls(prev => ({ ...prev, [orderId]: data.waUrl ?? null }))
      setAdminOrders(prev => prev.map(o => o.uuid === orderId ? { ...o, status } : o))
    } catch {
      setDeliverStatus(prev => ({ ...prev, [orderId]: 'error' }))
    }
  }

  // Gestion codes
  const [codes, setCodes] = useState<AccessCode[]>([])
  const [newCode, setNewCode] = useState('')
  const [newClientName, setNewClientName] = useState('')
  const [newClientPhone, setNewClientPhone] = useState('')
  const [newIsTest, setNewIsTest] = useState(false)
  const [createError, setCreateError] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [importMsg, setImportMsg] = useState('')
  const [showSheetsExport, setShowSheetsExport] = useState(false)

  // Import BDC Abby
  const [bdcId, setBdcId] = useState('')
  const [bdcStatus, setBdcStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [bdcResult, setBdcResult] = useState<{ deducted: { ref: string; designation: string; quantity: number }[]; unmatched: string[] } | null>(null)
  const [bdcError, setBdcError] = useState('')

  // Annulation BDC + restitution stock
  const [cancelId, setCancelId] = useState('')
  const [cancelStatus, setCancelStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [cancelResult, setCancelResult] = useState<{ restored: { ref: string; designation: string; quantity: number }[]; unmatched: string[]; abbyStatus: string } | null>(null)
  const [cancelError, setCancelError] = useState('')

  const handleCancelBdc = async () => {
    if (!cancelId.trim()) return
    setCancelStatus('loading'); setCancelResult(null); setCancelError('')
    try {
      const r = await fetch('/api/cancel-bdc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bdcId: cancelId.trim() }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'Erreur serveur')
      setCancelResult(data)
      setCancelStatus('success')
      setCancelId('')
    } catch (e) {
      setCancelError(e instanceof Error ? e.message : 'Erreur inconnue')
      setCancelStatus('error')
    }
  }

  const handleImportBdc = async () => {
    if (!bdcId.trim()) return
    setBdcStatus('loading'); setBdcResult(null); setBdcError('')
    try {
      const r = await fetch('/api/import-bdc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bdcId: bdcId.trim() }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'Erreur serveur')
      setBdcResult(data)
      setBdcStatus('success')
      setBdcId('')
    } catch (e) {
      setBdcError(e instanceof Error ? e.message : 'Erreur inconnue')
      setBdcStatus('error')
    }
  }

  // Remise en stock
  interface CatalogProduct { sheet: string; row: number; ref: string; designation: string; stock: number }
  const [catalog, setCatalog] = useState<CatalogProduct[]>([])
  const [restoreSearch, setRestoreSearch] = useState('')
  const [restoreSelected, setRestoreSelected] = useState<CatalogProduct | null>(null)
  const [restoreQty, setRestoreQty] = useState('')
  const [restoreStatus, setRestoreStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [restoreMsg, setRestoreMsg] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const restoreRef = useRef<HTMLDivElement>(null)

  const suggestions = restoreSearch.length >= 2
    ? catalog.filter(p =>
        p.ref.toLowerCase().includes(restoreSearch.toLowerCase()) ||
        p.designation.toLowerCase().includes(restoreSearch.toLowerCase())
      ).slice(0, 6)
    : []

  const handleRestore = async () => {
    if (!restoreSelected || !restoreQty || Number(restoreQty) <= 0) return
    setRestoreStatus('loading')
    setRestoreMsg('')
    try {
      const r = await fetch('/api/restore-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheet: restoreSelected.sheet, row: restoreSelected.row, quantity: Number(restoreQty) }),
      })
      if (!r.ok) throw new Error((await r.json()).error ?? 'Erreur serveur')
      setRestoreStatus('success')
      setRestoreMsg(`+${restoreQty} remis en stock pour ${restoreSelected.ref}`)
      setRestoreSearch(''); setRestoreSelected(null); setRestoreQty('')
    } catch (e) {
      setRestoreStatus('error')
      setRestoreMsg(e instanceof Error ? e.message : 'Erreur inconnue')
    }
  }

  useEffect(() => {
    if (!isAdmin) { navigate('/admin', { replace: true }); return }
    setCodes(getAccessCodes())
    fetch('/api/catalog').then(r => r.json()).then(d => { if (Array.isArray(d)) setCatalog(d) }).catch(() => {})
  }, [isAdmin, navigate])

  useEffect(() => {
    if (activeTab === 'commandes' && isAdmin) fetchAdminOrders()
  }, [activeTab, isAdmin])

  const refreshCodes = () => setCodes(getAccessCodes())

  const handleCreate = (e: FormEvent) => {
    e.preventDefault()
    setCreateError('')
    const normalized = newCode.trim().toUpperCase()
    if (!normalized) { setCreateError('Veuillez saisir un code.'); return }
    if (normalized.length < 4) { setCreateError('Le code doit contenir au moins 4 caractères.'); return }
    const existing = getAccessCodes()
    if (existing.some(c => c.code === normalized)) { setCreateError('Ce code existe déjà.'); return }
    const today = new Date()
    const createdAt = `${String(today.getDate()).padStart(2,'0')}/${String(today.getMonth()+1).padStart(2,'0')}/${today.getFullYear()}`
    const newEntry: AccessCode = {
      id: Date.now().toString(), code: normalized, active: true, createdAt,
      clientName: newClientName.trim() || undefined,
      clientPhone: newClientPhone.trim() || undefined,
      isTest: newIsTest || undefined,
    }
    const updated = [...existing, newEntry]
    saveAccessCodes(updated); setCodes(updated)
    setNewCode(''); setNewClientName(''); setNewClientPhone(''); setNewIsTest(false)
  }

  const toggleActive = (id: string) => {
    const updated = codes.map(c => c.id === id ? { ...c, active: !c.active } : c)
    saveAccessCodes(updated); setCodes(updated)
  }

  const deleteCode = (id: string) => {
    const updated = codes.filter(c => c.id !== id)
    saveAccessCodes(updated); setCodes(updated)
  }

  const copyLink = (entry: AccessCode) => {
    const params = new URLSearchParams({ activate: entry.code })
    if (entry.clientName) params.set('name', entry.clientName)
    const url = `${window.location.origin}/?${params.toString()}`
    navigator.clipboard.writeText(url)
    setCopiedId(entry.code)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const importFromAbby = async () => {
    setImportStatus('loading'); setImportMsg('')
    try {
      const res = await fetch('/api/abby-clients')
      if (!res.ok) throw new Error((await res.json()).error ?? 'Erreur serveur')
      const clients: { id: string; name: string; phone?: string }[] = await res.json()
      if (clients.length === 0) { setImportMsg('Aucun contact trouvé dans Abby.'); setImportStatus('done'); return }
      const existing = getAccessCodes()
      const existingNames = existing.map(c => c.clientName?.toLowerCase()).filter(Boolean)
      const existingCodes = existing.map(c => c.code)
      const toAdd: AccessCode[] = []
      const today = new Date()
      const createdAt = `${String(today.getDate()).padStart(2,'0')}/${String(today.getMonth()+1).padStart(2,'0')}/${today.getFullYear()}`
      for (const client of clients) {
        if (existingNames.includes(client.name.toLowerCase())) continue
        const code = generateCode(client.name, [...existingCodes, ...toAdd.map(c => c.code)])
        toAdd.push({ id: Date.now().toString() + Math.random(), code, active: true, createdAt, clientName: client.name, clientPhone: client.phone })
      }
      if (toAdd.length === 0) {
        setImportMsg(`Tous les ${clients.length} clients Abby ont déjà un code.`)
      } else {
        const updated = [...existing, ...toAdd]
        saveAccessCodes(updated); setCodes(updated)
        setImportMsg(`${toAdd.length} code${toAdd.length > 1 ? 's' : ''} importé${toAdd.length > 1 ? 's' : ''} depuis Abby.`)
      }
      setImportStatus('done')
    } catch (e: unknown) {
      setImportStatus('error')
      setImportMsg(e instanceof Error ? e.message : 'Erreur inconnue')
    }
  }

  const handleLogout = () => {
    adminLogout()
    navigate('/')
  }

  if (!isAdmin) return null

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0d0d0d' }}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black border-b border-[#1a1a1a]">
        <div className="max-w-2xl mx-auto px-4 py-2 relative flex items-center justify-center">
          <img src="/logo-banniere.png" alt="SPINCUT" style={{ height: '60px', objectFit: 'contain', mixBlendMode: 'screen', maskImage: 'radial-gradient(ellipse 95% 90% at 50% 50%, black 50%, transparent 100%)', WebkitMaskImage: 'radial-gradient(ellipse 95% 90% at 50% 50%, black 50%, transparent 100%)' }} />
          <button
            onClick={handleLogout}
            className="absolute right-4 flex items-center gap-1 text-[#555] hover:text-white text-xs transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            Déconnexion
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Administration SPINCUT</h1>
        </div>

        {/* Onglets */}
        <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid #2a2a2a' }}>
          {(['stock', 'commandes'] as const).map(tab => {
            const pending = adminOrders.filter(o => o.status === 'en_cours' || o.status === 'livre_partiel')
            const label = tab === 'stock' ? 'Stock & Codes' : 'Commandes'
            const count = tab === 'commandes' && pending.length > 0 ? pending.length : null
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                style={activeTab === tab
                  ? { background: '#d4780f', color: '#fff' }
                  : { background: '#161616', color: '#8a8a8a' }}
              >
                {label}
                {count && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: activeTab === tab ? 'rgba(255,255,255,0.25)' : '#2a1400', color: activeTab === tab ? '#fff' : '#d4780f' }}>{count}</span>}
              </button>
            )
          })}
        </div>

        {/* ─── ONGLET COMMANDES ─── */}
        {activeTab === 'commandes' && (() => {
          const pending = adminOrders.filter(o => o.status === 'en_cours' || o.status === 'livre_partiel')
          const recentDelivered = adminOrders.filter(o => o.status === 'livre').slice(0, 10)
          return (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-xs" style={{ color: '#8a8a8a' }}>
                  {ordersLoading ? 'Chargement…' : `${pending.length} commande${pending.length !== 1 ? 's' : ''} en attente`}
                </p>
                <button
                  onClick={fetchAdminOrders}
                  disabled={ordersLoading}
                  className="text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  style={{ background: '#1e1e1e', color: '#8a8a8a', border: '1px solid #2a2a2a' }}
                >
                  {ordersLoading ? '…' : '↻ Actualiser'}
                </button>
              </div>

              {ordersError && (
                <p className="text-xs px-3 py-2 rounded-lg" style={{ background: '#2a0000', color: '#f87171' }}>
                  {ordersError.includes('GAS') || ordersError.includes('action') ? 'GAS non mis à jour — ajoutez le code COMMANDES à votre Apps Script' : ordersError}
                </p>
              )}

              {!ordersLoading && pending.length === 0 && !ordersError && (
                <div className="text-center py-10">
                  <p className="text-[#555] text-sm">Aucune commande en attente</p>
                </div>
              )}

              {pending.map(order => {
                const ds = deliverStatus[order.uuid] ?? 'idle'
                const waUrl = deliverWaUrls[order.uuid]
                let parsedItems: { ref: string; qty: number }[] = []
                try { parsedItems = JSON.parse(order.items) } catch {}
                const itemsLabel = parsedItems.slice(0, 2).map(i => `${i.qty}× ${i.ref}`).join(', ') +
                  (parsedItems.length > 2 ? ` +${parsedItems.length - 2} autre${parsedItems.length - 2 > 1 ? 's' : ''}` : '')
                const dateStr = order.date ? new Date(order.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—'
                const isPartial = order.status === 'livre_partiel'

                return (
                  <div key={order.uuid} className="rounded-xl p-4" style={{ background: '#161616', border: `1px solid ${isPartial ? '#3a2a00' : '#2a2a2a'}` }}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="text-white font-semibold text-sm">{order.clientName}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: '#555' }}>{itemsLabel}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: '#666' }}>{dateStr}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-white font-bold">{Number(order.total).toFixed(2).replace('.', ',')} €</p>
                        <p className="text-[10px]" style={{ color: '#555' }}>HT</p>
                        {isPartial && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: '#1a1200', color: '#fbbf24' }}>Partiel</span>
                        )}
                      </div>
                    </div>

                    {ds === 'done' && waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold mb-2"
                        style={{ background: '#0d2010', color: '#4ade80', border: '1px solid #166534' }}
                      >
                        ✓ Livré — Notifier par WhatsApp
                      </a>
                    )}
                    {ds === 'done' && !waUrl && (
                      <p className="text-xs text-center py-2 mb-2" style={{ color: '#4ade80' }}>✓ Statut mis à jour — notification envoyée</p>
                    )}

                    {ds !== 'done' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeliver(order.uuid, 'livre')}
                          disabled={ds === 'loading'}
                          className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                          style={{ background: '#0a1f0a', color: '#4ade80', border: '1px solid #166534' }}
                        >
                          {ds === 'loading' ? '…' : '✓ Livré'}
                        </button>
                        <button
                          onClick={() => handleDeliver(order.uuid, 'livre_partiel')}
                          disabled={ds === 'loading'}
                          className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                          style={{ background: '#1a1200', color: '#fbbf24', border: '1px solid #78350f' }}
                        >
                          {ds === 'loading' ? '…' : '⚡ Partiel'}
                        </button>
                        {order.commPref === 'whatsapp' && order.clientPhone && (
                          <a
                            href={`https://wa.me/${order.clientPhone.replace(/\s/g, '').replace(/^0/, '33')}?text=${encodeURIComponent(`Bonjour ${order.clientName.split(' ')[0]} 👋`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2.5 rounded-lg text-xs font-bold"
                            style={{ background: '#0a1628', color: '#60a5fa', border: '1px solid #1e3a5f' }}
                          >
                            WA
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Livrées récemment */}
              {recentDelivered.length > 0 && (
                <div>
                  <button
                    className="w-full flex items-center justify-between py-2"
                    onClick={() => setShowDelivered(v => !v)}
                  >
                    <span className="text-xs font-semibold" style={{ color: '#555' }}>Livrées récemment ({recentDelivered.length})</span>
                    <svg className={`w-3.5 h-3.5 transition-transform ${showDelivered ? 'rotate-180' : ''}`} fill="none" stroke="#555" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>
                  {showDelivered && (
                    <div className="flex flex-col gap-2 mt-1">
                      {recentDelivered.map(order => {
                        let parsedItems: { ref: string; qty: number }[] = []
                        try { parsedItems = JSON.parse(order.items) } catch {}
                        const dateStr = order.date ? new Date(order.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—'
                        return (
                          <div key={order.uuid} className="rounded-xl px-4 py-3 flex items-center justify-between" style={{ background: '#0d1a0d', border: '1px solid #1a3a1a' }}>
                            <div>
                              <p className="text-sm font-medium text-white">{order.clientName}</p>
                              <p className="text-[11px]" style={{ color: '#3a6a3a' }}>{parsedItems.slice(0, 2).map(i => `${i.qty}× ${i.ref}`).join(', ')}{parsedItems.length > 2 ? ` +${parsedItems.length - 2}` : ''}</p>
                              <p className="text-[10px]" style={{ color: '#2a4a2a' }}>{dateStr}</p>
                            </div>
                            <span className="text-xs font-bold px-2 py-1 rounded" style={{ background: '#0a2a0a', color: '#4ade80' }}>✓</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })()}

        {/* ─── ONGLET STOCK ─── */}
        {activeTab === 'stock' && <>

        {/* Import BDC Abby */}
        <div className="rounded-xl p-5" style={{ background: '#161616', border: '1px solid #2a2a2a' }}>
          <h2 className="text-base font-semibold text-white mb-1">Déduire stock depuis un BDC Abby</h2>
          <p className="text-xs mb-4" style={{ color: '#8a8a8a' }}>Colle l'ID du BDC ou de la facture Abby — le stock se déduit automatiquement</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={bdcId}
              onChange={e => { setBdcId(e.target.value); setBdcStatus('idle'); setBdcResult(null); setBdcError('') }}
              placeholder="ex: BDC-2026-0001"
              className="flex-1 px-3 py-2.5 rounded-lg text-white text-sm outline-none font-mono"
              style={{ background: '#1e1e1e', border: '1px solid #2a2a2a' }}
              onFocus={e => (e.currentTarget.style.border = '1px solid #d4780f')}
              onBlur={e => (e.currentTarget.style.border = '1px solid #2a2a2a')}
              onKeyDown={e => e.key === 'Enter' && handleImportBdc()}
            />
            <button
              onClick={handleImportBdc}
              disabled={bdcStatus === 'loading' || !bdcId.trim()}
              className="px-4 py-2.5 rounded-lg text-sm font-bold text-white transition-colors disabled:opacity-50"
              style={{ background: '#d4780f' }}
            >
              {bdcStatus === 'loading' ? '…' : 'Déduire'}
            </button>
          </div>

          {bdcError && (
            <p className="text-xs mt-3 px-3 py-2 rounded-lg" style={{ background: '#2a0000', color: '#f87171' }}>{bdcError}</p>
          )}

          {bdcResult && bdcStatus === 'success' && (
            <div className="mt-3 space-y-2">
              {bdcResult.deducted.length > 0 && (
                <div className="px-3 py-2 rounded-lg" style={{ background: '#0a1f0a' }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: '#4ade80' }}>✓ Stock déduit ({bdcResult.deducted.length} article{bdcResult.deducted.length > 1 ? 's' : ''})</p>
                  {bdcResult.deducted.map((d, i) => (
                    <p key={i} className="text-xs" style={{ color: '#86efac' }}>−{d.quantity}× <span className="font-mono">{d.ref}</span> {d.designation}</p>
                  ))}
                </div>
              )}
              {bdcResult.unmatched.length > 0 && (
                <div className="px-3 py-2 rounded-lg" style={{ background: '#1a1200' }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: '#fbbf24' }}>⚠ Références non trouvées dans le stock</p>
                  {bdcResult.unmatched.map((u, i) => (
                    <p key={i} className="text-xs font-mono" style={{ color: '#fcd34d' }}>{u}</p>
                  ))}
                </div>
              )}
              {bdcResult.deducted.length === 0 && bdcResult.unmatched.length === 0 && (
                <p className="text-xs px-3 py-2 rounded-lg" style={{ background: '#1a1200', color: '#fbbf24' }}>Aucune ligne avec référence trouvée dans ce BDC</p>
              )}
            </div>
          )}
        </div>

        {/* Annulation BDC + restitution stock */}
        <div className="rounded-xl p-5" style={{ background: '#161616', border: '1px solid #3a1a1a' }}>
          <h2 className="text-base font-semibold text-white mb-1">Annuler un BDC et restituer le stock</h2>
          <p className="text-xs mb-4" style={{ color: '#8a8a8a' }}>Colle l'ID du BDC depuis l'email de notification — le stock est remis et le BDC archivé dans Abby</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={cancelId}
              onChange={e => { setCancelId(e.target.value); setCancelStatus('idle'); setCancelResult(null); setCancelError('') }}
              placeholder="ex: 6e27007992f5fa6e537fa49e7"
              className="flex-1 px-3 py-2.5 rounded-lg text-white text-sm outline-none font-mono"
              style={{ background: '#1e1e1e', border: '1px solid #2a2a2a' }}
              onFocus={e => (e.currentTarget.style.border = '1px solid #ef4444')}
              onBlur={e => (e.currentTarget.style.border = '1px solid #2a2a2a')}
              onKeyDown={e => e.key === 'Enter' && handleCancelBdc()}
            />
            <button
              onClick={handleCancelBdc}
              disabled={cancelStatus === 'loading' || !cancelId.trim()}
              className="px-4 py-2.5 rounded-lg text-sm font-bold text-white transition-colors disabled:opacity-50"
              style={{ background: '#b91c1c' }}
            >
              {cancelStatus === 'loading' ? '…' : 'Annuler'}
            </button>
          </div>
          {cancelError && (
            <p className="text-xs mt-3 px-3 py-2 rounded-lg" style={{ background: '#2a0000', color: '#f87171' }}>{cancelError}</p>
          )}
          {cancelResult && cancelStatus === 'success' && (
            <div className="mt-3 space-y-2">
              {cancelResult.restored.length > 0 && (
                <div className="px-3 py-2 rounded-lg" style={{ background: '#0a1f0a' }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: '#4ade80' }}>✓ Stock restitué ({cancelResult.restored.length} article{cancelResult.restored.length > 1 ? 's' : ''})</p>
                  {cancelResult.restored.map((d, i) => (
                    <p key={i} className="text-xs" style={{ color: '#86efac' }}>+{d.quantity}× <span className="font-mono">{d.ref}</span></p>
                  ))}
                </div>
              )}
              {cancelResult.abbyStatus === 'archived' && (
                <p className="text-xs px-3 py-2 rounded-lg" style={{ background: '#1a1200', color: '#fbbf24' }}>BDC archivé dans Abby</p>
              )}
              {cancelResult.abbyStatus === 'stock_restored_only' && (
                <p className="text-xs px-3 py-2 rounded-lg" style={{ background: '#1a1200', color: '#fbbf24' }}>⚠ Stock restitué — annule manuellement le BDC dans Abby</p>
              )}
              {cancelResult.unmatched.length > 0 && (
                <p className="text-xs px-3 py-2 rounded-lg" style={{ background: '#1a1200', color: '#fbbf24' }}>Réfs non trouvées : {cancelResult.unmatched.join(', ')}</p>
              )}
            </div>
          )}
        </div>

        {/* Remise en stock manuelle par article */}
        <div className="rounded-xl p-5" style={{ background: '#161616', border: '1px solid #2a2a2a' }}>
          <h2 className="text-base font-semibold text-white mb-4">Remise en stock manuelle — par article</h2>
          <p className="text-xs mb-3" style={{ color: '#8a8a8a' }}>Pour corriger le stock d'un article précis</p>
          <div className="space-y-3">
            <div ref={restoreRef} className="relative">
              <input
                type="text"
                value={restoreSelected ? `${restoreSelected.ref} — ${restoreSelected.designation}` : restoreSearch}
                onChange={e => { setRestoreSearch(e.target.value); setRestoreSelected(null); setShowSuggestions(true) }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Rechercher un article (ref ou désignation)..."
                className="w-full px-3 py-2.5 rounded-lg text-white text-sm outline-none"
                style={{ background: '#1e1e1e', border: '1px solid #2a2a2a' }}
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-20 w-full mt-1 rounded-lg overflow-hidden" style={{ background: '#1e1e1e', border: '1px solid #3a3a3a' }}>
                  {suggestions.map(p => (
                    <button
                      key={`${p.ref}__${p.row}`}
                      className="w-full text-left px-3 py-2.5 hover:bg-[#2a2a2a] transition-colors"
                      onMouseDown={() => { setRestoreSelected(p); setRestoreSearch(''); setShowSuggestions(false) }}
                    >
                      <span className="font-mono text-xs text-[#d4780f] font-semibold">{p.ref}</span>
                      <span className="text-xs text-[#aaa] ml-2">{p.designation}</span>
                      <span className="text-xs text-[#555] ml-2">Stock: {p.stock}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {restoreSelected && (
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  value={restoreQty}
                  onChange={e => setRestoreQty(e.target.value)}
                  placeholder="Quantité à remettre"
                  className="flex-1 px-3 py-2.5 rounded-lg text-white text-sm outline-none"
                  style={{ background: '#1e1e1e', border: '1px solid #2a2a2a' }}
                />
                <button
                  onClick={handleRestore}
                  disabled={restoreStatus === 'loading' || !restoreQty || Number(restoreQty) <= 0}
                  className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50"
                  style={{ background: '#d4780f' }}
                >
                  {restoreStatus === 'loading' ? '…' : '+ Remettre'}
                </button>
              </div>
            )}
            {restoreMsg && (
              <p className="text-xs px-3 py-2 rounded-lg" style={{ background: restoreStatus === 'error' ? '#2a0000' : '#0a1f0a', color: restoreStatus === 'error' ? '#f87171' : '#4ade80' }}>
                {restoreMsg}
              </p>
            )}
          </div>
        </div>

        {/* Créer code */}
        <div className="rounded-xl p-5" style={{ background: '#161616', border: '1px solid #2a2a2a' }}>
          <h2 className="text-base font-semibold text-white mb-4">Codes d'accès</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={newCode}
                  onChange={e => { setNewCode(e.target.value.toUpperCase()); setCreateError('') }}
                  placeholder="CODE (ex: DUPONT)"
                  className="w-full px-4 py-2.5 rounded-lg text-white placeholder-gray-600 font-mono text-sm tracking-widest outline-none"
                  style={{ background: '#1e1e1e', border: createError ? '1px solid #ef4444' : '1px solid #2a2a2a' }}
                  onFocus={e => { if (!createError) e.currentTarget.style.border = '1px solid #d4780f' }}
                  onBlur={e => { if (!createError) e.currentTarget.style.border = '1px solid #2a2a2a' }}
                />
                {createError && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{createError}</p>}
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg font-semibold text-white transition-colors flex-shrink-0"
                style={{ background: '#d4780f' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#b86400')}
                onMouseLeave={e => (e.currentTarget.style.background = '#d4780f')}
              >
                Créer
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={newClientName}
                onChange={e => setNewClientName(e.target.value)}
                placeholder="Nom du client (optionnel)"
                className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none"
                style={{ background: '#1e1e1e', border: '1px solid #2a2a2a' }}
                onFocus={e => (e.currentTarget.style.border = '1px solid #d4780f')}
                onBlur={e => (e.currentTarget.style.border = '1px solid #2a2a2a')}
              />
              <input
                type="text"
                value={newClientPhone}
                onChange={e => setNewClientPhone(e.target.value)}
                placeholder="Téléphone (optionnel)"
                className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none"
                style={{ background: '#1e1e1e', border: '1px solid #2a2a2a' }}
                onFocus={e => (e.currentTarget.style.border = '1px solid #d4780f')}
                onBlur={e => (e.currentTarget.style.border = '1px solid #2a2a2a')}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer w-fit">
              <input
                type="checkbox"
                checked={newIsTest}
                onChange={e => setNewIsTest(e.target.checked)}
                className="w-4 h-4 accent-[#d4780f] cursor-pointer"
              />
              <span className="text-xs" style={{ color: '#888' }}>Code de test — aucune donnée sauvegardée</span>
            </label>
          </form>
        </div>

        {/* Import Abby */}
        <div className="rounded-xl p-5" style={{ background: '#161616', border: '1px solid #2a2a2a' }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Importer depuis Abby</h2>
              <p className="text-xs mt-0.5" style={{ color: '#8a8a8a' }}>Génère automatiquement un code pour chaque client Abby</p>
            </div>
            <button
              onClick={importFromAbby}
              disabled={importStatus === 'loading'}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
              style={{ background: '#0a1628', color: '#60a5fa', border: '1px solid #1e3a5f' }}
            >
              {importStatus === 'loading' ? (
                <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Importation…</>
              ) : '↓ Importer'}
            </button>
          </div>
          {importMsg && (
            <p className="text-xs mt-3 px-3 py-2 rounded-lg" style={{ background: importStatus === 'error' ? '#2a0000' : '#0a1f0a', color: importStatus === 'error' ? '#f87171' : '#4ade80' }}>
              {importMsg}
            </p>
          )}
        </div>

        {/* Liste des codes */}
        <div className="rounded-xl p-5" style={{ background: '#161616', border: '1px solid #2a2a2a' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">
              Codes actifs{' '}
              <span className="text-sm font-normal px-2 py-0.5 rounded ml-1" style={{ background: '#1e1e1e', color: '#8a8a8a' }}>
                {codes.length}
              </span>
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSheetsExport(true)}
                className="text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                style={{ background: '#0a1f0a', color: '#4ade80', border: '1px solid #166534' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#14291e')}
                onMouseLeave={e => (e.currentTarget.style.background = '#0a1f0a')}
              >
                Exporter Sheets
              </button>
              <button
                onClick={refreshCodes}
                className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                style={{ background: '#1e1e1e', color: '#8a8a8a', border: '1px solid #2a2a2a' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#f1f1f1')}
                onMouseLeave={e => (e.currentTarget.style.color = '#8a8a8a')}
              >
                Actualiser
              </button>
            </div>
          </div>

          {showSheetsExport && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }} onClick={() => setShowSheetsExport(false)}>
              <div className="w-full max-w-2xl rounded-2xl p-6" style={{ background: '#161616', border: '1px solid #2a2a2a' }} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-white">Export Google Sheets — onglet CODES</h3>
                  <button onClick={() => setShowSheetsExport(false)} style={{ color: '#8a8a8a' }}>✕</button>
                </div>
                <p className="text-xs mb-3" style={{ color: '#8a8a8a' }}>
                  Copie tout le texte, ouvre l'onglet <strong style={{ color: '#d4780f' }}>CODES</strong> dans Sheets, clique cellule <strong style={{ color: '#d4780f' }}>A1</strong> et colle.
                </p>
                <textarea
                  readOnly
                  className="w-full rounded-lg p-3 text-xs font-mono resize-none"
                  style={{ background: '#0d0d0d', color: '#e2e8f0', border: '1px solid #2a2a2a', height: '260px' }}
                  value={['id\tcode\tclientName\tactive\tisTest\tcreatedAt', ...codes.map((c, i) => [c.id || String(i+1), c.code, c.clientName ?? '', c.active ? 'TRUE' : 'FALSE', c.isTest ? 'TRUE' : 'FALSE', c.createdAt ?? ''].join('\t'))].join('\n')}
                  onFocus={e => e.target.select()}
                />
                <button
                  className="mt-3 w-full py-2.5 rounded-lg text-sm font-semibold"
                  style={{ background: '#d4780f', color: '#fff' }}
                  onClick={() => navigator.clipboard.writeText(['id\tcode\tclientName\tactive\tisTest\tcreatedAt', ...codes.map((c, i) => [c.id || String(i+1), c.code, c.clientName ?? '', c.active ? 'TRUE' : 'FALSE', c.isTest ? 'TRUE' : 'FALSE', c.createdAt ?? ''].join('\t'))].join('\n'))}
                >
                  Copier tout
                </button>
              </div>
            </div>
          )}

          {codes.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: '#8a8a8a' }}>Aucun code créé pour l'instant.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid #2a2a2a' }}>
                    <th className="text-left pb-3 font-medium" style={{ color: '#8a8a8a' }}>Code</th>
                    <th className="text-left pb-3 font-medium" style={{ color: '#8a8a8a' }}>Client</th>
                    <th className="text-left pb-3 font-medium" style={{ color: '#8a8a8a' }}>Statut</th>
                    <th className="text-left pb-3 font-medium" style={{ color: '#8a8a8a' }}>Créé</th>
                    <th className="text-right pb-3 font-medium" style={{ color: '#8a8a8a' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-white tracking-wider">{c.code}</span>
                          {c.isTest && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: '#1a1a00', color: '#fbbf24', border: '1px solid #3a3a00' }}>TEST</span>}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        {c.clientName
                          ? <div><p className="text-white text-xs font-medium">{c.clientName}</p>{c.clientPhone && <p className="text-xs" style={{ color: '#8a8a8a' }}>{c.clientPhone}</p>}</div>
                          : <span className="text-xs" style={{ color: '#3a3a3a' }}>—</span>}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-xs font-medium px-2 py-0.5 rounded" style={c.active ? { background: '#0a1f0a', color: '#4ade80', border: '1px solid #166534' } : { background: '#1a0a0a', color: '#f87171', border: '1px solid #7f1d1d' }}>
                          {c.active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-xs" style={{ color: '#8a8a8a' }}>{c.createdAt}</td>
                      <td className="py-3">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          <button onClick={() => copyLink(c)} className="text-xs px-3 py-1 rounded transition-colors" style={{ background: '#0a1628', color: copiedId === c.code ? '#4ade80' : '#60a5fa', border: `1px solid ${copiedId === c.code ? '#166534' : '#1e3a5f'}` }}>
                            {copiedId === c.code ? '✓ Copié !' : 'Lien client'}
                          </button>
                          <button onClick={() => toggleActive(c.id)} className="text-xs px-3 py-1 rounded transition-colors" style={{ background: '#1e1e1e', color: c.active ? '#f59e0b' : '#4ade80', border: '1px solid #2a2a2a' }} onMouseEnter={e => (e.currentTarget.style.background = '#2a2a2a')} onMouseLeave={e => (e.currentTarget.style.background = '#1e1e1e')}>
                            {c.active ? 'Désactiver' : 'Activer'}
                          </button>
                          <button onClick={() => deleteCode(c.id)} className="text-xs px-3 py-1 rounded transition-colors" style={{ background: '#1a0a0a', color: '#f87171', border: '1px solid #7f1d1d' }} onMouseEnter={e => (e.currentTarget.style.background = '#2a1010')} onMouseLeave={e => (e.currentTarget.style.background = '#1a0a0a')}>
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        </>}

        {/* Back */}
        <div className="flex justify-center">
          <Link
            to="/calculator"
            className="text-sm transition-colors flex items-center gap-2"
            style={{ color: '#8a8a8a' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#d4780f')}
            onMouseLeave={e => (e.currentTarget.style.color = '#8a8a8a')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Retour au calculateur
          </Link>
        </div>
      </main>

      <footer className="text-center py-4 text-xs" style={{ color: '#4a4a4a', borderTop: '1px solid #1a1a1a' }}>
        © SPINCUT - Interface d'administration
      </footer>
    </div>
  )
}
