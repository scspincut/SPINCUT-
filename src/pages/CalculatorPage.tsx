import { useState, useMemo, useEffect } from 'react';

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
import { useNavigate, Link } from 'react-router-dom';
import { CalculatorParams, ToolNotation } from '../types';
import { calculate } from '../utils/calculations';
import {
  TOOL_TYPE_LABELS, MATERIAL_LABELS, OPERATION_LABELS,
  TOOL_MATERIALS, DIAMETER_OPTIONS, TEETH_OPTIONS,
  CONSEILS_OUTIL, CONSEILS_MATIERE, DIAGNOSTIC,
} from '../utils/cncData';
import BottomNav from '../components/BottomNav';
import { useClientAuth, getClientCode } from '../hooks/useAuth';
import { HistoryEntry, loadHistory, pushToHistory, groupByDay } from '../utils/history';

interface CatalogProduct {
  sheet: string; row: number; ref: string; famille: string
  diametre: string; lc: string; lt: string; dents: string
  angle: string; queue: string; sens: string
  prix: number; stock: number; pm: boolean; category: string; designation: string
}

function parseDents(s: string): number {
  const n = parseInt(s, 10)
  return isNaN(n) ? 99 : n
}

function parseLc(s: string): number {
  const n = parseFloat(s)
  return isNaN(n) ? 0 : n
}

function getRecommendations(products: CatalogProduct[], material: string, lcMin: number | null, operation: string | null): CatalogProduct[] {
  // Gravure → uniquement les fraises gravure
  if (operation === 'gravure') {
    let recs = products.filter(p => p.category === 'gravure')
    if (lcMin !== null && lcMin > 0) recs = recs.filter(p => parseLc(p.lc) >= lcMin)
    recs.sort((a, b) => (a.stock > 0 ? 0 : 1) - (b.stock > 0 ? 0 : 1) || parseFloat(a.diametre) - parseFloat(b.diametre))
    return recs
  }

  type Filter = (p: CatalogProduct) => boolean
  const rules: Record<string, Filter> = {
    melamine:      p => p.category === 'compression' || p.category === 'diamant',
    mdf:           p => p.category === 'classique' && !p.pm && parseDents(p.dents) <= 2,
    ctp:           p => ['classique', 'compression', 'diamant'].includes(p.category) && !p.pm,
    bois_tendre:   p => (p.category === 'classique' && !p.pm && parseDents(p.dents) === 2) || p.category === 'ravageuse',
    bois_dur:      p => (p.category === 'classique' && !p.pm) || p.category === 'ravageuse',
    bois_exotique: p => (p.category === 'classique' && !p.pm) || p.category === 'diamant',
    alu_2017:      p => p.category === 'alu' || (p.category === 'classique' && p.pm),
    alu_6060:      p => p.category === 'alu' || (p.category === 'classique' && p.pm),
    alu_coule:     p => p.category === 'alu' || (p.category === 'classique' && p.pm),
    pvc:           p => p.category === 'classique' && (p.pm || parseDents(p.dents) === 1),
    pmma:          p => p.category === 'classique' && (p.pm || parseDents(p.dents) === 1),
    polycarbonate: p => p.category === 'classique' && (p.pm || parseDents(p.dents) === 1),
    nylon_pa:      p => p.category === 'classique',
  }
  const rule = rules[material]
  if (!rule) return []
  // Exclure les fraises gravure des recommandations standard
  let recs = products.filter(p => p.category !== 'gravure' && rule(p))
  if (lcMin !== null && lcMin > 0) recs = recs.filter(p => parseLc(p.lc) >= lcMin)
  recs.sort((a, b) => {
    const aOk = a.stock > 0 ? 0 : 1
    const bOk = b.stock > 0 ? 0 : 1
    if (aOk !== bOk) return aOk - bOk
    return parseFloat(a.diametre) - parseFloat(b.diametre)
  })
  return recs
}

const SEL = "w-full bg-[#1e1e1e] border border-[#2a2a2a] text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#d4780f] appearance-none cursor-pointer";
const INP = "w-full bg-[#1e1e1e] border border-[#2a2a2a] text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#d4780f] placeholder-[#555]";
const LBL = "block text-sm text-[#aaa] mb-1.5";

function SelectField({ label, value, onChange, children, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  children: React.ReactNode; hint?: string;
}) {
  return (
    <div>
      <label className={LBL}>{label}{hint && <span className="text-[#d4780f] text-xs ml-1">({hint})</span>}</label>
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)} className={SEL}>
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          <svg className="w-4 h-4 text-[#555]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange, placeholder, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; hint?: string;
}) {
  return (
    <div>
      <label className={LBL}>
        {label}
        {hint && <span className="text-[#555] text-xs ml-1">({hint})</span>}
      </label>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={INP}
        min={0}
      />
    </div>
  );
}

