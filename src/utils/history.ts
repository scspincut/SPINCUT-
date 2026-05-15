import { CalculatorParams, ToolNotation } from '../types';

const HISTORY_KEY = 'spincut_calc_history';
const MAX_HISTORY = 20;

export interface HistoryEntry {
  id: string;
  timestamp: number;
  params: {
    toolType: CalculatorParams['toolType'];
    notation: ToolNotation;
    material: CalculatorParams['material'];
    operation: CalculatorParams['operation'];
    diameter: number;
    zTeeth: number;
    nMax: string;
    vfMax: string;
    thickness: string;
  };
  result: {
    n: number;
    vf: number;
    vc: number;
  };
}

export function loadHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch { return []; }
}

export function pushToHistory(entry: HistoryEntry): HistoryEntry[] {
  const history = loadHistory();
  const last = history[0];
  // Replace last entry if same core params (fine-tuning nMax/vfMax)
  const isSame = last &&
    last.params.toolType  === entry.params.toolType  &&
    last.params.material  === entry.params.material  &&
    last.params.operation === entry.params.operation &&
    last.params.diameter  === entry.params.diameter  &&
    last.params.zTeeth    === entry.params.zTeeth    &&
    last.params.notation  === entry.params.notation;

  const updated = isSame
    ? [entry, ...history.slice(1)]
    : [entry, ...history];

  const trimmed = updated.slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  return trimmed;
}

export function groupByDay(entries: HistoryEntry[]): [string, HistoryEntry[]][] {
  const groups = new Map<string, HistoryEntry[]>();
  const now = new Date();
  const todayStr = now.toDateString();
  const yesterdayStr = new Date(now.getTime() - 86400000).toDateString();

  for (const entry of entries) {
    const d = new Date(entry.timestamp);
    const label =
      d.toDateString() === todayStr     ? "Aujourd'hui" :
      d.toDateString() === yesterdayStr ? "Hier" :
      d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    const arr = groups.get(label) ?? [];
    arr.push(entry);
    groups.set(label, arr);
  }
  return [...groups.entries()];
}
