import { CalculatorParams, CalcResult, Alert } from '../types';
import {
  VC_TABLE, FZ_TABLE, OPERATION_PARAMS, COATING_COEFF,
  DIAMETER_STEPS, NOTATION_Z, NOTATION_FZ_COEFF,
  VFZ_TABLE, FORBIDDEN_COMBOS,
} from './cncData';

function interpolateFz(toolType: string, material: string, diameter: number): number {
  const steps = DIAMETER_STEPS[toolType as keyof typeof DIAMETER_STEPS];
  const fzMap = FZ_TABLE[toolType as keyof typeof FZ_TABLE];
  const fzArr = fzMap[material as keyof typeof fzMap];
  if (!fzArr) return 0.05;

  if (diameter <= steps[0]) return fzArr[0];
  if (diameter >= steps[steps.length - 1]) return fzArr[fzArr.length - 1];

  for (let i = 0; i < steps.length - 1; i++) {
    if (diameter <= steps[i + 1]) {
      const t = (diameter - steps[i]) / (steps[i + 1] - steps[i]);
      return fzArr[i] + t * (fzArr[i + 1] - fzArr[i]);
    }
  }
  return fzArr[fzArr.length - 1];
}

export function checkForbidden(toolType: string, material: string): string | null {
  for (const entry of FORBIDDEN_COMBOS) {
    if (entry.tool === toolType && (entry.materials as string[]).includes(material)) {
      return entry.msg;
    }
  }
  return null;
}

