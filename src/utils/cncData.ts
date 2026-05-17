import { ToolType, Material, ToolNotation } from '../types';

// ─── Labels ──────────────────────────────────────────────────────────────────

export const TOOL_TYPE_LABELS: Record<ToolType, string> = {
  carbure_monobloc: 'Carbure monobloc',
  diamant_coupe:    'Coupe Diamant (1+1 / 2+2 / 3+3)',
  compression:      'Fraise Compression (1+1 / 2+2 / 3+3)',
  ravageuse:        'Ravageuse (ébauche uniquement)',
  hss:              'HSS / ARS',
};

export const MATERIAL_LABELS: Record<Material, string> = {
  bois_tendre:   'Bois tendre (pin, sapin, épicéa, peuplier)',
  bois_dur:      'Bois dur (chêne, hêtre, noyer, frêne)',
  bois_exotique: 'Bois exotique / dense (ipé, ébène, wengé)',
  mdf:           'MDF / Médium',
  ctp:           'Contreplaqué (CTP bouleau, peuplier)',
  melamine:      'Mélaminé / HDF / Stratifié',
  alu_2017:      'Aluminium 2017A / 2024 (dural)',
  alu_7075:      'Aluminium 7075 (avionique)',
  alu_6060:      'Aluminium 6060 / 6082 (profilé)',
  alu_coule:     'Aluminium coulé / fonderie (AS7, AS9)',
  pvc_expanse:   'PVC expansé (Forex, Sintra)',
  pvc_massif:    'PVC massif / rigide',
  pmma:          'PMMA / Plexiglass / Acrylique',
  pc:            'Polycarbonate (PC / Makrolon)',
  abs_pom:       'ABS / POM / Nylon',
};

export const OPERATION_LABELS: Record<string, string> = {
  detourage:           'Détourage / Profil finition',
  rainurage:           'Rainurage (pleine fraise)',
  surfacage:           'Surfaçage',
  contournage_ebauche: 'Contournage ébauche',
  poche_ebauche:       'Poche ébauche',
  poche_finition:      'Poche finition',
};

export const MACHINE_TYPE_LABELS: Record<string, string> = {
  hobby:          'CNC hobby / portique léger (Shapeoko...)',
  semi_pro:       'CNC semi-pro (Stepcraft, Axiom...)',
  pro_portique:   'Pro portique rigide (SCM, Biesse...)',
  centre_usinage: "Centre d'usinage industriel",
};

export const COATING_LABELS: Record<string, string> = {
  none:  'Aucun revêtement',
  tin:   'TiN (doré) — ×1.25',
  tialn: 'TiAlN (violet) — ×1.50 ⚠ pas alu',
  altin: 'AlTiN — ×1.40 ⚠ pas alu',
  dlc:   'DLC (noir) — ×1.30',
  zrn:   'ZrN — ×1.25 (idéal alu)',
};

// ─── Available materials per tool ────────────────────────────────────────────

export const TOOL_MATERIALS: Record<ToolType, Material[]> = {
  carbure_monobloc: [
    'bois_tendre','bois_dur','bois_exotique','mdf','ctp','melamine',
    'alu_2017','alu_7075','alu_6060','alu_coule',
    'pvc_expanse','pvc_massif','pmma','pc','abs_pom',
  ],
  diamant_coupe: ['bois_tendre','bois_dur','bois_exotique','mdf','ctp','melamine'],
  compression:   ['bois_tendre','bois_dur','mdf','ctp','melamine'],
  ravageuse:     ['bois_tendre','bois_dur','mdf','ctp','alu_2017','alu_6060'],
  hss:           ['bois_tendre','bois_dur','ctp','mdf','alu_2017'],
};

// ─── Diameter steps per tool (from reference tables) ─────────────────────────

