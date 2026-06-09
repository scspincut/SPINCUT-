import { CalculatorParams, ToolNotation } from '../types';

const MAX_HISTORY = 10;

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

function historyKey(clientCode: string | null) {
  return `spincut_calc_history_${clientCode ?? 'guest'}`;
}

export function loadHistory(clientCode: string | null): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(historyKey(clientCode)) || '[]');
  } catch { return []; }
}

export function saveHistory(entries: HistoryEntry[], clientCode: string | null): void {
  try {
    localStorage.setItem(historyKey(clientCode), JSON.stringify(entries.slice(0, MAX_HISTORY)));
  } catch {}
}

export function pushToHistory(entry: HistoryEntry, clientCode: string | null): HistoryEntry[] {
  const history = loadHistory(clientCode);
  const last = history[0];
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
  saveHistory(trimmed, clientCode);
  return trimmed;
}

export function deleteFromHistory(id: string, clientCode: string | null): HistoryEntry[] {
  const updated = loadHistory(clientCode).filter(e => e.id !== id);
  saveHistory(updated, clientCode);
  return updated;
}