function ResultCard({ label, value, unit, sub, badge }: {
  label: string; value: string; unit: string; sub?: string; badge?: string;
}) {
  return (
    <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#2a2a2a]">
      <p className="text-[#888] text-xs mb-1">{label}</p>
      <p className="text-[#d4780f] font-bold text-2xl">{value}</p>
      <p className="text-[#666] text-xs mt-0.5">{unit}</p>
      {badge && <span className="inline-block mt-1 bg-[#3a1e00] text-[#f59e0b] text-xs px-2 py-0.5 rounded-full">{badge}</span>}
      {sub && !badge && <p className="text-[#555] text-xs mt-1">{sub}</p>}
    </div>
  );
}

function BigResultCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="bg-[#1a1a1a] rounded-xl p-5 border border-[#2a2a2a] text-center flex-1">
      <p className="text-[#888] text-sm mb-2">{label}</p>
      <p className="text-[#d4780f] font-bold text-4xl">{value}</p>
      <p className="text-[#666] text-sm mt-1">{unit}</p>
    </div>
  );
}

export default function CalculatorPage() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useClientAuth();
  const isAdmin = localStorage.getItem('spincut_admin_session') === 'true';

  const CALC_KEY = 'spincut_calc_params'
  const saved = (() => { try { return JSON.parse(localStorage.getItem(CALC_KEY) ?? '{}') } catch { return {} } })()

  // All hooks must be called unconditionally before any early return
  const [toolType, setToolType] = useState<CalculatorParams['toolType'] | null>(saved.toolType ?? null);
  const [notation, setNotation] = useState<ToolNotation>(saved.notation ?? '2+2');
  const [material, setMaterial] = useState<CalculatorParams['material'] | null>(saved.material ?? null);
  const [operation, setOperation] = useState<CalculatorParams['operation'] | null>(saved.operation ?? null);
  const [diameter, setDiameter] = useState<number | null>(saved.diameter ?? null);
  const [zTeeth, setZTeeth] = useState<number | null>(saved.zTeeth ?? null);
  const [nMax, setNMax] = useState(saved.nMax ?? '');
  const [vfMax, setVfMax] = useState(saved.vfMax ?? '');
  const [thickness, setThickness] = useState(saved.thickness ?? '');
  const [showConseils, setShowConseils] = useState(false);
  const [showDiag, setShowDiag] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory());
  const [savedThisCalc, setSavedThisCalc] = useState(false);
  const [showMailMenu, setShowMailMenu] = useState(false);
  const [showGlossaire, setShowGlossaire] = useState(false);
  const [catalog, setCatalog] = useState<CatalogProduct[]>([])
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem(`spincut_cart_${getClientCode() ?? 'guest'}`) ?? '{}') } catch { return {} }
  })

  const cartCount = Object.values(quantities).reduce((s, v) => s + v, 0)
  const cartTotal = useMemo(() => catalog.reduce((s, p) => s + (quantities[`${p.ref}__${p.row}`] || 0) * p.prix, 0), [catalog, quantities])

  const setQty = (id: string, delta: number, max: number) => {
    setQuantities(prev => {
      const next = { ...prev, [id]: Math.min(max, Math.max(0, (prev[id] || 0) + delta)) }
      if (next[id] === 0) delete next[id]
      try { localStorage.setItem(`spincut_cart_${getClientCode() ?? 'guest'}`, JSON.stringify(next)) } catch {}
      return next
    })
  }

  // Derived values needed by useMemo below
  const availableMaterials = toolType ? TOOL_MATERIALS[toolType] : [];
  const safeMat = toolType && material && availableMaterials.includes(material) ? material : null;

  const availDiams = toolType ? DIAMETER_OPTIONS.filter(d => {
    if (toolType === 'ravageuse') return d >= 6;
    if (toolType === 'hss') return d >= 3 && d <= 12;
    if (toolType === 'diamant_coupe' || toolType === 'compression') return d >= 3;
    return true;
  }) : [];
  const safeDiam = diameter && availDiams.includes(diameter) ? diameter : null;

  // For compression/diamant, zTeeth is derived from notation; for others it's explicit
  const isCompDiam = toolType === 'diamant_coupe' || toolType === 'compression';
  const effectiveZTeeth = isCompDiam
    ? (notation === '1+1' ? 2 : notation === '2+2' ? 4 : 6)
    : (zTeeth ?? 2);

  const isReady = toolType !== null && safeMat !== null && operation !== null && safeDiam !== null &&
    (isCompDiam || zTeeth !== null);

  const params: CalculatorParams | null = isReady ? {
    toolType: toolType!,
    notation,
    material: safeMat!,
    operation: operation!,
    diameter: safeDiam!,
    zTeeth: effectiveZTeeth,
    machineType: 'pro_portique',
    coating: 'none',
    nMax: nMax ? parseFloat(nMax) : null,
    vfMax: vfMax ? parseFloat(vfMax) : null,
    materialThickness: thickness ? parseFloat(thickness) : null,
    apOverride: null,
  } : null;

  // useMemo + useEffect MUST stay above the auth guard (Rules of Hooks)
  const result = useMemo(() => params ? calculate(params) : null, [
    toolType, notation, safeMat, operation, safeDiam, zTeeth,
    nMax, vfMax, thickness,
  ]);

  useEffect(() => { setSavedThisCalc(false); }, [result]);

  useEffect(() => {
    fetch('/api/catalog')
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setCatalog(data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(CALC_KEY, JSON.stringify({ toolType, notation, material, operation, diameter, zTeeth, nMax, vfMax, thickness }))
    } catch {}
  }, [toolType, notation, material, operation, diameter, zTeeth, nMax, vfMax, thickness])

  const recommendations = useMemo(() => {
    if (catalog.length === 0 || !result || result.forbidden || !safeMat) return []
    const lcMin = thickness ? parseFloat(thickness) : null
    return getRecommendations(catalog, safeMat, lcMin !== null && !isNaN(lcMin) ? lcMin : null, operation)
  }, [catalog, safeMat, thickness, result, operation])

  // Auth guard — after every hook
  if (!isAuthenticated) {
    navigate('/');
    return null;
  }

  localStorage.setItem('spincut_last_section', '/calculator')

  const handleSave = () => {
    if (!result || result.forbidden || !safeMat || !operation || !safeDiam) return;
    const entry: HistoryEntry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      params: { toolType: toolType!, notation, material: safeMat, operation, diameter: safeDiam, zTeeth: effectiveZTeeth, nMax, vfMax, thickness },
      result: { n: result.n, vf: result.vf, vc: result.vc },
    };
    setHistory(pushToHistory(entry));
    setSavedThisCalc(true);
  };

  const reloadEntry = (entry: HistoryEntry) => {
    setToolType(entry.params.toolType);
    setNotation(entry.params.notation);
    setMaterial(entry.params.material);
    setOperation(entry.params.operation);
    setDiameter(entry.params.diameter);
    setZTeeth(entry.params.zTeeth);
    setNMax(entry.params.nMax);
    setVfMax(entry.params.vfMax);
    setThickness(entry.params.thickness);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToolChange = (t: string) => {
    if (!t) { setToolType(null); return; }
    const tt = t as CalculatorParams['toolType'];
    setToolType(tt);
    if (material && !TOOL_MATERIALS[tt].includes(material)) setMaterial(null);
    if (!isCompDiam) setZTeeth(null);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-[#1e1e1e] px-4 py-3 sticky top-0 bg-black z-10">
        <div className="max-w-4xl mx-auto relative flex items-center justify-center">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="SPINCUT Outils CNC" style={{ height: '100px', objectFit: 'contain', mixBlendMode: 'screen' }} />
            {isAdmin && (
              <span className="bg-[#3a1e00] text-[#d4780f] text-xs font-bold px-2 py-0.5 rounded-full border border-[#d4780f]/30">
                Admin
              </span>
            )}
          </div>
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="absolute right-0 flex items-center gap-1 text-[#555] hover:text-white text-xs transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Déconnexion
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="pt-1 pb-2 text-center">
          <h1 className="text-lg font-bold text-white">Calculateur CNC Pro</h1>
          <p className="text-[#555] text-xs mt-0.5">Paramètres optimisés pour votre outillage SPINCUT</p>
        </div>

        {/* Parameters */}
        <div className="bg-[#161616] rounded-2xl p-5 border border-[#1e1e1e] space-y-4">
          <h2 className="text-[#d4780f] font-semibold text-base flex items-center gap-2">🔧 Paramètres</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <SelectField label="Type d'outil" value={toolType ?? ''} onChange={handleToolChange}>
              <option value="" disabled>— Choisir —</option>
              {(Object.keys(TOOL_TYPE_LABELS) as CalculatorParams['toolType'][]).map(k => (
                <option key={k} value={k}>{TOOL_TYPE_LABELS[k]}</option>
              ))}
            </SelectField>

            <SelectField label="Diamètre de fraise (mm)" value={safeDiam ? String(safeDiam) : ''} onChange={v => setDiameter(Number(v))}>
              <option value="" disabled>— Choisir —</option>
              {availDiams.map(d => <option key={d} value={d}>Ø {d} mm</option>)}
            </SelectField>

            {toolType && (
              <div className="sm:col-span-2">
                <label className={LBL}>Nombre de dents</label>
                <div className="flex gap-2">
                  {isCompDiam
                    ? (['1+1','2+2','3+3'] as ToolNotation[]).map(n => (
                        <button key={n} onClick={() => setNotation(n)}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                            notation === n
                              ? 'bg-[#d4780f] border-[#d4780f] text-white'
                              : 'bg-[#1e1e1e] border-[#2a2a2a] text-[#aaa] hover:border-[#d4780f]'
                          }`}
                        >{n}</button>
                      ))
                    : TEETH_OPTIONS.filter(z => z <= 4).map(z => (
                        <button key={z} onClick={() => setZTeeth(z)}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                            zTeeth === z
                              ? 'bg-[#d4780f] border-[#d4780f] text-white'
                              : 'bg-[#1e1e1e] border-[#2a2a2a] text-[#aaa] hover:border-[#d4780f]'
                          }`}
                        >Z{z}</button>
                      ))
                  }
                </div>
              </div>
            )}

            <SelectField label="Type d'opération" value={operation ?? ''} onChange={v => setOperation(v as CalculatorParams['operation'])}>
              <option value="" disabled>— Choisir —</option>
              {(['decoupe', 'rainure', 'poche', 'gravure'] as const).map(k => (
                <option key={k} value={k}>{OPERATION_LABELS[k]}</option>
              ))}
            </SelectField>

            <SelectField label="Matériau" value={safeMat ?? ''} onChange={v => setMaterial(v as CalculatorParams['material'])}>
              <option value="" disabled>— Choisir —</option>
              {availableMaterials.map(m => (
                <option key={m} value={m}>{MATERIAL_LABELS[m]}</option>
              ))}
            </SelectField>

          </div>

          {/* Machine limits */}
          <div className="pt-2 border-t border-[#1e1e1e] grid grid-cols-1 sm:grid-cols-2 gap-4">
            <NumberField
              label={
                operation === 'rainure' ? 'Profondeur de rainure (mm)' :
                operation === 'poche'   ? 'Profondeur de poche (mm)' :
                operation === 'gravure' ? 'Profondeur de gravure (mm)' :
                'Épaisseur matière (mm)'
              }
              value={thickness} onChange={setThickness}
              placeholder={operation === 'decoupe' || !operation ? 'Ex: 18' : 'Ex: 8'}
              hint="pour calcul N passes"
            />
            <NumberField label="Vitesse broche max — n max (tr/min)" value={nMax} onChange={setNMax} placeholder="Ex: 24000" hint="facultatif" />
            <NumberField label="Vitesse d'avance max — Vf max (mm/min)" value={vfMax} onChange={setVfMax} placeholder="Ex: 6000" hint="facultatif" />
          </div>
        </div>

        {/* Placeholder quand pas encore rempli */}
        {!isReady && (
          <div className="bg-[#161616] rounded-2xl p-6 border border-[#1e1e1e] text-center">
            <p className="text-[#444] text-sm">Sélectionnez vos paramètres pour voir les résultats</p>
          </div>
        )}

        {/* Forbidden */}
        {result && result.forbidden && (
          <div className="bg-[#2a0000] border border-red-800 rounded-xl p-4 flex items-start gap-3">
            <span className="text-red-400 text-xl mt-0.5">⛔</span>
            <div>
              <p className="text-red-400 font-semibold text-sm">Combinaison impossible</p>
              <p className="text-red-300 text-sm mt-0.5">{result.message}</p>
            </div>
          </div>
        )}

        {/* Alerts */}
        {result && !result.forbidden && result.alerts.length > 0 && (
          <div className="space-y-2">
            {result.alerts.map((a, i) => (
              <div key={i} className={`rounded-xl p-3 flex items-start gap-3 border ${
                a.type === 'info'    ? 'bg-[#0a1628] border-[#1e3a5f] text-[#60a5fa]'
                : a.type === 'warning' ? 'bg-[#1a0f00] border-[#3a2000] text-[#f59e0b]'
                : 'bg-[#2a0000] border-[#3a0000] text-red-400'
              }`}>
                <span className="text-base mt-0.5">{a.type === 'info' ? 'ℹ️' : a.type === 'warning' ? '⚠️' : '🚨'}</span>
                <p className="text-sm">{a.message}</p>
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {result && !result.forbidden && (
          <div className="bg-[#161616] rounded-2xl p-5 border border-[#1e1e1e] space-y-4">
            <h2 className="text-[#d4780f] font-semibold text-base flex items-center gap-2">🏎️ Résultats</h2>

            <div className="flex gap-3">
              <BigResultCard label="Vitesse broche (n)" value={result.n.toLocaleString('fr-FR')} unit="tr/min" />
              <BigResultCard label="Avance XY (Vf)" value={result.vf.toLocaleString('fr-FR')} unit="mm/min" />
            </div>
            <p className="text-center text-[#444] text-xs -mt-1">↑ Ces 2 valeurs sont à entrer dans votre machine</p>

            <div className="grid grid-cols-3 gap-3">
              <ResultCard label="Vitesse de coupe (Vc)" value={String(result.vc)} unit="m/min" sub={`plage : ${result.vcMin}–${result.vcMax}`} />
              <ResultCard
                label="Avance/dent (fz)"
                value={result.fzCorrige.toFixed(3)}
                unit="mm/dent"
                badge={result.rctf !== null ? `×${result.rctf.toFixed(2)} chip thinning` : undefined}
              />
              <ResultCard label="Prof. de passe (ap)" value={result.ap.toFixed(1)} unit="mm" sub={result.apLabel} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Largeur de coupe (ae)" value={result.ae.toFixed(2)} unit="mm" sub={result.aeLabel} />
              <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#2a2a2a]">
                <p className="text-[#888] text-xs mb-1">Vitesse descente Z</p>
                <p className="text-[#d4780f] font-bold text-2xl">{result.vfZ.toLocaleString('fr-FR')}</p>
                <p className="text-[#666] text-xs mt-0.5">mm/min</p>
                <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                  result.modeEntree.includes('OBLIGATOIRE') ? 'bg-[#2a0000] text-red-400'
                  : result.modeEntree.includes('directe')   ? 'bg-[#0a1f0a] text-green-400'
                  : 'bg-[#1a0f00] text-[#f59e0b]'
                }`}>{result.modeEntree}</span>
              </div>
            </div>

            {result.nPasses !== null && (
              <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#2a2a2a]">
                <p className="text-[#888] text-xs mb-2">Calcul passes Z</p>
                <div className="flex gap-6 flex-wrap">
                  <div><span className="text-[#d4780f] font-bold text-xl">{result.nPasses}</span><span className="text-[#666] text-sm ml-1">passes</span></div>
                  <div><span className="text-[#d4780f] font-bold text-xl">{result.apReel.toFixed(2)}</span><span className="text-[#666] text-sm ml-1">mm / passe</span></div>
                  <div><span className="text-[#d4780f] font-bold text-xl">{result.vfZ.toLocaleString('fr-FR')}</span><span className="text-[#666] text-sm ml-1">mm/min descente</span></div>
                  <span className={`text-xs px-2 py-0.5 rounded-full self-center ${
                    result.modeEntree.includes('OBLIGATOIRE') ? 'bg-[#2a0000] text-red-400'
                    : result.modeEntree.includes('directe')   ? 'bg-[#0a1f0a] text-green-400'
                    : 'bg-[#1a0f00] text-[#f59e0b]'
                  }`}>{result.modeEntree}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={savedThisCalc}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                savedThisCalc
                  ? 'bg-[#0a2010] border-green-800 text-green-400 cursor-default'
                  : 'bg-[#1e1e1e] border-[#d4780f]/40 text-[#d4780f] hover:bg-[#d4780f]/10 active:scale-95'
              }`}
            >
              {savedThisCalc ? '✓ Calcul sauvegardé dans l\'historique' : '💾 Sauvegarder ce calcul'}
            </button>
          </div>
        )}

        {/* Fraises recommandées */}
        {recommendations.length > 0 && (
          <div className="bg-[#161616] rounded-2xl border border-[#1e1e1e] overflow-hidden">
            <div className="px-5 pt-5 pb-3">
              <h2 className="text-[#d4780f] font-semibold text-base">⭐ Fraises SPINCUT recommandées</h2>
              <p className="text-[#555] text-xs mt-1">
                {recommendations.length} outil{recommendations.length > 1 ? 's' : ''} pour {safeMat ? MATERIAL_LABELS[safeMat] : ''}
                {thickness && !isNaN(parseFloat(thickness))
                  ? ` · LC ≥ ${thickness} mm`
                  : ' · Renseigne l\'épaisseur pour filtrer par LC'}
              </p>
            </div>
            <div className="overflow-x-auto pb-5">
              <div className="flex gap-3 px-5" style={{ width: 'max-content' }}>
                {recommendations.map(p => (
                  <div
                    key={`${p.ref}__${p.row}`}
                    className="w-44 flex-shrink-0 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-3 flex flex-col gap-2"
                  >
                    <div className="flex flex-wrap gap-1">
                      {p.diametre && p.diametre !== '/' && (
                        <span className="text-[10px] font-mono bg-[#2a2a2a] text-[#d4780f] px-1.5 py-0.5 rounded">Ø{p.diametre}</span>
                      )}
                      {p.dents && p.dents !== '/' && (
                        <span className="text-[10px] font-mono bg-[#2a2a2a] text-[#aaa] px-1.5 py-0.5 rounded">Z{p.dents}</span>
                      )}
                      {p.lc && p.lc !== '/' && (
                        <span className="text-[10px] font-mono bg-[#2a2a2a] text-[#aaa] px-1.5 py-0.5 rounded">LC{p.lc}</span>
                      )}
                      {p.pm && (
                        <span className="text-[10px] font-bold bg-[#0d2a0d] text-green-400 px-1.5 py-0.5 rounded">PM</span>
                      )}
                    </div>
                    <p className="text-white font-mono text-xs font-semibold leading-tight">{p.ref}</p>
                    <p className="text-[#666] text-[11px] leading-tight line-clamp-2 flex-1">{p.designation}</p>
                    <div>
                      {p.stock === 0
                        ? <p className="text-[10px] font-semibold text-red-400">Rupture de stock</p>
                        : p.stock <= 5
                          ? <p className="text-[10px] text-orange-400">Stock faible ({p.stock})</p>
                          : <p className="text-[10px] text-green-400">En stock ({p.stock})</p>
                      }
                      <p className="text-[#d4780f] font-bold text-sm mt-0.5">{p.prix.toFixed(2).replace('.', ',')} € HT</p>
                    </div>
                    {p.stock === 0 ? (
                      <div className="w-full py-2 rounded-lg text-xs font-bold text-center text-[#444] bg-[#1a1a1a] border border-[#2a2a2a]">
                        Rupture
                      </div>
                    ) : (() => {
                      const id = `${p.ref}__${p.row}`
                      const qty = quantities[id] || 0
                      return qty === 0 ? (
                        <button
                          onClick={() => setQty(id, 1, p.stock)}
                          className="w-full py-2 rounded-lg text-xs font-bold text-center transition-colors"
                          style={{ background: '#2a1400', color: '#d4780f', border: '1px solid #d4780f33' }}
                        >
                          + Ajouter
                        </button>
                      ) : (
                        <div className="flex items-center justify-between gap-1">
                          <button onClick={() => setQty(id, -1, p.stock)}
                            className="flex-1 h-8 rounded-lg bg-[#d4780f] flex items-center justify-center font-bold text-base text-white"
                          >−</button>
                          <span className="w-7 text-center text-[#d4780f] font-bold text-sm">{qty}</span>
                          <button onClick={() => setQty(id, +1, p.stock)}
                            className="flex-1 h-8 rounded-lg bg-[#d4780f] flex items-center justify-center font-bold text-base text-white hover:bg-[#b86400] transition-colors active:scale-95"
                          >+</button>
                        </div>
                      )
                    })()}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="bg-[#161616] rounded-2xl border border-[#1e1e1e] overflow-hidden">
            <button
              onClick={() => setShowHistory(s => !s)}
              className="w-full p-5 flex items-center justify-between hover:bg-[#1a1a1a] transition-colors"
            >
              <h2 className="text-[#d4780f] font-semibold text-base flex items-center gap-2">
                🕐 Historique
                <span className="bg-[#d4780f]/20 text-[#d4780f] text-xs px-2 py-0.5 rounded-full font-normal">
                  {history.length}
                </span>
                <span className="text-[#333] text-xs font-normal">/ 20 max</span>
              </h2>
              <svg className={`w-5 h-5 text-[#555] transition-transform ${showHistory ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showHistory && (
              <div className="px-5 pb-5 space-y-5">
                {groupByDay(history).map(([dayLabel, entries]) => (
                  <div key={dayLabel}>
                    <p className="text-[#444] text-[10px] font-semibold tracking-[0.2em] uppercase mb-2">
                      {dayLabel}
                    </p>
                    <div className="space-y-2">
                      {entries.map(entry => (
                        <div
                          key={entry.id}
                          className="bg-[#1a1a1a] rounded-xl p-3 border border-[#2a2a2a] flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="text-white text-sm font-medium truncate">
                              {TOOL_TYPE_LABELS[entry.params.toolType]} Ø{entry.params.diameter} · {MATERIAL_LABELS[entry.params.material]}
                            </p>
                            <p className="text-[#666] text-xs mt-0.5">
                              {OPERATION_LABELS[entry.params.operation]} &nbsp;·&nbsp;
                              <span className="text-[#d4780f]">n {entry.result.n.toLocaleString('fr-FR')} tr/min</span>
                              &nbsp;·&nbsp; Vf {entry.result.vf.toLocaleString('fr-FR')} mm/min
                            </p>
                          </div>
                          <button
                            onClick={() => reloadEntry(entry)}
                            className="flex-shrink-0 text-xs text-[#d4780f] border border-[#d4780f]/30 px-2.5 py-1.5 rounded-lg hover:bg-[#d4780f]/10 transition-colors"
                          >
                            ↩ Recharger
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Conseils */}
        <div className="bg-[#161616] rounded-2xl border border-[#1e1e1e] overflow-hidden">
          <button onClick={() => setShowConseils(s => !s)} className="w-full p-5 flex items-center justify-between hover:bg-[#1a1a1a] transition-colors">
            <h2 className="text-[#d4780f] font-semibold text-base">💡 Conseils</h2>
            <svg className={`w-5 h-5 text-[#555] transition-transform ${showConseils ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showConseils && toolType && safeMat && (
            <div className="px-5 pb-5 space-y-4">
              <div>
                <p className="text-[#d4780f] font-medium text-sm mb-2">{TOOL_TYPE_LABELS[toolType]}</p>
                <ul className="space-y-1">{CONSEILS_OUTIL[toolType].map((c, i) => (
                  <li key={i} className="text-[#aaa] text-sm flex items-start gap-2"><span className="text-[#d4780f] mt-0.5">·</span>{c}</li>
                ))}</ul>
              </div>
              <div>
                <p className="text-[#d4780f] font-medium text-sm mb-2">{MATERIAL_LABELS[safeMat]}</p>
                <ul className="space-y-1">{CONSEILS_MATIERE[safeMat].map((c, i) => (
                  <li key={i} className="text-[#aaa] text-sm flex items-start gap-2"><span className="text-[#d4780f] mt-0.5">·</span>{c}</li>
                ))}</ul>
              </div>
            </div>
          )}
          {showConseils && (!toolType || !safeMat) && (
            <p className="px-5 pb-5 text-[#444] text-sm">Sélectionnez un type d'outil et un matériau pour voir les conseils.</p>
          )}
        </div>

        {/* Diagnostic */}
        <div className="bg-[#161616] rounded-2xl border border-[#1e1e1e] overflow-hidden">
          <button onClick={() => setShowDiag(s => !s)} className="w-full p-5 flex items-center justify-between hover:bg-[#1a1a1a] transition-colors">
            <h2 className="text-[#d4780f] font-semibold text-base">🎯 TIPS</h2>
            <svg className={`w-5 h-5 text-[#555] transition-transform ${showDiag ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showDiag && (
            <div className="px-5 pb-5">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-[#2a2a2a]">
                    <th className="text-left text-[#888] font-medium py-2 pr-4">Symptôme</th>
                    <th className="text-left text-[#888] font-medium py-2 pr-4">Cause</th>
                    <th className="text-left text-[#888] font-medium py-2">Solution</th>
                  </tr></thead>
                  <tbody>{DIAGNOSTIC.map((d, i) => (
                    <tr key={i} className="border-b border-[#1a1a1a]">
                      <td className="py-2 pr-4 text-white">{d.symptome}</td>
                      <td className="py-2 pr-4 text-[#aaa]">{d.cause}</td>
                      <td className="py-2 text-[#d4780f]">{d.solution}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Glossaire */}
        <div className="bg-[#161616] rounded-2xl border border-[#1e1e1e] overflow-hidden">
          <button onClick={() => setShowGlossaire(s => !s)} className="w-full p-5 flex items-center justify-between hover:bg-[#1a1a1a] transition-colors">
            <h2 className="text-[#d4780f] font-semibold text-base">📖 C'est quoi tous ces termes ?</h2>
            <svg className={`w-5 h-5 text-[#555] transition-transform ${showGlossaire ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showGlossaire && (
            <div className="px-5 pb-5">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2a2a2a]">
                      <th className="text-left text-[#d4780f] font-semibold py-2 pr-6 w-16">Terme</th>
                      <th className="text-left text-[#888] font-medium py-2 pr-6">Nom complet</th>
                      <th className="text-left text-[#888] font-medium py-2">En clair</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a1a1a]">
                    {[
                      { term: 'n', full: 'Vitesse de rotation (tr/min)', plain: 'Combien de tours par minute tourne la fraise' },
                      { term: 'Vf', full: 'Vitesse d\'avance (mm/min)', plain: 'À quelle vitesse la machine se déplace sur la pièce' },
                      { term: 'Vc', full: 'Vitesse de coupe (m/min)', plain: 'La vitesse réelle du tranchant de la fraise dans la matière' },
                      { term: 'fz', full: 'Avance par dent (mm/dent)', plain: 'L\'épaisseur de copeau coupé par chaque arête à chaque tour' },
                      { term: 'ap', full: 'Profondeur de passe axiale (mm)', plain: 'À quelle profondeur la fraise plonge en Z à chaque passe' },
                      { term: 'ae', full: 'Profondeur de passe radiale (mm)', plain: 'Quelle largeur de matière la fraise enlève latéralement' },
                      { term: 'Z', full: 'Nombre de dents', plain: 'Le nombre de tranchants sur la fraise' },
                      { term: 'Vf_Z', full: 'Vitesse de plongée Z (mm/min)', plain: 'La vitesse à utiliser quand la fraise descend dans la matière' },
                      { term: 'RCTF', full: 'Correction de charge par dent', plain: 'Un coefficient qui augmente la charge quand on n\'utilise qu\'une partie de la fraise' },
                    ].map(({ term, full, plain }) => (
                      <tr key={term}>
                        <td className="py-3 pr-6">
                          <span className="font-mono font-bold text-white text-base">{term}</span>
                        </td>
                        <td className="py-3 pr-6 text-[#aaa]">{full}</td>
                        <td className="py-3 text-[#666]">{plain}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-[#333] text-xs pb-24">
          © SPINCUT — Ces valeurs sont des recommandations standards. Un test avant production est conseillé.
        </p>
      </div>

      {/* Mail app chooser */}
      {showMailMenu && (
        <div
          className="fixed inset-0 z-30 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setShowMailMenu(false)}
        >
          <div
            className="w-full max-w-sm rounded-t-2xl p-5 space-y-3"
            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
            onClick={e => e.stopPropagation()}
          >
            <p className="text-center text-[#888] text-xs tracking-widest uppercase mb-4">Envoyer un mail à SPINCUT</p>

            <a href="mailto:scspincut@gmail.com?subject=Question%20SPINCUT"
              className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl text-sm font-medium text-white"
              style={{ background: '#2a2a2a' }}
              onClick={() => setShowMailMenu(false)}
            >
              <AppleMailIcon />
              <span>
                <span className="block font-semibold">Apple Mail</span>
                <span className="block text-[#888] text-xs">Application Mail par défaut</span>
              </span>
            </a>

            <a href="https://mail.google.com/mail/?view=cm&fs=1&to=scspincut@gmail.com&su=Question%20SPINCUT"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl text-sm font-medium text-white"
              style={{ background: '#2a2a2a' }}
              onClick={() => setShowMailMenu(false)}
            >
              <GmailIcon />
              <span>
                <span className="block font-semibold">Gmail</span>
                <span className="block text-[#888] text-xs">Ouvre Gmail dans le navigateur</span>
              </span>
            </a>

            <a href="https://outlook.live.com/mail/0/deeplink/compose?to=scspincut@gmail.com&subject=Question%20SPINCUT"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl text-sm font-medium text-white"
              style={{ background: '#2a2a2a' }}
              onClick={() => setShowMailMenu(false)}
            >
              <OutlookIcon />
              <span>
                <span className="block font-semibold">Outlook</span>
                <span className="block text-[#888] text-xs">Ouvre Outlook dans le navigateur</span>
              </span>
            </a>

            <button
              onClick={() => setShowMailMenu(false)}
              className="w-full py-3 rounded-xl text-sm text-[#666]"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Barre de contact fixe en bas */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-black/95 backdrop-blur border-t border-[#1e1e1e] px-4 py-3">
        <div className="max-w-4xl mx-auto flex gap-2">

          {/* Commander */}
          <Link
            to="/commande"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-bold transition-colors"
            style={{ background: '#2a1400', borderColor: '#d4780f', color: '#d4780f' }}
          >
            🛒 Commander
          </Link>

          {/* WhatsApp */}
          <a
            href="https://wa.me/33767739561"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-colors"
            style={{ background: '#0d2e0d', borderColor: '#1a5e1a', color: '#4ade80' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </a>

          {/* Email */}
          <button
            onClick={() => setShowMailMenu(true)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-colors"
            style={{ background: '#1e1200', borderColor: '#d4780f44', color: '#d4780f' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="M2 7l10 7 10-7"/>
            </svg>
            Mail
          </button>

        </div>
      </div>
      <BottomNav cartCount={cartCount} cartTotal={cartTotal} />
    </div>
  );
}