export const DIAMETER_STEPS: Record<ToolType, number[]> = {
  carbure_monobloc: [2, 3, 4, 6, 8, 10, 12, 16, 20],
  diamant_coupe:    [3, 6, 8, 10, 12, 16, 20],
  compression:      [3, 6, 8, 10, 12, 16, 20],
  ravageuse:        [6, 8, 10, 12, 16, 20],
  hss:              [3, 6, 8, 10, 12],
};

export const DIAMETER_OPTIONS = [2, 3, 4, 6, 8, 10, 12, 16, 20];
export const TEETH_OPTIONS = [1, 2, 3, 4, 6];

// ─── Vc table [min, max] — Vc_cible = (min+max)/2 ────────────────────────────

type VcEntry = [number, number];

export const VC_TABLE: Record<ToolType, Partial<Record<Material, VcEntry>>> = {
  // Carbure monobloc — sources: Onsrud, Vortex Tool, CMT, Leuco, Harvey Performance
  carbure_monobloc: {
    bois_tendre:   [200, 400],   // pin/sapin/épicéa — 200-400 m/min standard carbure
    bois_dur:      [150, 300],   // chêne/hêtre — plus dur, Vc -15% vs tendre
    bois_exotique: [100, 220],   // ipé/ébène/wengé — très dur et abrasif
    mdf:           [180, 350],   // abrasif (silice+résine), outil use vite
    ctp:           [200, 400],   // colles abrasives, même ordre que bois tendre
    melamine:      [150, 300],   // revêtement corindon très abrasif
    alu_2017:      [150, 350],   // 2017A/2024 dural — Harvey: 150-300 m/min router
    alu_7075:      [100, 280],   // plus dur que 2017 — 75-85% Vc du 6061
    alu_6060:      [200, 480],   // 6060/6082 profilé — souple, Vc plus élevée possible
    alu_coule:     [100, 260],   // AS7/AS9 — Si abrasif, carbure grain fin
    pvc_expanse:   [150, 320],   // Forex/Sintra — risque fusion si trop vite
    pvc_massif:    [100, 220],   // PVC rigide — plus dur, fz élevé essentiel
    pmma:          [100, 250],   // acrylique — risque microfissures à Vf trop haute
    pc:            [80,  180],   // polycarbonate — ductile, copeaux filants
    abs_pom:       [100, 220],   // POM (Delrin) excellent, ABS risque fusion
  },
  // Diamant PCD — sources: Leuco, Leitz, Amana Tool PCD, Vortex Tool
  // PCD opère à Vc bien supérieure au carbure — 18 000-24 000 tr/min standard pro
  diamant_coupe: {
    bois_tendre:   [400, 700],   // pin/sapin — PCD tourne à haute Vc, géométrie faite pour ça
    bois_dur:      [350, 600],   // chêne/hêtre — légèrement inférieur au tendre
    bois_exotique: [300, 500],   // ipé/wengé — dense, Vc réduite mais toujours > carbure
    mdf:           [400, 650],   // MDF très abrasif mais PCD résiste bien
    ctp:           [400, 700],   // CTP — Vc élevée possible, PCD résiste aux colles
    melamine:      [380, 600],   // mélaminé — PCD = outil recommandé, Vc haute
  },
  // Compression — validé par Vortex Tool, Amana Tool, confirmé terrain (Jeremy MAGGIO)
  compression: {
    bois_tendre: [200, 450],   // Amana Tool recommande 20 000-21 000 tr/min
    bois_dur:    [160, 350],   // Vc légèrement inférieure au tendre
    mdf:         [200, 420],   // même ordre que carbure standard
    ctp:         [220, 450],   // CTP — compression = outil idéal
    melamine:    [380, 530],   // CONFIRMÉ: 18 000 tr/min min sur Ø8 = 452 m/min (Jeremy MAGGIO)
  },
  // Ravageuse — sources: Amana Tool chipbreaker, forum Woodweb, Practical Machinist
  ravageuse: {
    bois_tendre: [180, 380],   // corncob — Amana 20 000-21 000 RPM recommandé
    bois_dur:    [140, 300],   // Vc -20% vs tendre
    mdf:         [160, 320],   // abrasif, surveiller usure
    ctp:         [180, 380],   // similaire bois tendre
    alu_2017:    [100, 220],   // aluminium sans refroidissement — conservative
    alu_6060:    [150, 280],   // 6060 plus tendre que 2017
  },
  // HSS — sources: Practical Machinist, STEPCRAFT, Drill-Service.co.uk
  // HSS rare en CNC pro — carbure 10× plus rentable en production
  hss: {
    bois_tendre: [80,  130],   // ~91 m/min pratique max selon Practical Machinist
    bois_dur:    [60,  100],   // dur + résines → usure très rapide
    ctp:         [60,  100],   // colles abrasives = non recommandé pour HSS
    mdf:         [50,   90],   // MDF = HSS inutilisable en série
    alu_2017:    [60,  100],   // HSS alu: 60-90 m/min (Drill-Service.co.uk)
  },
};

