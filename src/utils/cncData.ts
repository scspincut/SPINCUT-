import { ToolType, Material, ToolNotation } from '../types';

// ─── Labels ──────────────────────────────────────────────────────────────────

export const TOOL_TYPE_LABELS: Record<ToolType, string> = {
  carbure_monobloc: 'Carbure monobloc',
  diamant_coupe:    'Coupe Diamant (1+1 / 2+2 / 3+3)',
  compression:      'Fraise Compression (1+1 / 2+2 / 3+3)',
  ravageuse:        'Ravageuse (ébauche uniquement)',
};

export const MATERIAL_LABELS: Record<Material, string> = {
  bois_tendre:        'Bois tendre (pin, sapin, épicéa, peuplier)',
  bois_dur:           'Bois dur (chêne, hêtre, noyer, frêne, érable)',
  bois_exotique:      'Bois exotique / dense (ipé, teck, wengé, ébène)',
  mdf:                'MDF / Médium',
  ctp:                'Contreplaqué (CTP bouleau, peuplier)',
  melamine:           'Mélaminé / HDF mélaminé',
  panneau_stratifie:  'Stratifié HPL (Formica, Trespa, Abet Laminati)',
  alu_2017:           'Aluminium 2017A / 2024 (dural)',
  alu_7075:           'Aluminium 7075 (avionique)',
  alu_6060:           'Aluminium 6060 / 6082 (profilé)',
  alu_coule:          'Aluminium coulé / fonderie (AS7, AS9)',
  pvc:                'PVC (expansé Forex/Sintra — massif rigide)',
  pmma:               'PMMA / Plexiglass / Acrylique',
  pc:                 'Polycarbonate (PC / Makrolon)',
  abs_pom:            'ABS / POM / Nylon',
};

export const OPERATION_LABELS: Record<string, string> = {
  decoupe: 'Découpe',
  rainure: 'Rainure',
  poche:   'Poche',
  gravure: 'Gravure',
  // anciens codes (historique localStorage)
  detourage:           'Découpe',
  rainurage:           'Rainure',
  surfacage:           'Poche',
  contournage_ebauche: 'Découpe',
  poche_ebauche:       'Poche',
  poche_finition:      'Poche',
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
    'bois_tendre','bois_dur','bois_exotique','mdf','ctp','melamine','panneau_stratifie',
    'alu_2017','alu_7075','alu_6060','alu_coule',
    'pvc','pmma','pc','abs_pom',
  ],
  diamant_coupe: ['bois_tendre','bois_dur','bois_exotique','mdf','ctp','melamine','panneau_stratifie'],
  compression:   ['bois_tendre','bois_dur','mdf','ctp','melamine'],
  ravageuse:     ['bois_tendre','bois_dur','mdf','ctp','alu_2017','alu_6060'],
};

// ─── Diameter steps per tool (from reference tables) ─────────────────────────

export const DIAMETER_STEPS: Record<ToolType, number[]> = {
  carbure_monobloc: [2, 3, 4, 6, 8, 10, 12, 16, 20],
  diamant_coupe:    [3, 6, 8, 10, 12, 16, 20],
  compression:      [3, 6, 8, 10, 12, 16, 20],
  ravageuse:        [6, 8, 10, 12, 16, 20],
};

export const DIAMETER_OPTIONS = [2, 3, 4, 6, 8, 10, 12, 16, 20];
export const TEETH_OPTIONS = [1, 2, 3, 4, 6];

// ─── Vc table [min, max] — Vc_cible = (min+max)/2 ────────────────────────────

type VcEntry = [number, number];

