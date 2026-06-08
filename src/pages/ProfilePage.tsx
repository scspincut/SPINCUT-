import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClientAuth, getAccessCodes, saveAccessCodes, getClientCode, isTestMode } from '../hooks/useAuth'
import BottomNav from '../components/BottomNav'

const DEMO_PROFILE = {
  firstname: 'Jean', lastname: 'MARTIN',
  emails: ['jean.martin@entreprise.fr'], phone: '06 12 34 56 78',
  billingAddress: { address: '12 Rue des Artisans', complement: null, city: 'Lyon', zipCode: '69003', country: 'FR' },
}

interface AbbyAddress {
  address: string | null
  complement?: string | null
  city: string | null
  zipCode: string | null
  country: string
}

interface AbbyProfile {
  id: string
  orgId?: string | null
  firstname: string
  lastname: string
  emails: string[]
  phone: string
  billingAddress: AbbyAddress | null
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { isAuthenticated, logout } = useClientAuth()

  const clientCode = getClientCode()
  const clientInfo = clientCode ? getAccessCodes().find(c => c.code === clientCode) : null
  const clientName = clientInfo?.clientName ?? null

  const machineKey = `spincut_machine_${clientCode ?? 'guest'}`
  const savedMachine = (() => { try { return JSON.parse(localStorage.getItem(machineKey) ?? '{}') } catch { return {} } })()
  const [machineNMax, setMachineNMax] = useState<string>(savedMachine.nMax ?? '')
  const [machineVfMax, setMachineVfMax] = useState<string>(savedMachine.vfMax ?? '')
  const [machineAtc, setMachineAtc] = useState<string>(savedMachine.atcCapacity ? String(savedMachine.atcCapacity) : '')
  const saveMachine = (nMax: string, vfMax: string, atcCapacity: string) => {
    try { localStorage.setItem(machineKey, JSON.stringify({ nMax, vfMax, atcCapacity: atcCapacity ? parseInt(atcCapacity) : null })) } catch {}
  }

  const commPrefKey = `spincut_comm_pref_${clientCode ?? 'guest'}`
  const [commPref, setCommPref] = useState<'whatsapp' | 'email'>(() => {
    try { return (localStorage.getItem(`spincut_comm_pref_${clientCode ?? 'guest'}`) as 'whatsapp' | 'email') ?? 'whatsapp' } catch { return 'whatsapp' }
  })
  const saveCommPref = (pref: 'whatsapp' | 'email') => {
    setCommPref(pref)
    try { localStorage.setItem(commPrefKey, pref) } catch {}
  }

  const [showMailMenu, setShowMailMenu] = useState(false)
  const [manualName, setManualName] = useState('')
  const [manualNameError, setManualNameError] = useState('')