// ─── fz tables (mm/dent) — indexed by DIAMETER_STEPS[toolType] ───────────────

export const FZ_TABLE: Record<ToolType, Partial<Record<Material, number[]>>> = {
  // Carbure monobloc — steps [2,3,4,6,8,10,12,16,20]
  // Référence: règle ~1-2% du diamètre, Onsrud, Vortex Tool, Techno CNC
  carbure_monobloc: {
    bois_tendre:   [0.030, 0.045, 0.060, 0.090, 0.120, 0.150, 0.180, 0.220, 0.270],
    bois_dur:      [0.025, 0.035, 0.045, 0.070, 0.090, 0.115, 0.140, 0.170, 0.210],
    bois_exotique: [0.018, 0.025, 0.032, 0.050, 0.068, 0.085, 0.100, 0.125, 0.155],
    mdf:           [0.025, 0.038, 0.050, 0.075, 0.095, 0.120, 0.145, 0.180, 0.220],
    ctp:           [0.030, 0.045, 0.060, 0.090, 0.120, 0.150, 0.180, 0.220, 0.270],
    melamine:      [0.022, 0.032, 0.042, 0.065, 0.085, 0.105, 0.130, 0.160, 0.195],
    // Aluminium — sources: Harvey Performance, Garr Tool, Machining Doctor
    // fz minimum anti-BUE (alu gummy si fz trop faible)
    alu_2017:      [0.006, 0.010, 0.013, 0.022, 0.030, 0.040, 0.050, 0.065, 0.080],
    alu_7075:      [0.005, 0.008, 0.011, 0.018, 0.025, 0.033, 0.042, 0.053, 0.065],
    alu_6060:      [0.008, 0.012, 0.016, 0.028, 0.040, 0.055, 0.065, 0.085, 0.105],
    alu_coule:     [0.005, 0.008, 0.011, 0.018, 0.024, 0.030, 0.038, 0.048, 0.058],
    // Plastiques — fz élevé = moins de chaleur = pas de fusion
    pvc_expanse:   [0.045, 0.060, 0.080, 0.115, 0.150, 0.185, 0.230, 0.275, 0.320],
    pvc_massif:    [0.035, 0.050, 0.065, 0.095, 0.120, 0.155, 0.185, 0.230, 0.275],
    pmma:          [0.030, 0.042, 0.058, 0.085, 0.110, 0.140, 0.170, 0.210, 0.255],
    pc:            [0.030, 0.042, 0.058, 0.085, 0.108, 0.140, 0.165, 0.200, 0.240],
    abs_pom:       [0.045, 0.060, 0.080, 0.115, 0.150, 0.185, 0.230, 0.275, 0.320],
  },
  // Diamant PCD — steps [3,6,8,10,12,16,20]
  // Vc bien plus élevée qu'en carbure → fz reste dans les mêmes ordres de grandeur
  diamant_coupe: {
    bois_tendre:   [0.045, 0.090, 0.125, 0.160, 0.190, 0.230, 0.275],
    bois_dur:      [0.035, 0.070, 0.100, 0.125, 0.150, 0.185, 0.220],
    bois_exotique: [0.028, 0.058, 0.082, 0.105, 0.128, 0.155, 0.188],
    mdf:           [0.045, 0.090, 0.125, 0.158, 0.185, 0.220, 0.265],
    ctp:           [0.045, 0.090, 0.135, 0.160, 0.195, 0.230, 0.275],
    melamine:      [0.035, 0.070, 0.100, 0.128, 0.158, 0.195, 0.230],
  },
  // Compression — steps [3,6,8,10,12,16,20]
  // Référence: Vortex Tool, Amana Tool, Onsrud — validé terrain
  compression: {
    bois_tendre: [0.032, 0.078, 0.112, 0.135, 0.168, 0.202, 0.248],
    bois_dur:    [0.027, 0.062, 0.090, 0.112, 0.135, 0.168, 0.202],
    mdf:         [0.032, 0.078, 0.112, 0.135, 0.168, 0.202, 0.248],
    ctp:         [0.035, 0.085, 0.122, 0.148, 0.180, 0.215, 0.260],
    melamine:    [0.027, 0.068, 0.100, 0.125, 0.148, 0.180, 0.215],
  },
  // Ravageuse — steps [6,8,10,12,16,20]
  // Festons permettent fz plus élevé que carbure standard
  ravageuse: {
    bois_tendre: [0.115, 0.160, 0.195, 0.230, 0.285, 0.340],
    bois_dur:    [0.090, 0.125, 0.150, 0.182, 0.228, 0.275],
    mdf:         [0.100, 0.138, 0.170, 0.205, 0.252, 0.300],
    ctp:         [0.115, 0.160, 0.195, 0.230, 0.285, 0.340],
    alu_2017:    [0.035, 0.055, 0.075, 0.095, 0.125, 0.155],
    alu_6060:    [0.048, 0.075, 0.095, 0.115, 0.148, 0.178],
  },
  // HSS — steps [3,6,8,10,12]
  // HSS moins rigide que carbure → fz conservateur pour éviter chatter/casse
  hss: {
    bois_tendre: [0.025, 0.050, 0.072, 0.095, 0.120],
    bois_dur:    [0.018, 0.035, 0.052, 0.070, 0.092],
    ctp:         [0.022, 0.045, 0.065, 0.085, 0.108],
    mdf:         [0.018, 0.035, 0.052, 0.068, 0.088],
    alu_2017:    [0.010, 0.018, 0.025, 0.032, 0.040],
  },
};

