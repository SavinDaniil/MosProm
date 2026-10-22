import { visitors } from './scenario.ts';
import type { VisitorId, Interest } from './scenario.ts';

export type Phase = 'welcome' | 'briefing' | 'newspaper' | 'inspection' | 'result' | 'interest' | 'complete';
export type Decision = 'allow' | 'deny';
export type FieldKey = 'name' | 'badge' | 'zone' | 'purpose' | 'status' | 'number';
export interface Field { source: string; key: FieldKey; label: string; value: string }
export interface Comparison { a: Field; b: Field; kind: 'match' | 'mismatch' | 'unrelated' }
export interface Result { visitor: VisitorId; decision: Decision; correct: boolean; reason: string; resolved: boolean }
export interface GameState {
  version: 1;
  phase: Phase;
  visitor: VisitorId;
  requestsLeft: number;
  responses: Partial<Record<VisitorId, boolean>>;
  results: Result[];
  interests: Partial<Record<VisitorId, Interest>>;
  opened: { rules: boolean; journal: boolean };
  selected: Field | null;
  comparison: Comparison | null;
  checks: Record<VisitorId, string[]>;
  muted: boolean;
}
export const initialState = (): GameState => ({
  version: 1, phase: 'welcome', visitor: 'andrey', requestsLeft: 3, responses: {}, results: [], interests: {},
  opened: { rules: false, journal: false }, selected: null, comparison: null,
  checks: { andrey: [], elena: [] }, muted: true,
});

export function compare(a: Field, b: Field): Comparison {
  const normalize = (s: string) => s.trim().toLocaleLowerCase('ru').replace(/\s+/g, ' ');
  return { a, b, kind: a.key !== b.key ? 'unrelated' : normalize(a.value) === normalize(b.value) ? 'match' : 'mismatch' };
}

export function evaluateDecision(s: GameState, decision: Decision): Result {
  const resolved = s.visitor === 'andrey' || !!s.responses.elena;
  let correct = false;
  let reason = '';
  if (s.visitor === 'andrey') {
    correct = decision === 'allow';
    reason = correct
      ? 'Верно. Пропуск 0142 действителен. Линия № 2 и плановый осмотр совпадают в пропуске, заявке и журнале. Дополнительный запрос не требовался.'
      : 'Замечание: вы отказали инженеру с действительным допуском. Линия № 2 и плановый осмотр согласованы во всех документах. Оснований для отказа не было.';
  } else if (resolved) {
    correct = decision === 'allow';
    reason = correct
      ? 'Верно. Отдел исправил заявку на T-281. Теперь номер, зона и цель согласованы с журналом; противоречие разрешено.'
      : 'Замечание: после ответа отдела заявка исправлена на T-281. Документы согласованы, оснований отказывать больше нет.';
  } else if (decision === 'allow') {
    reason = 'Замечание: пропуск выдан до устранения противоречия. В заявке T-218, в журнале T-281. Совпадения зоны недостаточно — сначала нужен ответ отдела и исправленная заявка.';
  } else {
    correct = s.requestsLeft === 0;
    reason = correct
      ? 'Верно по памятке: запросов нет, а номера T-218 и T-281 не согласованы. В текущем проходе отказано, Елена направлена на переоформление. Это не обвинение в нарушении.'
      : 'Замечание: вы отказали до уточнения. Разные номера ещё не подтверждают нарушение допуска. Запросы доступны — следовало запросить ответ отдела и исправленную заявку.';
  }
  return { visitor: s.visitor, decision, correct, reason, resolved };
}

export type Action =
  | { type: 'start' } | { type: 'open'; document: string } | { type: 'newspaper' }
  | { type: 'inspect' } | { type: 'field'; field: Field } | { type: 'clear' }
  | { type: 'request' } | { type: 'decide'; decision: Decision } | { type: 'profession' }
  | { type: 'interest'; interest: Interest } | { type: 'check'; key: string } | { type: 'sound' };

