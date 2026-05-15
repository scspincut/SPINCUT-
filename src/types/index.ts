export type ToolType = 'carbure_monobloc' | 'diamant_coupe' | 'compression' | 'ravageuse' | 'hss';
export type ToolNotation = '1+1' | '2+2' | '3+3';
export type Material =
  | 'bois_tendre' | 'bois_dur' | 'bois_exotique'
  | 'mdf' | 'ctp' | 'melamine'
  | 'alu_2017' | 'alu_7075' | 'alu_6060' | 'alu_coule'
  | 'pvc_expanse' | 'pvc_massif' | 'pmma' | 'pc' | 'abs_pom';
export type Operation =
  | 'detourage' | 'rainurage' | 'surfacage'
  | 'contournage_ebauche' | 'poche_ebauche' | 'poche_finition';
export type MachineType = 'hobby' | 'semi_pro' | 'pro_portique' | 'centre_usinage';
export type Coating = 'none' | 'tin' | 'tialn' | 'altin' | 'dlc' | 'zrn';

export interface CalculatorParams {
  toolType: ToolType;
  notation: ToolNotation;
  material: Material;
  operation: Operation;
  diameter: number;
  zTeeth: number;
  machineType: MachineType;
  coating: Coating;
  nMax: number | null;
  vfMax: number | null;
  materialThickness: number | null;
  apOverride: number | null;
}

export interface CalculationResult {
  forbidden: false;
  n: number;
  nTheo: number;
  nLimited: boolean;
  vf: number;
  vfTheo: number;
  vfLimited: boolean;
  vc: number;
  vcMin: number;
  vcMax: number;
  fzTable: number;
  fzCorrige: number;
  fzReel: number;
  rctf: number | null;
  zCalc: number;
  ap: number;
  ae: number;
  apLabel: string;
  aeLabel: string;
  vfZ: number;
  vfZCoeff: number;
  modeEntree: string;
  mrr: number;
  nPasses: number | null;
  apReel: number;
  alerts: Alert[];
}

export interface ForbiddenResult {
  forbidden: true;
  message: string;
}

export type CalcResult = CalculationResult | ForbiddenResult;

export interface Alert {
  type: 'info' | 'warning' | 'danger';
  message: string;
}

export interface AccessCode {
  id: string;
  code: string;
  active: boolean;
  createdAt: string;
  clientName?: string;
  clientPhone?: string;
}