// ─── Operations: ap/ae coefficients ─────────────────────────────────────────

export interface OpParams {
  apFactor: number;
  aeFactor: number;
  apLabel: string;
  aeLabel: string;
  isFinition: boolean;
  noRctf: boolean;
}

export const OPERATION_PARAMS: Record<string, OpParams> = {
  detourage: {
    apFactor: 1.00, aeFactor: 0.125,
    apLabel: '1×D (détourage/profil)',
    aeLabel: '0.10–0.15×D (profil finition)',
    isFinition: true, noRctf: false,
  },
  rainurage: {
    apFactor: 0.50, aeFactor: 1.00,
    apLabel: '0.5×D (rainurage)',
    aeLabel: '1×D (pleine fraise)',
    isFinition: false, noRctf: true,
  },
  surfacage: {
    apFactor: 0.10, aeFactor: 0.675,
    apLabel: '0.1×D (surfaçage)',
    aeLabel: '0.60–0.75×D (surfaçage)',
    isFinition: false, noRctf: false,
  },
  contournage_ebauche: {
    apFactor: 0.50, aeFactor: 0.30,
    apLabel: '0.5×D (contournage ébauche)',
    aeLabel: '0.30×D (ébauche)',
    isFinition: false, noRctf: false,
  },
  poche_ebauche: {
    apFactor: 0.40, aeFactor: 0.50,
    apLabel: '0.4×D (poche ébauche)',
    aeLabel: '0.40–0.60×D (poche ébauche)',
    isFinition: false, noRctf: false,
  },
  poche_finition: {
    apFactor: 0.25, aeFactor: 0.10,
    apLabel: '0.25×D (poche finition)',
    aeLabel: '0.10–0.15×D (poche finition)',
    isFinition: true, noRctf: false,
  },
};