export const VC_TABLE: Record<ToolType, Partial<Record<Material, VcEntry>>> = {
  // Carbure monobloc — sources: Onsrud, Vortex Tool, Amana Tool, Leuco, Harvey Performance
  carbure_monobloc: {
    bois_tendre:       [300, 650],
    bois_dur:          [250, 550],
    bois_exotique:     [150, 350],
    mdf:               [280, 600],
    ctp:               [300, 650],
    melamine:          [260, 520],
    panneau_stratifie: [180, 400],   // HPL ultra-abrasif (Formica/Trespa) — Vc réduite vs mélaminé
    alu_2017:          [150, 350],
    alu_7075:          [100, 280],
    alu_6060:          [200, 480],
    alu_coule:         [100, 260],
    pvc:               [150, 400],   // PVC expansé (Forex) ou massif — fusion si Vc trop haute
    pmma:              [150, 460],
    pc:                [150, 380],
    abs_pom:           [100, 320],
  },
  // Diamant PCD — sources: Leitz Diamaster PRO³, Amana DRB-250, Onsrud, Wirutex
  diamant_coupe: {
    bois_tendre:       [400, 900],
    bois_dur:          [350, 700],
    bois_exotique:     [300, 600],
    mdf:               [400, 900],
    ctp:               [400, 900],
    melamine:          [380, 750],
    panneau_stratifie: [350, 700],   // HPL — PCD FORTEMENT RECOMMANDÉ (corindon ultra-abrasif)
  },
  // Compression — Vortex Tool, Amana Tool, confirmé terrain
  compression: {
    bois_tendre: [350, 600],
    bois_dur:    [280, 540],
    mdf:         [300, 560],
    ctp:         [350, 600],
    melamine:    [380, 530],   // CONFIRMÉ TERRAIN
  },
  // Ravageuse — Amana chipbreaker
  ravageuse: {
    bois_tendre: [320, 600],
    bois_dur:    [260, 500],
    mdf:         [280, 540],
    ctp:         [320, 600],
    alu_2017:    [100, 220],
    alu_6060:    [150, 280],
  },
};

// ─── fz tables (mm/dent) — indexed by DIAMETER_STEPS[toolType] ───────────────

