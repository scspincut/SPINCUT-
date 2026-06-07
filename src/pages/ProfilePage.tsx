import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClientAuth, getClientCode } from '../hooks/useAuth'
import BottomNav from '../components/BottomNav'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { isAuthenticated, logout } = useClientAuth()

  const clientCode = getClientCode()
  const machineKey = `spincut_machine_${clientCode ?? 'guest'}`

  const saved = (() => { try { return JSON.parse(localStorage.getItem(machineKey) ?? '{}') } catch { return {} } })()

  const [nMax, setNMax] = useState<string>(saved.nMax ?? '')
  const [vfMax, setVfMax] = useState<string>(saved.vfMax ?? '')

  const save = (n: string, vf: string) => {
    try { localStorage.setItem(machineKey, JSON.stringify({ nMax: n, vfMax: vf })) } catch {}
  }

  if (!isAuthenticated) { navigate('/'); return null }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">

      <header className="sticky top-0 z-30 bg-black border-b border-[#1a1a1a]">
        <div className="max-w-2xl mx-auto px-4 py-2 relative flex items-center justify-center">
          <img
            src="/logo-banniere.png"
            alt="SPINCUT"
            style={{ height: '60px', objectFit: 'contain', mixBlendMode: 'screen', maskImage: 'radial-gradient(ellipse 95% 90% at 50% 50%, black 50%, transparent 100%)', WebkitMaskImage: 'radial-gradient(ellipse 95% 90% at 50% 50%, black 50%, transparent 100%)' }}
          />
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
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pb-36 pt-6">

        <div className="rounded-2xl bg-[#111] border border-[#1e1e1e] p-5 space-y-4">

          <div>
            <p className="text-white font-bold">Ma machine CNC</p>
            <p className="text-xs mt-1" style={{ color: '#555' }}>Pré-remplit automatiquement le calculateur.</p>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: '#555' }}>Vitesse broche max</p>
              <div className="relative">
                <input
                  type="number"
                  value={nMax}
                  onChange={e => { setNMax(e.target.value); save(e.target.value, vfMax) }}
                  placeholder="24000"
                  className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none placeholder-[#333]"
                  style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#555' }}>tr/min</span>
              </div>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: '#555' }}>Vitesse avance max</p>
              <div className="relative">
                <input
                  type="number"
                  value={vfMax}
                  onChange={e => { setVfMax(e.target.value); save(nMax, e.target.value) }}
                  placeholder="6000"
                  className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none placeholder-[#333]"
                  style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#555' }}>mm/min</span>
              </div>
            </div>
          </div>

          {(nMax || vfMax) && (
            <p className="text-xs text-center" style={{ color: '#4ade80' }}>✓ Enregistré — le calculateur utilise ces valeurs</p>
          )}

        </div>

      </main>

      <BottomNav />
    </div>
  )
}
