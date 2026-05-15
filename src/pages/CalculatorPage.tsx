import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalculatorParams, ToolNotation } from '../types';
import { calculate } from '../utils/calculations';
import {
  TOOL_TYPE_LABELS, MATERIAL_LABELS, OPERATION_LABELS,
  TOOL_MATERIALS, DIAMETER_OPTIONS, TEETH_OPTIONS,
  CONSEILS_OUTIL, CONSEILS_MATIERE, DIAGNOSTIC,
} from '../utils/cncData';
import SpincutLogo from '../components/SpincutLogo';
import { useClientAuth } from '../hooks/useAuth';
import { HistoryEntry, loadHistory, pushToHistory, groupByDay } from '../utils/history';

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

  // All hooks must be called unconditionally before any early return
  const [toolType, setToolType] = useState<CalculatorParams['toolType']>('carbure_monobloc');
  const [notation, setNotation] = useState<ToolNotation>('2+2');
  const [material, setMaterial] = useState<CalculatorParams['material']>('mdf');
  const [operation, setOperation] = useState<CalculatorParams['operation']>('detourage');
  const [diameter, setDiameter] = useState(6);
  const [zTeeth, setZTeeth] = useState(2);
  const [nMax, setNMax] = useState('');
  const [vfMax, setVfMax] = useState('');
  const [thickness, setThickness] = useState('');
  const [showConseils, setShowConseils] = useState(false);
  const [showDiag, setShowDiag] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory());
  const [savedThisCalc, setSavedThisCalc] = useState(false);
  const [showMailMenu, setShowMailMenu] = useState(false);
  const [showGlossaire, setShowGlossaire] = useState(false);

  // Derived values needed by useMemo below
  const availableMaterials = TOOL_MATERIALS[toolType];
  const safeMat = availableMaterials.includes(material) ? material : availableMaterials[0];

  const availDiams = DIAMETER_OPTIONS.filter(d => {
    if (toolType === 'ravageuse') return d >= 6;
    if (toolType === 'hss') return d >= 3 && d <= 12;
    if (toolType === 'diamant_coupe' || toolType === 'compression') return d >= 3;
    return true;
  });
  const safeDiam = availDiams.includes(diameter) ? diameter : (availDiams[1] ?? availDiams[0]);

  const params: CalculatorParams = {
    toolType, notation, material: safeMat, operation,
    diameter: safeDiam, zTeeth, machineType: 'pro_portique', coating: 'none',
    nMax: nMax ? parseFloat(nMax) : null,
    vfMax: vfMax ? parseFloat(vfMax) : null,
    materialThickness: thickness ? parseFloat(thickness) : null,
    apOverride: null,
  };

  // useMemo + useEffect MUST stay above the auth guard (Rules of Hooks)
  const result = useMemo(() => calculate(params), [
    toolType, notation, safeMat, operation, safeDiam, zTeeth,
    nMax, vfMax, thickness,
  ]);

  useEffect(() => { setSavedThisCalc(false); }, [result]);

  // Auth guard — after every hook
  if (!isAuthenticated) {
    navigate('/');
    return null;
  }

  const handleSave = () => {
    if (result.forbidden) return;
    const entry: HistoryEntry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      params: { toolType, notation, material: safeMat, operation, diameter: safeDiam, zTeeth, nMax, vfMax, thickness },
      result: { n: result.n, vf: result.vf, vc: result.vc },
    };
    setHistory(pushToHistory(entry));
    setSavedThisCalc(true);
  };

  const exportPDF = () => {
    if (result.forbidden) return;
    const now = new Date();
    const date = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`;
    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Fiche réglage — SPINCUT</title><style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:-apple-system,Arial,sans-serif;color:#1a1a1a;padding:32px;max-width:720px;margin:auto}
      .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:16px;border-bottom:3px solid #d4780f}
      .brand{font-size:24px;font-weight:900;letter-spacing:3px}.brand span{color:#d4780f}
      .subtitle{font-size:11px;color:#888;margin-top:3px;letter-spacing:1px;text-transform:uppercase}
      .date{font-size:11px;color:#888;text-align:right}
      h2{font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#d4780f;margin:20px 0 10px}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
      .field{padding:10px 14px;background:#f7f7f7;border-radius:8px;border-left:3px solid #e5e5e5}
      .label{font-size:10px;color:#888;margin-bottom:3px}
      .val{font-size:15px;font-weight:700;color:#1a1a1a}
      .unit{font-size:10px;color:#999;margin-top:1px}
      .main-results{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px}
      .big{padding:16px;background:#fff7ed;border:2px solid #fed7aa;border-radius:10px;text-align:center}
      .big .val{font-size:30px;color:#d4780f}
      .big .label{font-size:12px;color:#b45309;font-weight:600;margin-bottom:4px}
      .big .unit{font-size:12px;color:#d4780f;margin-top:2px}
      .highlight{margin-top:20px;padding:14px 18px;border:2px dashed #d4780f;border-radius:10px}
      .highlight p{font-size:10px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px}
      .highlight .vals{font-size:17px;font-weight:800;color:#d4780f}
      .alert{padding:8px 12px;border-radius:6px;font-size:11px;margin-bottom:6px}
      .warning{background:#fffbeb;border:1px solid #fbbf24;color:#92400e}
      .danger{background:#fef2f2;border:1px solid #fca5a5;color:#991b1b}
      .info{background:#eff6ff;border:1px solid #93c5fd;color:#1e40af}
      .footer{margin-top:28px;padding-top:12px;border-top:1px solid #e5e5e5;font-size:10px;color:#bbb;display:flex;justify-content:space-between}
    </style></head><body>
      <div class="header">
        <div><div class="brand">SPIN<span>CUT</span></div><div class="subtitle">Outils CNC — Fiche de réglage</div></div>
        <div class="date">Généré le ${date}</div>
      </div>
      <h2>Paramètres</h2>
      <div class="grid">
        <div class="field"><div class="label">Type d'outil</div><div class="val">${TOOL_TYPE_LABELS[toolType]}</div></div>
        <div class="field"><div class="label">Matériau</div><div class="val">${MATERIAL_LABELS[safeMat]}</div></div>
        <div class="field"><div class="label">Opération</div><div class="val">${OPERATION_LABELS[operation]}</div></div>
        <div class="field"><div class="label">Diamètre</div><div class="val">Ø ${safeDiam} mm</div></div>
        ${toolType !== 'diamant_coupe' && toolType !== 'compression'
          ? `<div class="field"><div class="label">Nombre de dents</div><div class="val">${zTeeth} dent${zTeeth > 1 ? 's' : ''}</div></div>`
          : `<div class="field"><div class="label">Géométrie</div><div class="val">${notation}</div></div>`}
        ${thickness ? `<div class="field"><div class="label">Épaisseur matière</div><div class="val">${thickness} mm</div></div>` : ''}
      </div>
      <h2>Résultats</h2>
      <div class="main-results">
        <div class="big"><div class="label">Vitesse broche (n)</div><div class="val">${result.n.toLocaleString('fr-FR')}</div><div class="unit">tr/min</div></div>
        <div class="big"><div class="label">Avance XY (Vf)</div><div class="val">${result.vf.toLocaleString('fr-FR')}</div><div class="unit">mm/min</div></div>
      </div>
      <div class="grid">
        <div class="field"><div class="label">Vitesse de coupe (Vc)</div><div class="val">${result.vc} m/min</div><div class="unit">plage : ${result.vcMin}–${result.vcMax} m/min</div></div>
        <div class="field"><div class="label">Avance/dent (fz)</div><div class="val">${result.fzCorrige.toFixed(3)} mm/dent</div></div>
        <div class="field"><div class="label">Prof. de passe (ap)</div><div class="val">${result.ap.toFixed(1)} mm</div><div class="unit">${result.apLabel}</div></div>
        <div class="field"><div class="label">Largeur de coupe (ae)</div><div class="val">${result.ae.toFixed(2)} mm</div><div class="unit">${result.aeLabel}</div></div>
        <div class="field"><div class="label">Vitesse descente Z</div><div class="val">${result.vfZ.toLocaleString('fr-FR')} mm/min</div><div class="unit">${result.modeEntree}</div></div>
        ${result.nPasses !== null ? `<div class="field"><div class="label">Passes Z</div><div class="val">${result.nPasses} passes</div><div class="unit">${result.apReel.toFixed(2)} mm / passe</div></div>` : ''}
      </div>
      ${result.alerts.length > 0 ? `<h2>Points d'attention</h2>${result.alerts.map(a => `<div class="alert ${a.type}">${a.message}</div>`).join('')}` : ''}
      <div class="highlight">
        <p>À entrer dans votre machine</p>
        <div class="vals">n = ${result.n.toLocaleString('fr-FR')} tr/min &nbsp;·&nbsp; Vf = ${result.vf.toLocaleString('fr-FR')} mm/min &nbsp;·&nbsp; ap = ${result.ap.toFixed(1)} mm</div>
      </div>
      <div class="footer">
        <span>© SPINCUT — Ces valeurs sont des recommandations. Un test avant production est conseillé.</span>
        <span>spincut-bn2y.vercel.app</span>
      </div>
      <script>window.onload=()=>{window.print()}<\/script>
    </body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
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
    const tt = t as CalculatorParams['toolType'];
    setToolType(tt);
    if (!TOOL_MATERIALS[tt].includes(safeMat)) setMaterial(TOOL_MATERIALS[tt][0]);
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      {/* Header */}
      <header className="border-b border-[#1e1e1e] px-4 py-3 flex items-center justify-between sticky top-0 bg-[#0d0d0d] z-10">
        <div className="flex items-center gap-3">
          <SpincutLogo />
          {isAdmin && (
            <span className="bg-[#3a1e00] text-[#d4780f] text-xs font-bold px-2 py-0.5 rounded-full border border-[#d4780f]/30">
              Admin
            </span>
          )}
        </div>
        <button
          onClick={() => { logout(); navigate('/'); }}
          className="flex items-center gap-1.5 text-[#888] hover:text-white text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Déconnexion
        </button>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="pt-1 pb-2">
          <h1 className="text-lg font-bold text-white">Calculateur CNC Pro</h1>
          <p className="text-[#555] text-xs mt-0.5">Paramètres optimisés pour votre outillage SPINCUT</p>
        </div>

        {/* Parameters */}
        <div className="bg-[#161616] rounded-2xl p-5 border border-[#1e1e1e] space-y-4">
          <h2 className="text-[#d4780f] font-semibold text-base flex items-center gap-2">🔧 Paramètres</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <SelectField label="Type d'outil" value={toolType} onChange={handleToolChange}>
              {(Object.keys(TOOL_TYPE_LABELS) as CalculatorParams['toolType'][]).map(k => (
                <option key={k} value={k}>{TOOL_TYPE_LABELS[k]}</option>
              ))}
            </SelectField>

            {(toolType === 'diamant_coupe' || toolType === 'compression') && (
              <div>
                <label className={LBL}>Géométrie / Notation</label>
                <div className="flex gap-2">
                  {(['1+1','2+2','3+3'] as ToolNotation[]).map(n => (
                    <button key={n} onClick={() => setNotation(n)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        notation === n
                          ? 'bg-[#d4780f] border-[#d4780f] text-white'
                          : 'bg-[#1e1e1e] border-[#2a2a2a] text-[#aaa] hover:border-[#d4780f]'
                      }`}
                    >{n}</button>
                  ))}
                </div>
              </div>
            )}

            <SelectField label="Matériau" value={safeMat} onChange={v => setMaterial(v as CalculatorParams['material'])}>
              {availableMaterials.map(m => (
                <option key={m} value={m}>{MATERIAL_LABELS[m]}</option>
              ))}
            </SelectField>

            <SelectField label="Type d'opération" value={operation} onChange={v => setOperation(v as CalculatorParams['operation'])}>
              {Object.entries(OPERATION_LABELS).map(([k, l]) => (
                <option key={k} value={k}>{l}</option>
              ))}
            </SelectField>

            <SelectField label="Diamètre de fraise (mm)" value={String(safeDiam)} onChange={v => setDiameter(Number(v))}>
              {availDiams.map(d => <option key={d} value={d}>Ø {d} mm</option>)}
            </SelectField>

            {toolType !== 'diamant_coupe' && toolType !== 'compression' && (
              <SelectField label="Nombre de dents (Z)" value={String(zTeeth)} onChange={v => setZTeeth(Number(v))}>
                {TEETH_OPTIONS.map(z => <option key={z} value={z}>{z} dent{z > 1 ? 's' : ''}</option>)}
              </SelectField>
            )}

          </div>

          {/* Machine limits */}
          <div className="pt-2 border-t border-[#1e1e1e] grid grid-cols-1 sm:grid-cols-2 gap-4">
            <NumberField label="Épaisseur matière (mm)" value={thickness} onChange={setThickness} placeholder="Ex: 18" hint="pour calcul N passes" />
            <NumberField label="Vitesse broche max — n max (tr/min)" value={nMax} onChange={setNMax} placeholder="Ex: 24000" hint="facultatif" />
            <NumberField label="Vitesse d'avance max — Vf max (mm/min)" value={vfMax} onChange={setVfMax} placeholder="Ex: 6000" hint="facultatif" />
          </div>
        </div>

        {/* Forbidden */}
        {result.forbidden && (
          <div className="bg-[#2a0000] border border-red-800 rounded-xl p-4 flex items-start gap-3">
            <span className="text-red-400 text-xl mt-0.5">⛔</span>
            <div>
              <p className="text-red-400 font-semibold text-sm">Combinaison impossible</p>
              <p className="text-red-300 text-sm mt-0.5">{result.message}</p>
            </div>
          </div>
        )}

        {/* Alerts */}
        {!result.forbidden && result.alerts.length > 0 && (
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
        {!result.forbidden && (
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

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={savedThisCalc}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                  savedThisCalc
                    ? 'bg-[#0a2010] border-green-800 text-green-400 cursor-default'
                    : 'bg-[#1e1e1e] border-[#d4780f]/40 text-[#d4780f] hover:bg-[#d4780f]/10 active:scale-95'
                }`}
              >
                {savedThisCalc ? '✓ Sauvegardé' : '💾 Sauvegarder'}
              </button>
              <button
                onClick={exportPDF}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all bg-[#1e1e1e] border-[#2a2a2a] text-[#aaa] hover:text-white hover:border-[#aaa] active:scale-95"
              >
                📄 Exporter PDF
              </button>
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
          {showConseils && (
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
        </div>

        {/* Diagnostic */}
        <div className="bg-[#161616] rounded-2xl border border-[#1e1e1e] overflow-hidden">
          <button onClick={() => setShowDiag(s => !s)} className="w-full p-5 flex items-center justify-between hover:bg-[#1a1a1a] transition-colors">
            <h2 className="text-[#d4780f] font-semibold text-base">🔩 Diagnostic</h2>
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

            <a href="mailto:scspincut@gmail.com"
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-white"
              style={{ background: '#2a2a2a' }}
              onClick={() => setShowMailMenu(false)}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/>
              </svg>
              Apple Mail
            </a>

            <a href="https://mail.google.com/mail/?view=cm&fs=1&to=scspincut@gmail.com"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-white"
              style={{ background: '#2a2a2a' }}
              onClick={() => setShowMailMenu(false)}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EA4335" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/>
              </svg>
              Gmail
            </a>

            <a href="ms-outlook://compose?to=scspincut@gmail.com"
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-white"
              style={{ background: '#2a2a2a' }}
              onClick={() => setShowMailMenu(false)}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0078D4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/>
              </svg>
              Outlook
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
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-[#0d0d0d]/95 backdrop-blur border-t border-[#1e1e1e] px-4 py-3">
        <div className="max-w-4xl mx-auto flex gap-3">

          {/* WhatsApp */}
          <a
            href="https://wa.me/33767739561"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-colors"
            style={{ background: '#0d2e0d', borderColor: '#1a5e1a', color: '#4ade80' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Commander / Poser une question
          </a>

          {/* Email */}
          <button
            onClick={() => setShowMailMenu(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors"
            style={{ background: '#1e1200', borderColor: '#d4780f44', color: '#d4780f' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="M2 7l10 7 10-7"/>
            </svg>
            Mail
          </button>

        </div>
      </div>
    </div>
  );
}
