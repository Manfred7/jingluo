import { mirror, mirrorShape, smoothPath, type Shape, type Vec } from './geometry';
import type { ViewDef } from './types';

/**
 * Тело спереди, анатомическая позиция (ладони вперёд). Правая сторона человека — слева на рисунке.
 * Масштаб: 16 px на цунь. Пропорции ВОЗ: между сосками 8 цуней, мечевидный отросток — пупок 8,
 * пупок — верхний край лобкового симфиза 5.
 */
const CUN = 16;
const AXIS = 200;

export const L = {
  clavicle: 182,
  nipple: [AXIS - 4 * CUN, 256] as Vec,
  xiphoid: 300,
  navel: 428,
  pubis: 428 + 5 * CUN,
  /** Кадык */
  larynx: 146,
  noseAla: [AXIS - 10, 92] as Vec,
};

/** Правая половина тела (слева на рисунке); левая получается зеркалом */
const RIGHT: Shape[] = [
  { kind: 'capsule', a: [58, 216], b: [44, 398], ra: 25, rb: 20 }, // плечо
  { kind: 'capsule', a: [44, 398], b: [34, 556], ra: 19, rb: 13 }, // предплечье
  { kind: 'capsule', a: [34, 560], b: [30, 640], ra: 15, rb: 11 }, // кисть
  { kind: 'capsule', a: [154, 534], b: [160, 690], ra: 46, rb: 28 }, // бедро
  { kind: 'capsule', a: [160, 690], b: [168, 800], ra: 27, rb: 16 }, // голень
  { kind: 'capsule', a: [168, 806], b: [158, 826], ra: 15, rb: 11 }, // стопа
];

const TORSO_RIGHT: Vec[] = [
  [168, 168], [110, 176], [70, 188], [56, 206], [92, 262], [102, 330], [110, 400], [104, 470], [110, 522], [150, 562],
];

const SHAPES: Shape[] = [
  { kind: 'ellipse', c: [AXIS, 76], rx: 44, ry: 54 }, // голова
  { kind: 'capsule', a: [AXIS, 120], b: [AXIS, 172], ra: 38, rb: 44 }, // шея
  { kind: 'blob', pts: [...TORSO_RIGHT, [AXIS, 568], ...TORSO_RIGHT.map((p) => mirror(p, AXIS)).reverse()] },
  ...RIGHT,
  ...RIGHT.map((s) => mirrorShape(s, AXIS)),
];

const both = (pts: Vec[]) => [smoothPath(pts), smoothPath(pts.map((p) => mirror(p, AXIS)))];

const DETAILS: string[] = [
  // лицо: глаза, нос, рот
  ...both([[176, 70], [184, 67], [192, 70]]),
  smoothPath([[196, 74], [194, 90], L.noseAla, [200, 96], [210, 92], [206, 90], [204, 74]]),
  smoothPath([[188, 108], [200, 111], [212, 108]]),
  // кадык, ключицы
  `M${AXIS - 4},${L.larynx}q4,6 8,0`,
  ...both([[188, 178], [150, L.clavicle], [112, L.clavicle - 2], [80, 190]]),
  // соски
  ...both([L.nipple, [L.nipple[0] + 0.5, L.nipple[1]]]),
  ...[L.nipple, mirror(L.nipple, AXIS)].map(([x, y]) => `M${x - 3},${y}a3,3 0 1,0 6,0a3,3 0 1,0 -6,0`),
  // мечевидный отросток и рёберные дуги
  `M${AXIS - 6},${L.xiphoid - 10}L${AXIS},${L.xiphoid}L${AXIS + 6},${L.xiphoid - 10}`,
  ...both([[AXIS - 2, L.xiphoid - 2], [170, 322], [140, 352], [118, 372]]),
  // пупок, лобковый симфиз
  `M${AXIS - 4},${L.navel}a4,4 0 1,0 8,0a4,4 0 1,0 -8,0`,
  smoothPath([[176, L.pubis + 8], [AXIS, L.pubis], [224, L.pubis + 8]]),
  // паховые складки, надколенники
  ...both([[112, 500], [150, 528], [186, 552]]),
  ...[[160, 684], [240, 684]].map(([x, y]) => `M${x - 12},${y}a12,14 0 1,0 24,0a12,14 0 1,0 -24,0`),
];

const COMPUTED: Record<string, Vec> = {
  // 6 цуней латеральнее передней срединной линии, в 1-м межреберье, на 1 цунь ниже LU-2 (подключичная ямка)
  'LU-1': [AXIS - 6 * CUN, L.clavicle + 2 * CUN],
  // Вершина плеча, под акромионом спереди
  'LI-15': [56, 197],
  // На уровне кадыка, между ножками грудино-ключично-сосцевидной мышцы (3 цуня латеральнее)
  'LI-18': [AXIS - 3 * CUN + 6, L.larynx + 4],
  // У середины наружного края крыла носа, в носогубной складке
  'LI-20': [L.noseAla[0] - 3, L.noseAla[1]],
};

export const front: ViewDef = {
  id: 'front',
  title: 'Спереди',
  width: 400,
  height: 840,
  cun: CUN,
  shapes: SHAPES,
  details: DETAILS,
  mirrorX: AXIS,
  computed: COMPUTED,
  paths: {
    // От LU-1 к плечу и по передне-латеральной стороне руки к большому пальцу
    LU: ['LU-1', [78, 222], [44, 300], [36, 400], [31, 500], [27, 580], [24, 628]],
    // От указательного пальца по лучевой стороне руки к плечу, шее и крылу носа
    // (у Мачоча канал пересекается под носом и заканчивается на противоположной стороне — отразить в атласе позже)
    LI: [[26, 640], [22, 560], [27, 470], [26, 400], [31, 300], [38, 236], 'LI-15', [112, 178], 'LI-18', [176, 120], 'LI-20'],
  },
};
