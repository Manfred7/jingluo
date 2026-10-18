import { MAX_LEVEL } from './progress';

/**
 * Следующая карточка сессии. Пока есть ещё не показанные в сессии — берём из них,
 * чтобы каждая выпала хотя бы раз (unseenFirst); дальше с весом MAX_LEVEL + 1 − уровень (слабые чаще).
 * Одна карточка не выпадает дважды подряд, если есть из чего выбрать.
 */
export function pickNext<T extends { id: string }>(pool: T[], shownIds: string[], levelOf: (id: string) => number): T {
  const shown = new Set(shownIds);
  const fresh = pool.filter((x) => !shown.has(x.id));
  const prevId = shownIds[shownIds.length - 1];
  const base = fresh.length ? fresh : pool;
  const candidates = base.length > 1 ? base.filter((x) => x.id !== prevId) : base;
  const weighted = candidates.map((x) => ({ x, w: MAX_LEVEL + 1 - levelOf(x.id) }));
  let r = Math.random() * weighted.reduce((sum, item) => sum + item.w, 0);
  return (weighted.find((item) => (r -= item.w) < 0) ?? weighted[weighted.length - 1]).x;
}
