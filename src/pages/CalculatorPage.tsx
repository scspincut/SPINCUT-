import { useState, useMemo } from 'react';
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

  if (!isAuthenticated) {
    navigate('/');
    return null;
  }

  const [toolType, setToolType] = useState<CalculatorParams['toolType']>('carbure_monobloc');
  const [notation, setNotation] = useState<ToolNotation>('2+2');
  const [material, setMaterial] = useState<CalculatorParams['material']>('mdf');
  const [operation, setOperation] = useState<CalculatorParams['operation']>('detourage');
  const [diameter, setDiameter] = useState(6);
  const [zTeeth, setZTeeth] = useState(2);
  const [nMax, setNMax] = useState('');
  const [vfMax, setVfMax] = useState('');
  const [thickness, setThickness] = useState('');
  const [showConseils, setShowConseils] = useState(true);
  const [showDiag, setShowDiag] = useState(false);

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

  const result = useMemo(() => calculate(params), [
    toolType, notation, safeMat, operation, safeDiam, zTeeth,
    nMax, vfMax, thickness,
  ]);

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
        <div className="text-center py-2">
          <div className="flex justify-center mb-3">
            <SpincutLogo size="lg" />
          </div>
          <h1 className="text-xl font-bold text-white">Calculateur CNC Pro</h1>
          <p className="text-[#d4780f] text-[10px] tracking-[0.2em] mt-1 font-medium">DONNÉES PROPRIÉTAIRES SPINCUT</p>
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
            <NumberField label="n max broche (tr/min)" value={nMax} onChange={setNMax} placeholder="Ex: 24000" />
            <NumberField label="Vf max machine (mm/min)" value={vfMax} onChange={setVfMax} placeholder="Ex: 6000" />
            <NumberField label="Épaisseur matière (mm)" value={thickness} onChange={setThickness} placeholder="Ex: 18" hint="pour calcul N passes" />
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

            <div className="grid grid-cols-3 gap-3">
              <ResultCard label="Vc" value={String(result.vc)} unit="m/min" sub={`(${result.vcMin}–${result.vcMax})`} />
              <ResultCard
                label="fz"
                value={result.fzCorrige.toFixed(3)}
                unit="mm/dent"
                badge={result.rctf !== null ? `RCTF ×${result.rctf.toFixed(2)}` : undefined}
                sub={`base: ${result.fzTable.toFixed(3)}`}
              />
              <ResultCard label="ap recommandé" value={result.ap.toFixed(1)} unit="mm" sub={result.apLabel} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="ae recommandé" value={result.ae.toFixed(2)} unit="mm" sub={result.aeLabel} />
              <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#2a2a2a]">
                <p className="text-[#888] text-xs mb-1">Plongée Z (Vf_Z)</p>
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

            {(toolType === 'diamant_coupe' || toolType === 'compression') && (
              <p className="text-[#555] text-xs">
                Z calcul = {result.zCalc} arêtes ({notation}) — correction géométrie ×{notation === '1+1' ? '1.00' : notation === '2+2' ? '0.90' : '0.80'}
              </p>
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
            <h2 className="text-[#d4780f] font-semibold text-base">🔩 Diagnostic des problèmes courants</h2>
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

        <p className="text-center text-[#333] text-xs pb-4">
          © SPINCUT — Ces valeurs sont des recommandations standards. Un test avant production est conseillé.
        </p>
      </div>
    </div>
  );
}