export const FZ_TABLE: Record<ToolType, Partial<Record<Material, number[]>>> = {
  // Carbure monobloc — steps [2,3,4,6,8,10,12,16,20]
  carbure_monobloc: {
    bois_tendre:       [0.030, 0.045, 0.060, 0.090, 0.120, 0.150, 0.180, 0.220, 0.270],
    bois_dur:          [0.025, 0.035, 0.045, 0.070, 0.090, 0.115, 0.140, 0.170, 0.210],
    bois_exotique:     [0.018, 0.025, 0.032, 0.050, 0.068, 0.085, 0.100, 0.125, 0.155],
    mdf:               [0.030, 0.045, 0.058, 0.088, 0.110, 0.140, 0.168, 0.208, 0.255],
    ctp:               [0.030, 0.045, 0.060, 0.090, 0.120, 0.150, 0.180, 0.220, 0.270],
    melamine:          [0.022, 0.032, 0.042, 0.065, 0.085, 0.105, 0.130, 0.160, 0.195],
    panneau_stratifie: [0.018, 0.028, 0.036, 0.055, 0.073, 0.092, 0.113, 0.140, 0.170],   // HPL — fz prudent, ultra-abrasif
    alu_2017:          [0.006, 0.010, 0.013, 0.022, 0.030, 0.040, 0.050, 0.065, 0.080],
    alu_7075:          [0.005, 0.008, 0.011, 0.018, 0.025, 0.033, 0.042, 0.053, 0.065],
    alu_6060:          [0.008, 0.012, 0.016, 0.028, 0.040, 0.055, 0.065, 0.085, 0.105],
    alu_coule:         [0.005, 0.008, 0.011, 0.018, 0.024, 0.030, 0.038, 0.048, 0.058],
    pvc:               [0.045, 0.060, 0.080, 0.115, 0.150, 0.185, 0.230, 0.275, 0.320],   // fz ÉLEVÉ anti-fusion
    pmma:              [0.037, 0.052, 0.072, 0.105, 0.135, 0.165, 0.201, 0.248, 0.301],
    pc:                [0.037, 0.052, 0.072, 0.105, 0.135, 0.165, 0.195, 0.236, 0.283],
    abs_pom:           [0.045, 0.060, 0.080, 0.115, 0.150, 0.185, 0.230, 0.275, 0.320],
  },
  // Diamant PCD — steps [3,6,8,10,12,16,20]
  diamant_coupe: {
    bois_tendre:       [0.045, 0.090, 0.125, 0.160, 0.190, 0.230, 0.275],
    bois_dur:          [0.035, 0.070, 0.100, 0.125, 0.150, 0.185, 0.220],
    bois_exotique:     [0.028, 0.058, 0.082, 0.105, 0.128, 0.155, 0.188],
    mdf:               [0.045, 0.090, 0.125, 0.158, 0.185, 0.220, 0.265],
    ctp:               [0.045, 0.090, 0.135, 0.160, 0.195, 0.230, 0.275],
    melamine:          [0.035, 0.070, 0.100, 0.128, 0.158, 0.195, 0.230],
    panneau_stratifie: [0.028, 0.060, 0.088, 0.112, 0.138, 0.170, 0.205],   // HPL — PCD fortement recommandé
  },
  // Compression — steps [3,6,8,10,12,16,20]
  compression: {
    bois_tendre: [0.032, 0.078, 0.112, 0.135, 0.168, 0.202, 0.248],
    bois_dur:    [0.027, 0.062, 0.090, 0.112, 0.135, 0.168, 0.202],
    mdf:         [0.032, 0.078, 0.112, 0.135, 0.168, 0.202, 0.248],
    ctp:         [0.035, 0.085, 0.122, 0.148, 0.180, 0.215, 0.260],
    melamine:    [0.027, 0.068, 0.100, 0.125, 0.148, 0.180, 0.215],
  },
  // Ravageuse — steps [6,8,10,12,16,20]
  ravageuse: {
    bois_tendre: [0.115, 0.160, 0.195, 0.230, 0.285, 0.340],
    bois_dur:    [0.090, 0.125, 0.150, 0.182, 0.228, 0.275],
    mdf:         [0.100, 0.138, 0.170, 0.205, 0.252, 0.300],
    ctp:         [0.115, 0.160, 0.195, 0.230, 0.285, 0.340],
    alu_2017:    [0.035, 0.065, 0.075, 0.095, 0.125, 0.155],
    alu_6060:    [0.048, 0.085, 0.095, 0.115, 0.148, 0.178],
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
  decoupe: {
    apFactor: 1.00, aeFactor: 1.00,
    apLabel: '1×D par passe',
    aeLabel: '100% (pleine fraise)',
    isFinition: false, noRctf: true,
  },
  rainure: {
    apFactor: 0.50, aeFactor: 1.00,
    apLabel: '0.5×D par passe',
    aeLabel: 'pleine fraise (100%)',
    isFinition: false, noRctf: true,
  },
  poche: {
    apFactor: 0.40, aeFactor: 0.50,
    apLabel: '0.4×D par passe',
    aeLabel: '50% du diamètre',
    isFinition: false, noRctf: false,
  },
  gravure: {
    apFactor: 0.05, aeFactor: 0.20,
    apLabel: '~0.3–0.5mm par passe',
    aeLabel: '20% du diamètre',
    isFinition: true, noRctf: false,
  },
  // anciens codes (fallback historique)
  detourage:           { apFactor: 1.00, aeFactor: 0.125, apLabel: '1×D', aeLabel: '12%D', isFinition: true,  noRctf: false },
  rainurage:           { apFactor: 0.50, aeFactor: 1.00,  apLabel: '0.5×D', aeLabel: '100%', isFinition: false, noRctf: true  },
  surfacage:           { apFactor: 0.10, aeFactor: 0.675, apLabel: '0.1×D', aeLabel: '67%', isFinition: false, noRctf: false },
  contournage_ebauche: { apFactor: 0.50, aeFactor: 0.30,  apLabel: '0.5×D', aeLabel: '30%', isFinition: false, noRctf: false },
  poche_ebauche:       { apFactor: 0.40, aeFactor: 0.50,  apLabel: '0.4×D', aeLabel: '50%', isFinition: false, noRctf: false },
  poche_finition:      { apFactor: 0.25, aeFactor: 0.10,  apLabel: '0.25×D', aeLabel: '10%', isFinition: true, noRctf: false },
};

// ─── Coating Vc multipliers ───────────────────────────────────────────────────

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

// ─── Vf_Z coefficient by material ────────────────────────────────────────────

export interface VfzInfo {
  coeff: number;
  mode: string;
}

export const VFZ_TABLE: Record<Material, VfzInfo> = {
  bois_tendre:       { coeff: 0.50, mode: 'Plongée directe OK' },
  bois_dur:          { coeff: 0.33, mode: 'Rampe linéaire 3-5°' },
  bois_exotique:     { coeff: 0.33, mode: 'Rampe linéaire 3-5°' },
  mdf:               { coeff: 0.50, mode: 'Plongée directe OK' },
  ctp:               { coeff: 0.50, mode: 'Plongée directe OK' },
  melamine:          { coeff: 0.40, mode: 'Rampe linéaire 3-5°' },
  panneau_stratifie: { coeff: 0.40, mode: 'Rampe linéaire 3-5°' },
  alu_2017:          { coeff: 0.25, mode: 'Rampe hélicoïdale OBLIGATOIRE' },
  alu_7075:          { coeff: 0.25, mode: 'Rampe hélicoïdale OBLIGATOIRE' },
  alu_6060:          { coeff: 0.25, mode: 'Rampe hélicoïdale OBLIGATOIRE' },
  alu_coule:         { coeff: 0.25, mode: 'Rampe hélicoïdale OBLIGATOIRE' },
  pvc:               { coeff: 0.50, mode: 'Plongée directe OK' },
  pmma:              { coeff: 0.33, mode: 'Rampe linéaire 3-5°' },
  pc:                { coeff: 0.33, mode: 'Rampe linéaire 3-5°' },
  abs_pom:           { coeff: 0.50, mode: 'Plongée directe OK' },
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
    materials: ['pvc','pmma','pc','abs_pom'],
    msg: 'INTERDIT — Fraise diamant incompatible avec les plastiques.',
  },
  {
    tool: 'compression',
    materials: ['alu_2017','alu_7075','alu_6060','alu_coule'],
    msg: "INTERDIT — Fraise compression non adaptée à l'aluminium.",
  },
];