export function transition(state: GameState, action: Action): GameState {
  const s = structuredClone(state);
  switch (action.type) {
    case 'start': if (s.phase === 'welcome') s.phase = 'briefing'; break;
    case 'open':
      if (action.document === 'rules') s.opened.rules = true;
      if (action.document === 'journal') s.opened.journal = true;
      break;
    case 'newspaper': if (s.phase === 'briefing' && s.opened.rules && s.opened.journal) { s.phase = 'newspaper'; s.selected = null; s.comparison = null; } break;
    case 'inspect': if (s.phase === 'newspaper') s.phase = 'inspection'; break;
    case 'field':
      if (s.phase !== 'inspection' && s.phase !== 'briefing') break;
      if (!s.selected || s.comparison) { s.selected = action.field; s.comparison = null; }
      else if (s.selected.source === action.field.source && s.selected.key === action.field.key) { s.selected = null; }
      else { s.comparison = compare(s.selected, action.field); }
      break;
    case 'clear': s.selected = null; s.comparison = null; break;
    case 'request':
      if (s.phase !== 'inspection' || s.responses[s.visitor] || s.requestsLeft <= 0) break;
      s.requestsLeft--;
      s.responses[s.visitor] = true;
      // A corrected document supersedes old selected data, never leaves a stale mismatch on screen.
      s.selected = null; s.comparison = null;
      break;
    case 'decide':
      if (s.phase !== 'inspection' || s.results.some(r => r.visitor === s.visitor)) break;
      s.results.push(evaluateDecision(s, action.decision));
      s.phase = 'result';
      break;
    case 'profession': if (s.phase === 'result') s.phase = 'interest'; break;
    case 'interest':
      if (s.phase !== 'interest' || !visitors[s.visitor].interests.some(i => i.id === action.interest)) break;
      s.interests[s.visitor] = action.interest;
      s.selected = null; s.comparison = null;
      if (s.visitor === 'andrey') { s.visitor = 'elena'; s.phase = 'inspection'; }
      else s.phase = 'complete';
      break;
    case 'check': {
      const list = s.checks[s.visitor];
      if (list.includes(action.key)) s.checks[s.visitor] = list.filter(x => x !== action.key);
      else list.push(action.key);
      break;
    }
    case 'sound': s.muted = !s.muted; break;
  }
  return s;
}

export const SAVE_KEY = 'ochakovo-smena-a-v1';
export function saveGame(s: GameState, storage?: Pick<Storage, 'setItem'>): boolean {
  try { (storage ?? localStorage).setItem(SAVE_KEY, JSON.stringify(s)); return true; } catch { return false; }
}

export function loadGame(storage?: Pick<Storage, 'getItem'>): GameState | null {
  try {
    const raw = (storage ?? localStorage).getItem(SAVE_KEY);
    if (!raw || raw.length > 20000) return null;
    const s = JSON.parse(raw);
    const phases: Phase[] = ['welcome','briefing','newspaper','inspection','result','interest','complete'];
    if (s.version !== 1 || !phases.includes(s.phase) || !['andrey','elena'].includes(s.visitor) ||
        !Number.isInteger(s.requestsLeft) || s.requestsLeft < 0 || s.requestsLeft > 3 ||
        !Array.isArray(s.results) || s.results.length > 2 || !s.responses || !s.interests ||
        !s.opened || typeof s.opened.rules !== 'boolean' || typeof s.opened.journal !== 'boolean' ||
        !s.checks || !Array.isArray(s.checks.andrey) || !Array.isArray(s.checks.elena) || typeof s.muted !== 'boolean') return null;
    const ids = new Set();
    for (const r of s.results) {
      if (!['andrey','elena'].includes(r.visitor) || ids.has(r.visitor) || !['allow','deny'].includes(r.decision)) return null;
      ids.add(r.visitor);
    }
    for (const id of ['andrey','elena'] as const) {
      if (s.responses[id] !== undefined && s.responses[id] !== true) return null;
      if (s.interests[id] !== undefined && !visitors[id].interests.some(i=>i.id===s.interests[id])) return null;
      if (s.checks[id].some((x: unknown) => typeof x !== 'string' || !['status','zone','purpose','journal'].includes(x as string))) return null;
    }
    if ((s.phase === 'result' || s.phase === 'interest') && !ids.has(s.visitor)) return null;
    if (s.phase === 'complete' && (!s.interests.elena || !s.interests.andrey || ids.size !== 2)) return null;
    // Selections are transient UI data. Recreate them from trusted scenario fields after a reload.
    return { ...initialState(), ...s, selected: null, comparison: null,
      results: s.results.map((r: Result) => evaluateDecision({ ...s, visitor: r.visitor, responses: { ...s.responses, [r.visitor]: r.resolved } }, r.decision)) };
  } catch { return null; }
}
