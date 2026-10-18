import type { ChannelId } from '../data/channels';
import { pointById } from '../data/points';
import type { Vec } from '../figures/geometry';
import type { ViewDef, ViewId } from '../figures/types';
import { placementsOf, type Placed, VIEWS, viewById, viewsOfChannel } from '../figures/views';

export const isBilateral = (id: string) => pointById(id)?.bilateral ?? false;

/** Сначала крупные виды (рука, нога, голова), потом общие — на них точку легче различить */
const PRIORITY: ViewId[] = ['arm-palmar', 'arm-dorsal', 'leg-lateral', 'leg-medial', 'head-front', 'head-side', 'front', 'back'];

export interface PointPlacement {
  view: ViewDef;
  /** Все точки вида (с правками редактора и отражениями) — для хит-теста и неверных вариантов */
  placed: Placed[];
  /** Место самой точки (не отражение) */
  pos: Vec;
}

const cache = new Map<ViewId, Placed[]>();
/** Точки вида с правками редактора и отражениями парных точек */
export function placedOn(view: ViewDef): Placed[] {
  if (!cache.has(view.id)) cache.set(view.id, placementsOf(view, undefined, isBilateral));
  return cache.get(view.id)!;
}

/** Лучший вид для точки; undefined — точка ещё не размещена ни на одном виде */
export function placementFor(pointId: string): PointPlacement | undefined {
  for (const id of PRIORITY) {
    const view = viewById(id);
    if (!view) continue;
    const placed = placedOn(view);
    const own = placed.find((p) => p.pointId === pointId && !p.mirrored);
    if (own) return { view, placed, pos: own.pos };
  }
  return undefined;
}

/** Виды, где у канала нарисован ход, в порядке VIEWS */
export const channelViews = (channel: ChannelId): ViewDef[] =>
  viewsOfChannel(channel).filter((v) => v.paths[channel]);

export { VIEWS };