// ─── Coating Vc multipliers (section 4.1) ────────────────────────────────────

export const COATING_COEFF: Record<string, number> = {
  none:  1.00,
  tin:   1.25,
  tialn: 1.50,
  altin: 1.40,
  dlc:   1.30,
  zrn:   1.25,
};

// ─── Notation: Z and fz geometry correction ──────────────────────────────────

export const NOTATION_Z: Record<ToolNotation, number> = {
  '1+1': 2,
  '2+2': 4,
  '3+3': 6,
};

export const NOTATION_FZ_COEFF: Record<ToolNotation, number> = {
  '1+1': 1.00,
  '2+2': 0.90,
  '3+3': 0.80,
};

// ─── Vf_Z coefficient by material (section 9) ────────────────────────────────

export interface VfzInfo {
  coeff: number;
  mode: string;
}

export const VFZ_TABLE: Record<Material, VfzInfo> = {
  bois_tendre:   { coeff: 0.50, mode: 'Plongée directe OK' },
  bois_dur:      { coeff: 0.33, mode: 'Rampe linéaire 3-5°' },
  bois_exotique: { coeff: 0.33, mode: 'Rampe linéaire 3-5°' },
  mdf:           { coeff: 0.50, mode: 'Plongée directe OK' },
  ctp:           { coeff: 0.50, mode: 'Plongée directe OK' },
  melamine:      { coeff: 0.40, mode: 'Rampe linéaire 3-5°' },
  alu_2017:      { coeff: 0.25, mode: 'Rampe hélicoïdale OBLIGATOIRE' },
  alu_7075:      { coeff: 0.25, mode: 'Rampe hélicoïdale OBLIGATOIRE' },
  alu_6060:      { coeff: 0.25, mode: 'Rampe hélicoïdale OBLIGATOIRE' },
  alu_coule:     { coeff: 0.25, mode: 'Rampe hélicoïdale OBLIGATOIRE' },
  pvc_expanse:   { coeff: 0.50, mode: 'Plongée directe OK' },
  pvc_massif:    { coeff: 0.33, mode: 'Rampe linéaire 3-5°' },
  pmma:          { coeff: 0.33, mode: 'Rampe linéaire 3-5°' },
  pc:            { coeff: 0.33, mode: 'Rampe linéaire 3-5°' },
  abs_pom:       { coeff: 0.50, mode: 'Plongée directe OK' },
};

// ─── Forbidden combinations ───────────────────────────────────────────────────

export const FORBIDDEN_COMBOS: Array<{ tool: ToolType; materials: Material[]; msg: string }> = [
  {
    tool: 'diamant_coupe',
    materials: ['alu_2017','alu_7075','alu_6060','alu_coule'],
    msg: "INTERDIT — Fraise diamant incompatible avec l'aluminium.",
  },
  {
    tool: 'diamant_coupe',
    materials: ['pvc_expanse','pvc_massif','pmma','pc','abs_pom'],
    msg: 'INTERDIT — Fraise diamant incompatible avec les plastiques.',
  },
  {
    tool: 'compression',
    materials: ['alu_2017','alu_7075','alu_6060','alu_coule'],
    msg: "INTERDIT — Fraise compression non adaptée à l'aluminium.",
  },
];

// ─── Conseils par outil (section 14) ──────────────────────────────────────────

