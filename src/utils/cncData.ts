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
  carbure_monobloc: {
    bois_tendre:   [200, 350],
    bois_dur:      [150, 280],
    bois_exotique: [100, 200],
    mdf:           [180, 320],
    ctp:           [200, 380],
    melamine:      [150, 280],
    alu_2017:      [150, 300],
    alu_7075:      [100, 200],
    alu_6060:      [200, 350],
    alu_coule:     [100, 180],
    pvc_expanse:   [150, 300],
    pvc_massif:    [80,  180],
    pmma:          [120, 250],
    pc:            [80,  160],
    abs_pom:       [100, 200],
  },
  diamant_coupe: {
    bois_tendre:   [300, 500],
    bois_dur:      [250, 450],
    bois_exotique: [200, 350],
    mdf:           [300, 500],
    ctp:           [300, 500],
    melamine:      [250, 450],
  },
  compression: {
    bois_tendre: [200, 400],
    bois_dur:    [160, 300],
    mdf:         [200, 380],
    ctp:         [220, 420],
    melamine:    [180, 360],
  },
  ravageuse: {
    bois_tendre: [180, 320],
    bois_dur:    [130, 250],
    mdf:         [160, 300],
    ctp:         [180, 350],
    alu_2017:    [100, 180],
    alu_6060:    [150, 250],
  },
  hss: {
    bois_tendre: [80,  150],
    bois_dur:    [60,  120],
    ctp:         [80,  150],
    mdf:         [60,  120],
    alu_2017:    [30,   80],
  },
};

// ─── fz tables (mm/dent) — indexed by DIAMETER_STEPS[toolType] ───────────────

export const FZ_TABLE: Record<ToolType, Partial<Record<Material, number[]>>> = {
  // Carbure — steps [2,3,4,6,8,10,12,16,20]
  carbure_monobloc: {
    bois_tendre:   [0.030, 0.040, 0.050, 0.070, 0.100, 0.120, 0.150, 0.180, 0.220],
    bois_dur:      [0.025, 0.030, 0.040, 0.060, 0.080, 0.100, 0.120, 0.150, 0.180],
    bois_exotique: [0.018, 0.025, 0.030, 0.045, 0.060, 0.075, 0.090, 0.110, 0.140],
    mdf:           [0.025, 0.035, 0.040, 0.060, 0.080, 0.100, 0.120, 0.150, 0.180],
    ctp:           [0.030, 0.040, 0.050, 0.070, 0.100, 0.120, 0.150, 0.180, 0.220],
    melamine:      [0.022, 0.030, 0.038, 0.055, 0.070, 0.090, 0.110, 0.130, 0.160],
    alu_2017:      [0.008, 0.012, 0.015, 0.020, 0.025, 0.030, 0.040, 0.050, 0.060],
    alu_7075:      [0.006, 0.010, 0.012, 0.018, 0.022, 0.028, 0.035, 0.042, 0.050],
    alu_6060:      [0.012, 0.016, 0.020, 0.025, 0.030, 0.040, 0.050, 0.060, 0.075],
    alu_coule:     [0.008, 0.010, 0.012, 0.016, 0.020, 0.025, 0.030, 0.038, 0.045],
    pvc_expanse:   [0.040, 0.055, 0.070, 0.100, 0.130, 0.160, 0.200, 0.240, 0.280],
    pvc_massif:    [0.030, 0.040, 0.055, 0.080, 0.100, 0.130, 0.160, 0.200, 0.240],
    pmma:          [0.030, 0.040, 0.055, 0.080, 0.100, 0.130, 0.160, 0.200, 0.240],
    pc:            [0.025, 0.035, 0.050, 0.070, 0.090, 0.120, 0.140, 0.170, 0.200],
    abs_pom:       [0.040, 0.055, 0.070, 0.100, 0.130, 0.160, 0.200, 0.240, 0.280],
  },
  // Diamant — steps [3,6,8,10,12,16,20] — apply notation correction after
  diamant_coupe: {
    bois_tendre:   [0.040, 0.080, 0.110, 0.140, 0.170, 0.200, 0.240],
    bois_dur:      [0.030, 0.060, 0.090, 0.110, 0.130, 0.160, 0.190],
    bois_exotique: [0.025, 0.050, 0.070, 0.090, 0.110, 0.130, 0.160],
    mdf:           [0.040, 0.080, 0.110, 0.140, 0.160, 0.190, 0.230],
    ctp:           [0.040, 0.080, 0.120, 0.140, 0.170, 0.200, 0.240],
    melamine:      [0.030, 0.060, 0.090, 0.110, 0.140, 0.170, 0.200],
  },
  // Compression — steps [3,6,8,10,12,16,20] — apply notation correction after
  compression: {
    bois_tendre: [0.030, 0.070, 0.100, 0.120, 0.150, 0.180, 0.220],
    bois_dur:    [0.025, 0.055, 0.080, 0.100, 0.120, 0.150, 0.180],
    mdf:         [0.030, 0.070, 0.100, 0.120, 0.150, 0.180, 0.220],
    ctp:         [0.032, 0.075, 0.110, 0.130, 0.160, 0.190, 0.230],
    melamine:    [0.025, 0.060, 0.090, 0.110, 0.130, 0.160, 0.190],
  },
  // Ravageuse — steps [6,8,10,12,16,20]
  ravageuse: {
    bois_tendre: [0.100, 0.140, 0.170, 0.200, 0.250, 0.300],
    bois_dur:    [0.080, 0.110, 0.130, 0.160, 0.200, 0.240],
    mdf:         [0.090, 0.120, 0.150, 0.180, 0.220, 0.260],
    ctp:         [0.100, 0.140, 0.170, 0.200, 0.250, 0.300],
    alu_2017:    [0.040, 0.060, 0.080, 0.100, 0.130, 0.160],
    alu_6060:    [0.050, 0.080, 0.100, 0.120, 0.150, 0.180],
  },
  // HSS — steps [3,6,8,10,12]
  hss: {
    bois_tendre: [0.020, 0.040, 0.060, 0.080, 0.100],
    bois_dur:    [0.015, 0.030, 0.045, 0.060, 0.080],
    ctp:         [0.020, 0.040, 0.060, 0.080, 0.100],
    mdf:         [0.015, 0.030, 0.045, 0.060, 0.075],
    alu_2017:    [0.008, 0.015, 0.020, 0.025, 0.030],
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
  { symptome: 'Outil qui racle en finition',      cause: 'Chip thinning ignoré (ae trop faible)',    solution: 'RCTF appliqué auto — vérifier fz' },
  { symptome: 'Arrachement mélaminé',            cause: 'fz trop élevé ou outil inadapté',          solution: 'Réduire fz de 15%, utiliser compression' },
];
