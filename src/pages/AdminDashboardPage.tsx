import { useState, useEffect, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAdminAuth, getAccessCodes, saveAccessCodes } from '../hooks/useAuth'
import { AccessCode } from '../types'
import SpincutLogo from '../components/SpincutLogo'

function generateCode(name: string, existing: string[]): string {
  const clean = name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8)
  if (clean.length >= 4 && !existing.includes(clean)) return clean
  for (let i = 2; i <= 99; i++) {
    const candidate = clean.slice(0, 6) + i
    if (!existing.includes(candidate)) return candidate
  }
  return clean + Date.now().toString().slice(-3)
}

export default function AdminDashboardPage() {
  const { isAdmin, adminLogout } = useAdminAuth()
  const navigate = useNavigate()
  const [codes, setCodes] = useState<AccessCode[]>([])
  const [newCode, setNewCode] = useState('')
  const [newClientName, setNewClientName] = useState('')
  const [newClientPhone, setNewClientPhone] = useState('')
  const [createError, setCreateError] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [importMsg, setImportMsg] = useState('')

  const copyLink = (code: string) => {
    const url = `${window.location.origin}/?activate=${code}`
    navigator.clipboard.writeText(url)
    setCopiedId(code)
    setTimeout(() => setCopiedId(null), 2000)
  }

  useEffect(() => {
    if (!isAdmin) {
      navigate('/admin', { replace: true })
      return
    }
    setCodes(getAccessCodes())
  }, [isAdmin, navigate])

  const refreshCodes = () => setCodes(getAccessCodes())

  const handleCreate = (e: FormEvent) => {
    e.preventDefault()
    setCreateError('')
    const normalized = newCode.trim().toUpperCase()
    if (!normalized) {
      setCreateError('Veuillez saisir un code.')
      return
    }
    if (normalized.length < 4) {
      setCreateError('Le code doit contenir au moins 4 caractères.')
      return
    }
    const existing = getAccessCodes()
    if (existing.some(c => c.code === normalized)) {
      setCreateError('Ce code existe déjà.')
      return
    }
    const now = new Date()
    const day = String(now.getDate()).padStart(2, '0')
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const year = now.getFullYear()
    const newEntry: AccessCode = {
      id: Date.now().toString(),
      code: normalized,
      active: true,
      createdAt: `${day}/${month}/${year}`,
      clientName: newClientName.trim() || undefined,
      clientPhone: newClientPhone.trim() || undefined,
    }
    const updated = [...existing, newEntry]
    saveAccessCodes(updated)
    setCodes(updated)
    setNewCode('')
    setNewClientName('')
    setNewClientPhone('')
  }

  const toggleActive = (id: string) => {
    const updated = codes.map(c => c.id === id ? { ...c, active: !c.active } : c)
    saveAccessCodes(updated)
    setCodes(updated)
  }

  const deleteCode = (id: string) => {
    const updated = codes.filter(c => c.id !== id)
    saveAccessCodes(updated)
    setCodes(updated)
  }

  const importFromAbby = async () => {
    setImportStatus('loading')
    setImportMsg('')
    try {
      const res = await fetch('/api/abby-clients')
      if (!res.ok) throw new Error((await res.json()).error ?? 'Erreur serveur')
      const clients: { id: string; name: string; phone?: string }[] = await res.json()
      const existing = getAccessCodes()
      const existingNames = existing.map(c => c.clientName?.toLowerCase())
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
        setImportMsg('Tous les clients Abby ont déjà un code.')
      } else {
        const updated = [...existing, ...toAdd]
        saveAccessCodes(updated)
        setCodes(updated)
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
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
        style={{ background: '#161616', borderBottom: '1px solid #2a2a2a' }}
      >
        <div className="flex items-center gap-3">
          <SpincutLogo size="sm" />
          <span
            className="text-xs font-bold px-2 py-1 rounded"
            style={{ background: '#2a1400', color: '#d4780f', border: '1px solid #d4780f33' }}
          >
            Admin
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm px-4 py-2 rounded-lg transition-colors font-medium"
          style={{ background: '#1e1e1e', color: '#f1f1f1', border: '1px solid #2a2a2a' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#2a2a2a')}
          onMouseLeave={e => (e.currentTarget.style.background = '#1e1e1e')}
        >
          Déconnexion
        </button>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-white">Gestion des codes d'accès</h1>
          <p className="text-sm mt-1" style={{ color: '#8a8a8a' }}>
            Créez et gérez les codes d'accès pour vos clients
          </p>
        </div>

        {/* Create card */}
        <div
          className="rounded-xl p-5"
          style={{ background: '#161616', border: '1px solid #2a2a2a' }}
        >
          <h2 className="text-base font-semibold text-white mb-4">Créer un nouveau code client</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="flex gap-3">
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

        {/* Codes list card */}
        <div
          className="rounded-xl p-5"
          style={{ background: '#161616', border: '1px solid #2a2a2a' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">
              Codes d'accès{' '}
              <span
                className="text-sm font-normal px-2 py-0.5 rounded ml-1"
                style={{ background: '#1e1e1e', color: '#8a8a8a' }}
              >
                {codes.length}
              </span>
            </h2>
            <button
              onClick={refreshCodes}
              className="text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
              style={{ background: '#1e1e1e', color: '#8a8a8a', border: '1px solid #2a2a2a' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f1f1f1')}
              onMouseLeave={e => (e.currentTarget.style.color = '#8a8a8a')}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polyline points="23 4 23 10 17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="1 20 1 14 7 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Actualiser
            </button>
          </div>

          {codes.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: '#8a8a8a' }}>
              Aucun code créé pour l'instant.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid #2a2a2a' }}>
                    <th className="text-left pb-3 font-medium" style={{ color: '#8a8a8a' }}>Code</th>
                    <th className="text-left pb-3 font-medium" style={{ color: '#8a8a8a' }}>Client</th>
                    <th className="text-left pb-3 font-medium" style={{ color: '#8a8a8a' }}>Statut</th>
                    <th className="text-left pb-3 font-medium" style={{ color: '#8a8a8a' }}>Créé le</th>
                    <th className="text-right pb-3 font-medium" style={{ color: '#8a8a8a' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                      <td className="py-3 pr-4">
                        <span className="font-mono font-semibold text-white tracking-wider">{c.code}</span>
                      </td>
                      <td className="py-3 pr-4">
                        {c.clientName
                          ? <div>
                              <p className="text-white text-xs font-medium">{c.clientName}</p>
                              {c.clientPhone && <p className="text-xs" style={{ color: '#8a8a8a' }}>{c.clientPhone}</p>}
                            </div>
                          : <span className="text-xs" style={{ color: '#3a3a3a' }}>—</span>
                        }
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded"
                          style={
                            c.active
                              ? { background: '#0a1f0a', color: '#4ade80', border: '1px solid #166534' }
                              : { background: '#1a0a0a', color: '#f87171', border: '1px solid #7f1d1d' }
                          }
                        >
                          {c.active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="py-3 pr-4" style={{ color: '#8a8a8a' }}>{c.createdAt}</td>
                      <td className="py-3">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          <button
                            onClick={() => copyLink(c.code)}
                            className="text-xs px-3 py-1 rounded transition-colors"
                            style={{ background: '#0a1628', color: copiedId === c.code ? '#4ade80' : '#60a5fa', border: `1px solid ${copiedId === c.code ? '#166534' : '#1e3a5f'}` }}
                          >
                            {copiedId === c.code ? '✓ Copié !' : '🔗 Lien client'}
                          </button>
                          <button
                            onClick={() => toggleActive(c.id)}
                            className="text-xs px-3 py-1 rounded transition-colors"
                            style={{
                              background: '#1e1e1e',
                              color: c.active ? '#f59e0b' : '#4ade80',
                              border: '1px solid #2a2a2a',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#2a2a2a')}
                            onMouseLeave={e => (e.currentTarget.style.background = '#1e1e1e')}
                          >
                            {c.active ? 'Désactiver' : 'Activer'}
                          </button>
                          <button
                            onClick={() => deleteCode(c.id)}
                            className="text-xs px-3 py-1 rounded transition-colors"
                            style={{ background: '#1a0a0a', color: '#f87171', border: '1px solid #7f1d1d' }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#2a1010')}
                            onMouseLeave={e => (e.currentTarget.style.background = '#1a0a0a')}
                          >
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

        {/* Back to calculator */}
        <div className="flex justify-center">
          <Link
            to="/calculator"
            className="text-sm transition-colors flex items-center gap-2"
            style={{ color: '#8a8a8a' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#d4780f')}
            onMouseLeave={e => (e.currentTarget.style.color = '#8a8a8a')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Retour au calculateur
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs" style={{ color: '#4a4a4a', borderTop: '1px solid #1a1a1a' }}>
        © SPINCUT - Interface d'administration
      </footer>
    </div>
  )
}