export const CONSEILS_OUTIL: Record<ToolType, string[]> = {
  carbure_monobloc: [
    'Démarrer à 60-70% des valeurs Vc/fz et augmenter progressivement.',
    'Sur alu : 1 ou 2 dents max, jamais à sec.',
    "Outil noircit ou bleuit → Vc trop élevée → réduire de 20%.",
    'Copeaux en paillettes → fz trop faible → augmenter Vf.',
    'Bons copeaux bois = copeaux longs et légers, pas de brûlure ni poussière fine.',
    'Bons copeaux alu = spirales argentées enroulées proprement.',
  ],
  diamant_coupe: [
    'Vc élevée recommandée — géométrie faite pour la vitesse sur bois.',
    'Soufflage copeaux impératif.',
    'Surveiller usure sur mélaminé/HDF (très abrasif).',
    'Z dans la formule = total des arêtes (2+2 → Z=4).',
    'JAMAIS sur métal ou plastique.',
  ],
  compression: [
    "Vérifier longueur zone upcut dans fiche outil AVANT de programmer.",
    "ap DOIT dépasser la zone upcut — sinon arrachement garanti.",
    "ap idéal = épaisseur totale de la matière si possible (une seule passe).",
    'Z dans la formule = total des arêtes (2+2 → Z=4).',
    'Vf légèrement plus élevée possible vs carbure standard.',
  ],
  ravageuse: [
    "ap jusqu'à 0.6×D grâce aux festons.",
    'ae max 0.5×D impératif.',
    'Toujours passe de finition outil lisse après (stries résiduelles).',
    "Sur alu : arrosage obligatoire, ae réduit à 0.25×D.",
  ],
  hss: [
    "Vc max absolument respectée → outil fond si dépassée.",
    'Jamais à sec sur alu → colle immédiatement.',
    'Uniquement bois tendre en petites séries.',
    'Carbure bien plus rentable en production CNC.',
  ],
};

// ─── Conseils par matière (section 15) ────────────────────────────────────────

export const CONSEILS_MATIERE: Record<Material, string[]> = {
  bois_tendre: [
    'Chip load 2% de D recommandé.',
    '1-2 dents recommandées, soufflage copeaux.',
    'Traces noires = n trop haut → réduire n, augmenter Vf.',
  ],
  bois_dur: [
    'Vc -20% vs bois tendre, carbure grain fin.',
    'Attention aux noeuds : réduire ap de 30%.',
    'Aspiration copeaux recommandée.',
  ],
  bois_exotique: [
    'ASPIRATION OBLIGATOIRE — poussières toxiques.',
    'Carbure grain fin ou diamant UNIQUEMENT.',
    'HSS inutilisable (usure en quelques secondes).',
    'Chip load 1% de D.',
  ],
  mdf: [
    'ASPIRATION PUISSANTE OBLIGATOIRE (formaldéhyde, silice).',
    'Masque FFP2/FFP3 minimum obligatoire.',
    'Outil usé très vite → changer fréquemment.',
    'Fraise carbure ou diamant — le HSS est inutilisable.',
  ],
  ctp: [
    'Fraise compression = solution idéale pour les deux faces nettes.',
    'Si pas compression : downcut pour protéger face visible.',
    'Colles des plis très abrasives — surveiller usure outil.',
  ],
  melamine: [
    'Revêtement corindon très abrasif — outil qualité supérieure obligatoire.',
    'Fraise compression 2+2 ou 3+3 = meilleur résultat deux faces.',
    'fz réduit de 15% vs bois dur.',
    'Arrachement décor irréparable → ne pas forcer fz.',
  ],
  alu_2017: [
    'MICROLUBRIFICATION ou arrosage continu OBLIGATOIRE.',
    '1 ou 2 dents maximum pour évacuation du copeau.',
    'Fraisage EN AVALANT uniquement.',
    'Rampe hélicoïdale obligatoire pour entrée en matière.',
    'Alu collé sur fraise → STOPPER immédiatement.',
    'Jamais fraise diamant ou compression sur alu.',
  ],
  alu_7075: [
    'Plus dur que 2017, arrosage obligatoire.',
    'Carbure 2 dents monobloc spécial alu.',
    'Rampe hélicoïdale obligatoire.',
  ],
  alu_6060: [
    'Plus tendre, copeau facile.',
    'Vc plus élevée possible vs 2017.',
    'Microlubrification recommandée.',
  ],
  alu_coule: [
    'Contient silicium → très abrasif.',
    'Arrosage obligatoire.',
    'Carbure grain fin spécial fonderie recommandé.',
  ],
  pvc_expanse: [
    "Basse broche + haute avance = règle d'or.",
    'Air comprimé (évacuation des copeaux).',
    'Risque fusion si Vc trop élevée — IRREVERSIBLE.',
    'Si fonte → réduire n de 30%, augmenter Vf de 20%.',
  ],
  pvc_massif: [
    'Sec ou air comprimé.',
    'fz élevé, n modéré.',
    'Comportement meilleur que PVC expansé.',
  ],
  pmma: [
    "Air comprimé UNIQUEMENT — JAMAIS d'eau (fissuration).",
    'Arête parfaitement affûtée obligatoire.',
    'Microfissures = Vf trop haute.',
    'Fonte = n trop élevé.',
  ],
  pc: [
    'Air comprimé.',
    'Matière ductile et gommeuse.',
    'Risque déchirure et bouchonnage copeau.',
  ],
  abs_pom: [
    'POM (Delrin) : excellent comportement, copeau propre.',
    'ABS : peut fondre, soufflage requis.',
    'Nylon : hygroscopique, surveiller chaleur.',
  ],
};

