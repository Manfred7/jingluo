/** Уровни Лейтнера: 0 — не знаю, 5 — знаю твёрдо (как в sign-trainer / bazi-trainer) */
export const MAX_LEVEL = 5;
/** С этого уровня пара (точка × режим) считается освоенной */
export const MASTERED_LEVEL = 3;
/** Доля освоенных точек, при которой открывается следующая колода */
export const UNLOCK_SHARE = 0.8;

/** По чему ведётся прогресс: режим или направление режима, например 'locate' или 'quiz:marker>name' */
export type Track = string;

export interface PairStats {
  level: number;
  seen: number;
  correct: number;
}

export interface Progress {
  pairs: Record<string, PairStats>;
  /** Колоды, открытые по порогу; раз открытая колода больше не закрывается */
  unlocked: string[];
}

export const EMPTY_PROGRESS: Progress = { pairs: {}, unlocked: [] };

const pairKey = (pointId: string, track: Track) => `${pointId}:${track}`;

export const levelOf = (p: Progress, pointId: string, track: Track) => p.pairs[pairKey(pointId, track)]?.level ?? 0;

/** Верно — уровень растёт на 1, ошибка — пара возвращается на 0 */
export function recordResult(p: Progress, pointId: string, track: Track, ok: boolean): Progress {
  const key = pairKey(pointId, track);
  const prev = p.pairs[key] ?? { level: 0, seen: 0, correct: 0 };
  const next: PairStats = {
    level: ok ? Math.min(MAX_LEVEL, prev.level + 1) : 0,
    seen: prev.seen + 1,
    correct: prev.correct + (ok ? 1 : 0),
  };
  return { ...p, pairs: { ...p.pairs, [key]: next } };
}

/** Доля освоенных точек колоды в режиме, 0…1 */
export function mastery(p: Progress, pointIds: string[], track: Track): number {
  if (!pointIds.length) return 0;
  return pointIds.filter((id) => levelOf(p, id, track) >= MASTERED_LEVEL).length / pointIds.length;
}

const KEY = 'jingluo:progress';

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<Progress>;
    // Битые записи пар отбрасываем: иначе уровень станет NaN и больше не исправится
    const pairs: Record<string, PairStats> = {};
    if (parsed.pairs && typeof parsed.pairs === 'object') {
      for (const [key, v] of Object.entries(parsed.pairs as Record<string, Partial<PairStats>>)) {
        const ok = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0;
        if (v && ok(v.level) && ok(v.seen) && ok(v.correct)) {
          pairs[key] = { level: Math.min(MAX_LEVEL, Math.floor(v.level)), seen: v.seen, correct: v.correct };
        }
      }
    }
    return {
      pairs,
      unlocked: Array.isArray(parsed.unlocked) ? parsed.unlocked.filter((id) => typeof id === 'string') : [],
    };
  } catch {
    return EMPTY_PROGRESS;
  }
}

export function saveProgress(p: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // хранилище недоступно — прогресс живёт до перезагрузки
  }
}
