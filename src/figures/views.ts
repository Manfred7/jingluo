import type { ChannelId } from '../data/channels';
import placementsJson from '../data/placements.json';
import { armDorsal } from './armDorsal';
import { armPalmar } from './armPalmar';
import { back } from './back';
import { front } from './front';
import { headFront } from './headFront';
import { headSide } from './headSide';
import { legLateral } from './legLateral';
import { legMedial } from './legMedial';
import { mirror, type Vec } from './geometry';
import type { PathNode, ViewDef, ViewId } from './types';

export const VIEWS: ViewDef[] = [front, back, headFront, headSide, armPalmar, armDorsal, legLateral, legMedial];

export const viewById = (id: ViewId) => VIEWS.find((v) => v.id === id)!;

/** Правки из редактора: { view: { pointId: [x, y] } } — поверх мест по формулам */
export type Overrides = Partial<Record<ViewId, Record<string, Vec>>>;
export const OVERRIDES = placementsJson as Overrides;

export interface Placed {
  pointId: string;
  pos: Vec;
  /** Отражение на вторую сторону тела (не для правки) */
  mirrored?: boolean;
  /** Место поправлено вручную в редакторе */
  edited: boolean;
}

/** Точки на виде: формулы + правки; на симметричных видах — и отражения парных точек */
export function placementsOf(view: ViewDef, overrides: Overrides = OVERRIDES, bilateral?: (id: string) => boolean): Placed[] {
  const own = overrides[view.id] ?? {};
  const ids = [...new Set([...Object.keys(view.computed), ...Object.keys(own)])];
  const list: Placed[] = ids.map((pointId) => ({ pointId, pos: own[pointId] ?? view.computed[pointId], edited: pointId in own }));
  if (view.mirrorX === undefined || !bilateral) return list;
  const axis = view.mirrorX;
  return [...list, ...list.filter((p) => bilateral(p.pointId)).map((p) => ({ ...p, pos: mirror(p.pos, axis), mirrored: true }))];
}

/** Ход канала на виде — ветви как списки координат */
export function pathOf(view: ViewDef, channel: ChannelId, placed: Placed[]): Vec[][] {
  const raw = view.paths[channel];
  if (!raw?.length) return [];
  // Ветви — список списков: первый элемент сам список узлов (а не точка-id или координата [x, y])
  const first = raw[0];
  const isBranches = Array.isArray(first) && (typeof first[0] === 'string' || Array.isArray(first[0]));
  const branches = (isBranches ? raw : [raw]) as PathNode[][];
  const at = new Map(placed.filter((p) => !p.mirrored).map((p) => [p.pointId, p.pos]));
  return branches.map((nodes) => nodes.flatMap((n) => (typeof n === 'string' ? (at.has(n) ? [at.get(n)!] : []) : [n])));
}

/** Виды, где у канала есть точки или ход */
export const viewsOfChannel = (channel: ChannelId) =>
  VIEWS.filter((v) => v.paths[channel] || Object.keys(v.computed).some((id) => id.startsWith(`${channel}-`)));