// ─── Diagnostic (section 16) ──────────────────────────────────────────────────

export const DIAGNOSTIC = [
  { symptome: 'Traces noires / brûlures bois',    cause: 'n trop élevé OU fz trop faible',           solution: 'Réduire n, augmenter Vf' },
  { symptome: 'Fraise noircit / bleuit',           cause: 'Vc trop élevée',                           solution: 'Réduire Vc de 20%' },
  { symptome: 'Copeaux en paillettes alu',         cause: 'fz trop faible',                           solution: 'Augmenter Vf ou réduire n' },
  { symptome: 'Aluminium collé sur fraise',        cause: 'T° trop haute, manque lubrification',      solution: 'STOPPER, nettoyer, lubrifier, réduire Vc' },
  { symptome: 'Arrachement face CTP',             cause: 'Mauvaise géométrie outil',                 solution: 'Utiliser compression ou downcut' },
  { symptome: 'Vibrations / broutage',            cause: 'fz trop faible OU porte-à-faux trop long', solution: 'Augmenter fz, réduire porte-à-faux' },
  { symptome: 'Casse fraise',                     cause: 'ap trop grand OU rigidité insuffisante',   solution: 'Réduire ap, vérifier serrage outil' },
  { symptome: 'Mauvais état de surface',          cause: 'Outil usé OU fz inadapté',                 solution: 'Changer outil, ajuster fz' },
  { symptome: 'PVC / PMMA fondu',                 cause: 'n trop élevé',                             solution: 'Réduire n fortement, augmenter Vf' },
  { symptome: 'Copeau qui bouchonne alu',         cause: 'Trop de dents (Z élevé)',                  solution: 'Passer à 1 ou 2 dents' },
  { symptome: 'Arrachement sur compression',     cause: 'ap < longueur zone upcut',                 solution: 'Augmenter ap ou changer outil' },
  { symptome: 'Surface striée après ravageuse',   cause: 'Normal — denture festonnée',               solution: 'Passe de finition outil lisse obligatoire' },
  { symptome: 'Fissures PMMA',                    cause: 'Vf trop élevée ou outil émoussé',          solution: 'Réduire Vf, changer outil' },
  { symptome: 'Arrachement mélaminé',            cause: 'fz trop élevé ou outil inadapté',          solution: 'Réduire fz de 15%, utiliser compression' },
];
