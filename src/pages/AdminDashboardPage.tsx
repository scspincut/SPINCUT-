import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAdminAuth } from '../hooks/useAuth'

export default function AdminDashboardPage() {
  const { isAdmin, adminLogout } = useAdminAuth()
  const navigate = useNavigate()

  // Import BDC Abby
  const [bdcId, setBdcId] = useState('')
  const [bdcStatus, setBdcStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [bdcResult, setBdcResult] = useState<{ deducted: { ref: string; designation: string; quantity: number }[]; unmatched: string[] } | null>(null)
  const [bdcError, setBdcError] = useState('')

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
    if (!isAdmin) {
      navigate('/admin', { replace: true })
      return
    }
    fetch('/api/catalog').then(r => r.json()).then(d => { if (Array.isArray(d)) setCatalog(d) }).catch(() => {})
  }, [isAdmin, navigate])

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
          <p className="text-sm mt-1" style={{ color: '#8a8a8a' }}>
            Gestion du stock
          </p>
        </div>

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

        {/* Remise en stock */}
        <div className="rounded-xl p-5" style={{ background: '#161616', border: '1px solid #2a2a2a' }}>
          <h2 className="text-base font-semibold text-white mb-4">Remise en stock</h2>
          <p className="text-xs mb-3" style={{ color: '#8a8a8a' }}>À utiliser quand un BDC est annulé/supprimé dans Abby</p>
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