export function calculate(params: CalculatorParams): CalcResult {
  const { toolType, notation, material, operation, diameter, zTeeth, coating, nMax, vfMax, materialThickness, apOverride } = params;

  // Step 2 — Check forbidden combinations
  const forbidMsg = checkForbidden(toolType, material);
  if (forbidMsg) return { forbidden: true, message: forbidMsg };

  // Step 3 — Vc_cible = (min + max) / 2
  const vcEntry = VC_TABLE[toolType]?.[material];
  if (!vcEntry) return { forbidden: true, message: "Combinaison outil/matière non disponible." };
  const [vcMin, vcMax] = vcEntry;
  const vcCible = (vcMin + vcMax) / 2;

  // Step 4 — Apply coating correction
  const coatingMult = COATING_COEFF[coating] ?? 1.0;
  const vcCoated = vcCible * coatingMult;

  // Step 5 — n théorique
  const nTheo = (1000 * vcCoated) / (Math.PI * diameter);

  // Step 6 — Cap n
  const nLimited = nMax !== null && nTheo > nMax;
  const nUsed = nLimited ? nMax! : nTheo;
  const vcReelle = (Math.PI * diameter * nUsed) / 1000;

  // Step 7 — fz from table with interpolation
  let fzBase = interpolateFz(toolType, material, diameter);

  // Step 8 — Finition correction (fz × 0.40)
  const opParams = OPERATION_PARAMS[operation] ?? OPERATION_PARAMS['detourage'];
  if (opParams.isFinition) fzBase *= 0.40;

  // Step 9 — Geometry correction for diamant/compression
  if (toolType === 'diamant_coupe' || toolType === 'compression') {
    fzBase *= NOTATION_FZ_COEFF[notation];
  }

  // Step 10 — ae from operation
  const ae = opParams.aeFactor * diameter;

  // Step 11 — RCTF if ae < D/2 and NOT rainurage pleine fraise
  let rctf: number | null = null;
  let fzCorrige = fzBase;
  if (!opParams.noRctf && ae < diameter / 2) {
    const inner = 1 - Math.pow(1 - (2 * ae) / diameter, 2);
    if (inner > 0) {
      rctf = 1 / Math.sqrt(inner);
      fzCorrige = fzBase * rctf;
    }
  }

  // Step 12 — Z calcul
  const zCalc = (toolType === 'diamant_coupe' || toolType === 'compression')
    ? NOTATION_Z[notation]
    : zTeeth;

  // Step 13 — Vf théorique
  const vfTheo = nUsed * zCalc * fzCorrige;

  // Step 14 — Cap Vf
  const vfLimited = vfMax !== null && vfTheo > vfMax;
  const vfUsed = vfLimited ? vfMax! : vfTheo;
  const fzReel = vfUsed / (nUsed * zCalc);

  // Step 15 — ap
  const apRecommended = opParams.apFactor * diameter;
  const apUsed = (apOverride !== null && apOverride > 0) ? apOverride : apRecommended;

  // Step 16 — Vf_Z
  const vfzInfo = VFZ_TABLE[material];
  const vfZ = vfUsed * vfzInfo.coeff;

  // Step 17 — N_passes
  let nPasses: number | null = null;
  let apReel = apUsed;
  if (materialThickness !== null && materialThickness > 0 && apUsed > 0) {
    nPasses = Math.ceil(materialThickness / apUsed);
    apReel = materialThickness / nPasses;
  }

  // Step 18 — MRR
  const mrr = (ae * apReel * vfUsed) / 1000;

  // ─── Alerts ────────────────────────────────────────────────────────────────
  const alerts: Alert[] = [];

  // Broche plafonnée
  if (nLimited) {
    alerts.push({
      type: 'warning',
      message: `Broche à la limite de ta machine — résultats calculés à ${nMax!.toLocaleString('fr-FR')} tr/min.`,
    });
  }

  // Avance plafonnée
  if (vfLimited) {
    alerts.push({
      type: 'warning',
      message: `Avance à la limite de ta machine — résultats calculés à ${vfMax!.toLocaleString('fr-FR')} mm/min.`,
    });
  }

  // ap > D : danger casse outil
  if (apUsed > diameter) {
    alerts.push({
      type: 'danger',
      message: `Profondeur de passe (${apUsed.toFixed(1)} mm) supérieure au diamètre — risque de casse outil. Réduire ap.`,
    });
  }

  // Securite matiere
  const aluMaterials: string[] = ['alu_2017','alu_7075','alu_6060','alu_coule'];
  if (material === 'mdf') {
    alerts.push({ type: 'info', message: 'MDF : aspiration puissante + masque FFP2 obligatoire (poussières silice + formaldéhyde).' });
  }
  if (material === 'bois_exotique') {
    alerts.push({ type: 'warning', message: 'Bois exotique : poussières toxiques — aspiration et masque respiratoire obligatoires.' });
  }
  if (aluMaterials.includes(material)) {
    alerts.push({ type: 'warning', message: "Aluminium : microlubrification obligatoire — sans lubrifiant, l'outil colle et casse immédiatement." });
  }
  if (toolType === 'hss' && (material === 'mdf' || material === 'melamine')) {
    alerts.push({ type: 'danger', message: 'Fraise HSS sur MDF/mélaminé : usure en quelques secondes. Utiliser un outil carbure.' });
  }

  const vcMaxCoated = vcMax * coatingMult;

  return {
    forbidden: false,
    n: Math.round(nUsed),
    nTheo: Math.round(nTheo),
    nLimited,
    vf: Math.round(vfUsed),
    vfTheo: Math.round(vfTheo),
    vfLimited,
    vc: Math.round(vcReelle),
    vcMin: Math.round(vcMin * coatingMult),
    vcMax: Math.round(vcMaxCoated),
    fzTable: parseFloat(fzBase.toFixed(3)),
    fzCorrige: parseFloat(fzCorrige.toFixed(3)),
    fzReel: parseFloat(fzReel.toFixed(3)),
    rctf: rctf !== null ? parseFloat(rctf.toFixed(2)) : null,
    zCalc,
    ap: parseFloat(apUsed.toFixed(2)),
    ae: parseFloat(ae.toFixed(3)),
    apLabel: opParams.apLabel,
    aeLabel: opParams.aeLabel,
    vfZ: Math.round(vfZ),
    vfZCoeff: vfzInfo.coeff,
    modeEntree: vfzInfo.mode,
    mrr: parseFloat(mrr.toFixed(2)),
    nPasses,
    apReel: parseFloat(apReel.toFixed(2)),
    alerts,
  };
}