// ─── Conseils par outil ───────────────────────────────────────────────────────

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
    'Surveiller usure sur HPL/mélaminé (très abrasif).',
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
};

// ─── Conseils par matière ─────────────────────────────────────────────────────

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
    'ASPIRATION OBLIGATOIRE — poussières toxiques (ipé, wengé).',
    'Carbure grain fin ou diamant UNIQUEMENT.',
    'Chip load 1% de D.',
  ],
  mdf: [
    'ASPIRATION PUISSANTE OBLIGATOIRE (formaldéhyde, silice).',
    'Masque FFP2/FFP3 minimum obligatoire.',
    'Outil usé très vite → changer fréquemment.',
    'Fraise carbure ou diamant uniquement.',
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
  panneau_stratifie: [
    'HPL ultra-abrasif (corindon) — FRAISE DIAMANT PCD fortement recommandée.',
    'Carbure monobloc possible mais durée de vie très courte.',
    'fz prudent, Vc modérée vs mélaminé standard.',
    'Trespa / Formica : couper en découpe nette, pas de stries.',
    'Jamais de fraise compression.',
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
  pvc: [
    "Basse broche + haute avance = règle d'or.",
    'fz élevé (1.5-2% D), n modéré.',
    'Air comprimé uniquement (évacuation copeaux).',
    'Risque fusion si Vc trop élevée — IRREVERSIBLE.',
    'PVC massif : meilleur comportement que Forex.',
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

// ─── Diagnostic ───────────────────────────────────────────────────────────────

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
  { symptome: 'Arrachement mélaminé / HPL',       cause: 'fz trop élevé ou outil inadapté',          solution: 'Réduire fz, utiliser diamant ou compression' },
];

// ─── Guide Matières & Outils (référence pro) ──────────────────────────────────

export interface MatGuide {
  nom: string
  cat: string
  z: string       // nombre de dents recommandé (ex: "Z=2", "Z=1-2", "Z=4-6")
  pm?: boolean    // Fraise Polimiroir recommandée (plastiques)
  premier: ToolType[]
  aussi: ToolType[]
  eviter: string
  astuce: string
}

export const MATERIAL_GUIDE: MatGuide[] = [
  // ── BOIS MASSIF ──
  { nom: 'Bois massif résineux', cat: 'Bois massif',
    z: 'Z=2', premier: ['carbure_monobloc', 'ravageuse'], aussi: ['compression'],
    eviter: '',
    astuce: 'Pin, sapin, épicéa, peuplier. fz 2% D. Copeaux longs = bon signe.' },
  { nom: 'Bois massif feuillu', cat: 'Bois massif',
    z: 'Z=2-3', premier: ['carbure_monobloc'], aussi: ['diamant_coupe', 'ravageuse'],
    eviter: '',
    astuce: 'Chêne, hêtre, frêne, noyer. Vc -15 à -20% vs résineux. Aspiration.' },
  { nom: 'Bois exotique / dense', cat: 'Bois massif',
    z: 'Z=2', premier: ['carbure_monobloc', 'diamant_coupe'], aussi: [],
    eviter: '',
    astuce: 'Ipé, teck, wengé, ébène. ASPIRATION OBLIGATOIRE (poussières toxiques). Carbure grain fin.' },

  // ── PANNEAUX ──
  { nom: 'MDF / Médium', cat: 'Panneaux',
    z: 'Z=2 max', premier: ['carbure_monobloc', 'diamant_coupe'], aussi: ['compression'],
    eviter: '',
    astuce: 'ASPIRATION PUISSANTE + masque FFP2 obligatoires (silice, formaldéhyde). Outil use vite.' },
  { nom: 'Contreplaqué (CTP)', cat: 'Panneaux',
    z: 'Z=2-4', premier: ['compression', 'diamant_coupe'], aussi: ['carbure_monobloc'],
    eviter: '',
    astuce: 'Compression 2+2/3+3 = deux faces nettes. Colles entre plis très abrasives.' },
  { nom: 'Mélaminé', cat: 'Panneaux',
    z: 'Z=4-6', premier: ['compression', 'diamant_coupe'], aussi: ['carbure_monobloc'],
    eviter: 'Ravageuse',
    astuce: 'Corindon très abrasif. Compression 2+2 ou 3+3 recommandée. fz -15% vs bois.' },
  { nom: 'Stratifié HPL (Formica, Trespa…)', cat: 'Panneaux',
    z: 'Z=2-4', premier: ['diamant_coupe'], aussi: ['carbure_monobloc'],
    eviter: 'Compression',
    astuce: 'Ultra-abrasif. PCD FORTEMENT RECOMMANDÉ. Carbure = usure très rapide.' },
  { nom: 'Compact (HPL massif, Trespa Athlon…)', cat: 'Panneaux',
    z: 'Z=2-4', premier: ['diamant_coupe'], aussi: ['carbure_monobloc'],
    eviter: 'Compression',
    astuce: 'Plus abrasif que HPL simple. PCD obligatoire pour la durée de vie.' },

  // ── ALUMINIUM ──
  { nom: 'Aluminium (toutes nuances)', cat: 'Aluminium',
    z: 'Z=1-2', pm: true, premier: ['carbure_monobloc'], aussi: ['ravageuse'],
    eviter: 'Diamant PCD, compression',
    astuce: 'Microlubrification OBLIGATOIRE. Rampe hélicoïdale. En avalant uniquement. 2017 = le + dur.' },

  // ── PLASTIQUES ──
  { nom: 'PVC (Forex, Sintra, massif)', cat: 'Plastiques',
    z: 'Z=1-2', pm: true, premier: ['carbure_monobloc'], aussi: [],
    eviter: 'Vc élevée = fusion IRREVERSIBLE',
    astuce: 'Polimiroir recommandé. Basse broche + haute avance. Air comprimé.' },
  { nom: 'PMMA / Acrylique', cat: 'Plastiques',
    z: 'Z=1', pm: true, premier: ['carbure_monobloc'], aussi: [],
    eviter: "Eau (fissuration), Vc élevée",
    astuce: 'Polimiroir 1 dent = finition miroir. Air comprimé UNIQUEMENT.' },
  { nom: 'PC / ABS / POM', cat: 'Plastiques',
    z: 'Z=1-2', pm: true, premier: ['carbure_monobloc'], aussi: [],
    eviter: 'Vc élevée',
    astuce: 'Polimiroir recommandé. fz élevé anti-bouchonnage. POM = le + facile à usiner.' },
];

export interface ToolGuide {
  matieres_optimales: string
  eviter: string
  conseil: string
}

export const TOOL_GUIDE: Record<ToolType, ToolGuide> = {
  carbure_monobloc: {
    matieres_optimales: 'Tous bois massifs (résineux, feuillus, exotiques), MDF, CTP, Mélaminé, HPL, Aluminium, tous plastiques',
    eviter: 'Inox, acier, titane',
    conseil: 'Outil universel. 1-2 dents pour plastiques/alu, 2-3 dents pour bois. Grain fin pour matières dures.',
  },
  diamant_coupe: {
    matieres_optimales: 'HPL Formica/Trespa (idéal), Mélaminé, MDF, CTP, Bois exotiques denses',
    eviter: 'Aluminium (INTERDIT), plastiques (INTERDIT), inox',
    conseil: 'Investissement sur matières ultra-abrasives. Durée de vie 5-10× carbure sur MDF/HPL. Vc élevée recommandée.',
  },
  compression: {
    matieres_optimales: 'Mélaminé (meilleur résultat deux faces), CTP bouleau, MDF, Bois massif épaisseur pleine',
    eviter: 'Aluminium (INTERDIT), plastiques, HPL',
    conseil: 'ap DOIT dépasser zone upcut. Idéal = épaisseur totale en une passe. Vérifier fiche outil.',
  },
  ravageuse: {
    matieres_optimales: 'Bois tendre/dur en ébauche rapide, MDF ébauche, CTP, Alu 6060/2017',
    eviter: 'Finition impossible (stries), plastiques, HPL',
    conseil: 'Toujours passe de finition outil lisse après. ap 0.6×D possible. Sur alu : arrosage + ae réduit.',
  },
};
