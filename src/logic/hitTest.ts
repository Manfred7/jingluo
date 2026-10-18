import type { Vec } from '../figures/geometry';
import type { Placed } from '../figures/views';
import type { TapVerdict } from './quizTypes';

/**
 * placed — все точки вида (с отражениями); tap и tolerance — в координатах viewBox; cunPx — view.cun.
 * ok: ближайшее место верной точки (любая сторона для парных) не дальше tolerance И ближайшая к нажатию точка вида — верная.
 */
export function judgeTap(placed: Placed[], targetId: string, tap: Vec, tolerance: number, cunPx: number): TapVerdict {
  if (!placed.length) throw new Error('Невозможно оценить нажатие: на виде нет точек.');
  const targets = placed.filter((item) => item.pointId === targetId);
  if (!targets.length) throw new Error(`Точка ${targetId} не размещена на этом виде.`);

  const distanceTo = (item: Placed) => Math.hypot(item.pos[0] - tap[0], item.pos[1] - tap[1]);
  let nearest = placed[0];
  let nearestDistance = distanceTo(nearest);
  for (const item of placed.slice(1)) {
    const distance = distanceTo(item);
    if (distance < nearestDistance) {
      nearest = item;
      nearestDistance = distance;
    }
  }

  let target = targets[0];
  let targetDistance = distanceTo(target);
  for (const item of targets.slice(1)) {
    const distance = distanceTo(item);
    if (distance < targetDistance) {
      target = item;
      targetDistance = distance;
    }
  }

  return {
    ok: targetDistance <= tolerance && nearest.pointId === targetId,
    nearestId: nearest.pointId,
    distanceCun: targetDistance / cunPx,
    targetPos: target.pos,
  };
}