  const [profile, setProfile] = useState<AbbyProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveOk, setSaveOk] = useState(false)

  const [editFirstname, setEditFirstname] = useState('')
  const [editLastname, setEditLastname] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editAddr, setEditAddr] = useState('')
  const [editComplement, setEditComplement] = useState('')
  const [editCity, setEditCity] = useState('')
  const [editZip, setEditZip] = useState('')

  useEffect(() => {
    // Mode démo : charger données fictives sans appel Abby
    if (isTestMode()) {
      const d = DEMO_PROFILE
      setProfile({ id: 'demo', orgId: null, ...d })
      setEditFirstname(d.firstname); setEditLastname(d.lastname)
      setEditEmail(d.emails[0]); setEditPhone(d.phone)
      setEditAddr(d.billingAddress.address); setEditComplement('')
      setEditCity(d.billingAddress.city); setEditZip(d.billingAddress.zipCode)
      // Pré-remplir machine si vide
      if (!machineNMax && !machineVfMax) {
        setMachineNMax('24000'); setMachineVfMax('8000')
        if (!machineAtc) setMachineAtc('12')
        saveMachine('24000', '8000', '12')
      }
      return
    }
    if (!clientName) return
    setProfileLoading(true)
    fetch(`/api/client-profile?clientName=${encodeURIComponent(clientName)}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setProfileError(data.error); return }
        setProfile(data)
        setEditFirstname(data.firstname ?? '')
        setEditLastname(data.lastname ?? '')
        setEditEmail(data.emails?.[0] ?? '')
        setEditPhone(data.phone ?? '')
        setEditAddr(data.billingAddress?.address ?? '')
        setEditComplement(data.billingAddress?.complement ?? '')
        setEditCity(data.billingAddress?.city ?? '')
        setEditZip(data.billingAddress?.zipCode ?? '')
      })
      .catch(() => setProfileError('Impossible de charger le profil'))
      .finally(() => setProfileLoading(false))
  }, [clientName])

  const startEdit = () => { setSaveOk(false); setEditing(true) }
  const cancelEdit = () => {
    if (!profile) return
    setEditFirstname(profile.firstname ?? '')
    setEditLastname(profile.lastname ?? '')
    setEditEmail(profile.emails?.[0] ?? '')
    setEditPhone(profile.phone ?? '')
    setEditAddr(profile.billingAddress?.address ?? '')
    setEditComplement(profile.billingAddress?.complement ?? '')
    setEditCity(profile.billingAddress?.city ?? '')
    setEditZip(profile.billingAddress?.zipCode ?? '')
    setEditing(false)
  }

  const saveProfile = async () => {
    if (!profile) return
    setSaving(true)
    try {
      const res = await fetch('/api/client-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: profile.id,
          orgId: profile.orgId ?? undefined,
          firstname: editFirstname || undefined,
          lastname: editLastname || undefined,
          emails: editEmail ? [editEmail] : profile.emails,
          phone: editPhone || undefined,
          billingAddress: {
            address: editAddr || null,
            complement: editComplement || null,
            city: editCity || null,
            zipCode: editZip || null,
            country: profile.billingAddress?.country ?? 'FR',
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur serveur')
      setProfile(prev => prev ? {
        ...prev,
        firstname: editFirstname || prev.firstname,
        lastname: editLastname || prev.lastname,
        emails: editEmail ? [editEmail] : prev.emails,
        phone: editPhone,
        billingAddress: { address: editAddr || null, complement: editComplement || null, city: editCity || null, zipCode: editZip || null, country: prev.billingAddress?.country ?? 'FR' },
      } : prev)
      setEditing(false)
      setSaveOk(true)
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setSaving(false)
    }
  }

  if (!isAuthenticated) { navigate('/'); return null }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">

      <header className="sticky top-0 z-30 bg-black border-b border-[#1a1a1a]">
        <div className="max-w-2xl mx-auto px-4 py-2 relative flex items-center justify-center">
          <img src="/logo-banniere.png" alt="SPINCUT" style={{ height: '60px', objectFit: 'contain', mixBlendMode: 'screen', maskImage: 'radial-gradient(ellipse 95% 90% at 50% 50%, black 50%, transparent 100%)', WebkitMaskImage: 'radial-gradient(ellipse 95% 90% at 50% 50%, black 50%, transparent 100%)' }} />
          <button onClick={() => { logout(); navigate('/') }} className="absolute right-4 flex items-center gap-1 text-[#555] hover:text-white text-xs transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            Déconnexion
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pb-36 pt-6 space-y-4">

        {/* Identity card */}
        <div className="rounded-2xl bg-[#161616] border border-[#2a2a2a] p-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#2a1400', border: '2px solid rgba(212,120,15,0.2)' }}>
              <svg className="w-7 h-7 text-[#d4780f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-lg">{clientName ?? 'Client SPINCUT'}</p>
              <p className="text-[#555] text-sm font-mono mt-0.5">Code : {clientCode ?? '—'}</p>
            </div>
          </div>
        </div>

        {/* Mes informations */}
        <div className="rounded-2xl bg-[#161616] border border-[#2a2a2a] overflow-hidden">
          <div className="px-4 pt-4 pb-3 flex items-center justify-between">
            <p className="text-white font-bold text-sm">Mes informations</p>
            {!editing && !profileLoading && profile && (
              <button onClick={startEdit} className="text-xs text-[#d4780f] border border-[#d4780f]/30 px-2.5 py-1 rounded-lg hover:bg-[#d4780f]/10 transition-colors">
                Modifier
              </button>
            )}
          </div>

          {!clientName && !profileLoading && !profile && (
            <div className="px-4 pb-4 space-y-2">
              <p className="text-xs" style={{ color: '#888' }}>Saisissez votre nom tel qu'il apparaît dans votre compte Abby pour charger vos informations.</p>
              <div className="flex gap-2">
                <input
                  value={manualName}
                  onChange={e => { setManualName(e.target.value); setManualNameError('') }}
                  placeholder="Votre nom complet"
                  className="flex-1 bg-[#1e1e1e] border border-[#2a2a2a] text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#d4780f] placeholder-[#444]"
                />
                <button
                  onClick={() => {
                    if (!manualName.trim()) { setManualNameError('Nom requis'); return }
                    const codes = getAccessCodes()
                    if (clientCode) {
                      saveAccessCodes(codes.map(c => c.code === clientCode ? { ...c, clientName: manualName.trim() } : c))
                      window.location.reload()
                    }
                  }}
                  className="px-4 py-2.5 rounded-lg text-sm font-bold text-white"
                  style={{ background: '#d4780f' }}
                >OK</button>
              </div>
              {manualNameError && <p className="text-xs text-red-400">{manualNameError}</p>}
            </div>
          )}

          {profileLoading && (
            <div className="px-4 pb-5 flex items-center gap-2 text-[#444] text-sm">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
              Chargement…
            </div>
          )}

          {profileError && !profileLoading && (
            <p className="px-4 pb-4 text-red-400 text-xs">{profileError}</p>
          )}

          {saveOk && (
            <p className="px-4 pb-2 text-green-400 text-xs">✓ Informations mises à jour</p>
          )}

          {profile && !editing && (
            <div className="px-4 pb-4 space-y-3">
              {profile.orgId ? (
                <InfoRow label="Raison sociale" value={profile.lastname || '—'} />
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <InfoRow label="Prénom" value={profile.firstname || '—'} />
                  <InfoRow label="Nom" value={profile.lastname || '—'} />
                </div>
              )}
              <InfoRow label="Email" value={profile.emails?.[0] || '—'} />
              <InfoRow label="Téléphone" value={profile.phone || '—'} />
              {profile.billingAddress && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: '#555' }}>Adresse</p>
                  <p className="text-white text-sm">{profile.billingAddress.address || '—'}</p>
                  {profile.billingAddress.complement && <p className="text-[#888] text-xs">{profile.billingAddress.complement}</p>}
                  <p className="text-[#888] text-xs mt-0.5">{[profile.billingAddress.zipCode, profile.billingAddress.city].filter(Boolean).join(' ')}</p>
                </div>
              )}
              {!profile.billingAddress && <InfoRow label="Adresse" value="—" />}
            </div>
          )}

          {profile && editing && (
            <div className="px-4 pb-4 space-y-3">
              {profile.orgId ? (
                <EditField label="Raison sociale" value={editLastname} onChange={setEditLastname} placeholder="MENU DU BOIS" />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <EditField label="Prénom" value={editFirstname} onChange={setEditFirstname} placeholder="Ibrahim" />
                  <EditField label="Nom" value={editLastname} onChange={setEditLastname} placeholder="TAMEGA" />
                </div>
              )}
              <EditField label="Email" value={editEmail} onChange={setEditEmail} type="email" placeholder="exemple@email.com" />
              <EditField label="Téléphone" value={editPhone} onChange={setEditPhone} type="tel" placeholder="06 XX XX XX XX" />
              <div>
                <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: '#555' }}>Adresse</p>
                <div className="space-y-2">
                  <EditField label="Rue / N°" value={editAddr} onChange={setEditAddr} placeholder="12 rue de la Forêt" />
                  <EditField label="Complément" value={editComplement} onChange={setEditComplement} placeholder="Bâtiment, étage… (optionnel)" />
                  <div className="grid grid-cols-2 gap-2">
                    <EditField label="Code postal" value={editZip} onChange={setEditZip} placeholder="75000" />
                    <EditField label="Ville" value={editCity} onChange={setEditCity} placeholder="Paris" />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={cancelEdit} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-[#555] bg-[#1e1e1e] border border-[#2a2a2a] hover:text-white transition-colors">
                  Annuler
                </button>
                <button onClick={saveProfile} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-60" style={{ background: '#d4780f' }}>
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Ma machine */}
        <div className="rounded-2xl bg-[#161616] border border-[#2a2a2a] p-4 space-y-3">
          <div>
            <p className="text-white font-bold text-sm">Ma machine</p>
            <p className="text-xs mt-0.5" style={{ color: '#555' }}>Pré-remplit automatiquement le calculateur.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: '#555' }}>Vitesse broche max</p>
              <div className="relative">
                <input
                  type="number"
                  value={machineNMax}
                  onChange={e => { setMachineNMax(e.target.value); saveMachine(e.target.value, machineVfMax, machineAtc) }}
                  placeholder="24000"
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none placeholder-[#444]"
                  style={{ background: '#1e1e1e', border: '1px solid #2a2a2a' }}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px]" style={{ color: '#555' }}>tr/min</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: '#555' }}>Vitesse avance max</p>
              <div className="relative">
                <input
                  type="number"
                  value={machineVfMax}
                  onChange={e => { setMachineVfMax(e.target.value); saveMachine(machineNMax, e.target.value, machineAtc) }}
                  placeholder="6000"
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none placeholder-[#444]"
                  style={{ background: '#1e1e1e', border: '1px solid #2a2a2a' }}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px]" style={{ color: '#555' }}>mm/min</span>
              </div>
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: '#555' }}>Postes magasin</p>
            <div className="relative">
              <input
                type="number"
                value={machineAtc}
                onChange={e => { setMachineAtc(e.target.value); saveMachine(machineNMax, machineVfMax, e.target.value) }}
                placeholder="12"
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none placeholder-[#444]"
                style={{ background: '#1e1e1e', border: '1px solid #2a2a2a' }}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px]" style={{ color: '#555' }}>postes ATC</span>
            </div>
            <p className="text-[10px] mt-1.5" style={{ color: '#444' }}>Permet de suivre les outils montés dans Mon Stock</p>
          </div>
          {(machineNMax || machineVfMax || machineAtc) && (
            <p className="text-[10px] text-center" style={{ color: '#2a8a2a' }}>✓ Enregistré — le calculateur utilise ces valeurs</p>
          )}
        </div>

        {/* Canal de communication préféré */}
        <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] p-4">
          <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: '#555' }}>Canal de communication préféré</p>
          <p className="text-xs mb-3" style={{ color: '#666' }}>Comment souhaitez-vous être contacté par SPINCUT ?</p>
          <div className="flex gap-2">
            <button
              onClick={() => saveCommPref('whatsapp')}
              className="flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{
                background: commPref === 'whatsapp' ? '#1a5e1a' : '#1a1a1a',
                border: commPref === 'whatsapp' ? '1.5px solid #2a8a2a' : '1.5px solid #2a2a2a',
                color: commPref === 'whatsapp' ? '#4ade80' : '#555',
              }}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </button>
            <button
              onClick={() => saveCommPref('email')}
              className="flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{
                background: commPref === 'email' ? '#1a1a3a' : '#1a1a1a',
                border: commPref === 'email' ? '1.5px solid #2a2a8a' : '1.5px solid #2a2a2a',
                color: commPref === 'email' ? '#60a5fa' : '#555',
              }}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/>
              </svg>
              Email
            </button>
          </div>
          {commPref === 'whatsapp' && (
            <p className="text-[10px] mt-2 text-center" style={{ color: '#2a8a2a' }}>✓ SPINCUT vous contactera sur WhatsApp</p>
          )}
          {commPref === 'email' && (
            <p className="text-[10px] mt-2 text-center" style={{ color: '#60a5fa' }}>✓ SPINCUT vous contactera par email</p>
          )}
        </div>

      </main>

      {/* Mail app chooser */}
      {showMailMenu && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.75)' }}
          onClick={() => setShowMailMenu(false)}
        >
          <div
            className="w-full max-w-sm rounded-t-2xl p-5 space-y-3"
            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
            onClick={e => e.stopPropagation()}
          >
            <p className="text-center text-xs tracking-widest uppercase mb-4" style={{ color: '#888' }}>
              Envoyer un email à SPINCUT
            </p>
            <a
              href={`mailto:scspincut@gmail.com?subject=${encodeURIComponent('Message client SPINCUT')}`}
              className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl text-sm font-medium text-white"
              style={{ background: '#2a2a2a' }}
              onClick={() => setShowMailMenu(false)}
            >
              <span className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: '#1C8EF9' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M22 8.608v8.142a3.25 3.25 0 0 1-3.066 3.245L18.75 20H5.25a3.25 3.25 0 0 1-3.245-3.066L2 16.75V8.608l9.652 5.056a.75.75 0 0 0 .696 0zM5.25 4h13.5a3.25 3.25 0 0 1 3.234 2.924L12 12.154l-9.984-5.23A3.25 3.25 0 0 1 5.25 4z"/></svg>
              </span>
              <span>
                <span className="block font-semibold">Apple Mail</span>
                <span className="block text-xs" style={{ color: '#888' }}>Application Mail par défaut</span>
              </span>
            </a>
            <a
              href={`https://mail.google.com/mail/?view=cm&fs=1&to=scspincut@gmail.com&su=${encodeURIComponent('Message client SPINCUT')}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl text-sm font-medium text-white"
              style={{ background: '#2a2a2a' }}
              onClick={() => setShowMailMenu(false)}
            >
              <span className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'white' }}>
                <svg width="28" height="28" viewBox="0 0 256 256">
                  <path fill="#4285f4" d="M58.182 192.05V93.14L27.507 65.077L0 49.504v125.091c0 9.658 7.825 17.455 17.455 17.455z"/>
                  <path fill="#34a853" d="M197.818 192.05h40.727c9.659 0 17.455-7.826 17.455-17.455V49.505l-31.156 17.837l-27.026 25.798z"/>
                  <path fill="#ea4335" d="m58.182 93.14l-4.174-38.647l4.174-36.989L128 69.868l69.818-52.364l4.669 34.992l-4.669 40.644L128 145.504z"/>
                  <path fill="#fbbc04" d="M197.818 17.504V93.14L256 49.504V26.231c0-21.585-24.64-33.89-41.89-20.945z"/>
                  <path fill="#c5221f" d="m0 49.504l26.759 20.07L58.182 93.14V17.504L41.89 5.286C24.61-7.66 0 4.646 0 26.23z"/>
                </svg>
              </span>
              <span>
                <span className="block font-semibold">Gmail</span>
                <span className="block text-xs" style={{ color: '#888' }}>Ouvre Gmail dans le navigateur</span>
              </span>
            </a>
            <a
              href={`https://outlook.live.com/mail/0/deeplink/compose?to=scspincut@gmail.com&subject=${encodeURIComponent('Message client SPINCUT')}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl text-sm font-medium text-white"
              style={{ background: '#2a2a2a' }}
              onClick={() => setShowMailMenu(false)}
            >
              <span className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'white' }}>
                <svg width="28" height="28" viewBox="0 0 32 32">
                  <path fill="#0072c6" d="M19.484 7.937v5.477l1.916 1.205a.5.5 0 0 0 .21 0l8.238-5.554a1.174 1.174 0 0 0-.959-1.128Z"/>
                  <path fill="#0072c6" d="m19.484 15.457l1.747 1.2a.52.52 0 0 0 .543 0c-.3.181 8.073-5.378 8.073-5.378v10.066a1.408 1.408 0 0 1-1.49 1.555h-8.874zm-9.044-2.525a1.61 1.61 0 0 0-1.42.838a4.13 4.13 0 0 0-.526 2.218A4.05 4.05 0 0 0 9.02 18.2a1.6 1.6 0 0 0 2.771.022a4 4 0 0 0 .515-2.2a4.37 4.37 0 0 0-.5-2.281a1.54 1.54 0 0 0-1.366-.809"/>
                  <path fill="#0072c6" d="M2.153 5.155v21.427L18.453 30V2Zm10.908 14.336a3.23 3.23 0 0 1-2.7 1.361a3.19 3.19 0 0 1-2.64-1.318A5.46 5.46 0 0 1 6.706 16.1a5.87 5.87 0 0 1 1.036-3.616a3.27 3.27 0 0 1 2.744-1.384a3.12 3.12 0 0 1 2.61 1.321a5.64 5.64 0 0 1 1 3.484a5.76 5.76 0 0 1-1.035 3.586"/>
                </svg>
              </span>
              <span>
                <span className="block font-semibold">Outlook</span>
                <span className="block text-xs" style={{ color: '#888' }}>Ouvre Outlook dans le navigateur</span>
              </span>
            </a>
            <a
              href="mailto:scspincut@gmail.com"
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

      <BottomNav />
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: '#555' }}>{label}</p>
      <p className="text-white text-sm">{value}</p>
    </div>
  )
}

function EditField({ label, value, onChange, type = 'text', placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#555' }}>{label}</p>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-[#1e1e1e] border border-[#2a2a2a] text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#d4780f] placeholder-[#444]"
      />
    </div>
  )
}
