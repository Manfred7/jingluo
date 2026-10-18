import { across, along, add, mul, normal, smoothPath, sub, unit, type Shape, type Vec } from './geometry';
import type { ViewDef } from './types';

/**
 * Правая рука, ладонная сторона (анатомическая позиция: ладонь к зрителю).
 * Лучевая сторона (большой палец) — слева, локтевая (мизинец) — справа.
 * Масштаб: 20 px на цунь. Пропорции ВОЗ: передняя подмышечная складка — локтевая складка 9 цуней,
 * локтевая складка — запястная складка 12 цуней.
 */
const CUN = 20;
const AXIS = 120;

/** Ориентиры */
export const L = {
  axillaFold: 100,
  elbow: 280, // локтевая складка
  wrist: 520, // дистальная запястная складка
  bicepsTendonX: 113,
  /** I пястная кость: основание → головка */
  mc1Base: [90, 545] as Vec,
  mc1Head: [64, 600] as Vec,
  thumbTip: [42, 641] as Vec,
};

const SHAPES: Shape[] = [
  { kind: 'capsule', a: [AXIS, 52], b: [AXIS, L.elbow], ra: 50, rb: 55 }, // плечо
  { kind: 'capsule', a: [AXIS, L.elbow], b: [AXIS, L.wrist - 4], ra: 56, rb: 34 }, // предплечье
  {
    kind: 'blob', // ладонь
    pts: [[88, 516], [120, 512], [154, 516], [170, 556], [176, 600], [168, 620], [132, 624], [98, 620], [86, 590], [84, 548]],
  },
  { kind: 'capsule', a: L.mc1Base, b: L.mc1Head, ra: 19, rb: 14 }, // тенар и I пястная
  { kind: 'capsule', a: L.mc1Head, b: L.thumbTip, ra: 13.5, rb: 11 }, // большой палец
  { kind: 'capsule', a: [104, 614], b: [102, 692], ra: 9.5, rb: 8 }, // указательный
  { kind: 'capsule', a: [125, 616], b: [125, 705], ra: 10, rb: 8.5 }, // средний
  { kind: 'capsule', a: [146, 616], b: [148, 696], ra: 9.5, rb: 8 }, // безымянный
  { kind: 'capsule', a: [165, 612], b: [169, 672], ra: 8.5, rb: 7 }, // мизинец
];

const DETAILS: string[] = [
  // локтевая складка и сухожилие двуглавой мышцы
  smoothPath([[72, L.elbow + 2], [120, L.elbow - 4], [170, L.elbow + 2]]),
  `M${L.bicepsTendonX},${L.elbow - 34}L${L.bicepsTendonX + 1},${L.elbow + 4}`,
  // запястные складки
  smoothPath([[90, L.wrist], [120, L.wrist + 3], [152, L.wrist]]),
  smoothPath([[92, L.wrist - 10], [120, L.wrist - 8], [150, L.wrist - 10]]),
  // ладонные линии: тенар, поперечные
  smoothPath([[100, 604], [94, 576], [102, 545], [116, 530]]),
  smoothPath([[108, 590], [138, 582], [170, 586]]),
  smoothPath([[96, 572], [124, 568], [150, 574]]),
  // межфаланговые складки
  ...[[104, 650], [125, 656], [147, 652], [167, 640]].map(([x, y]) => `M${x - 7},${y}L${x + 7},${y}`),
  'M50,618L62,612',
];

const lu5: Vec = [L.bicepsTendonX - 15, L.elbow];
const lu9: Vec = [97, L.wrist];
const thumbDir = unit(sub(L.thumbTip, L.mc1Head));

const COMPUTED: Record<string, Vec> = {
  // На локтевой складке, с лучевой стороны от сухожилия двуглавой мышцы
  'LU-5': lu5,
  // На запястной складке, с лучевой стороны от лучевой артерии
  'LU-9': lu9,
  // 7 цуней выше LU-9 на линии LU-9 — LU-5 (12 цуней)
  'LU-6': along(lu9, lu5, 7, 12),
  // 1,5 цуня выше запястной складки, над шиловидным отростком лучевой кости (у края)
  'LU-7': [88, L.wrist - 1.5 * CUN],
  // Середина I пястной кости, на границе красной и белой кожи (лучевой край)
  'LU-10': across(add(L.mc1Base, mul(sub(L.mc1Head, L.mc1Base), 0.5)), L.mc1Base, L.mc1Head, 12),
  // Лучевая сторона большого пальца, 0,1 цуня от угла ногтевого ложа
  'LU-11': add(add(L.thumbTip, mul(thumbDir, -4)), mul(unit(normal(thumbDir)), 7)),
};

export const armPalmar: ViewDef = {
  id: 'arm-palmar',
  title: 'Рука, ладонь',
  width: 240,
  height: 730,
  cun: CUN,
  shapes: SHAPES,
  details: DETAILS,
  computed: COMPUTED,
  paths: {
    // Из грудной клетки (LU-1) по передне-латеральному краю плеча к большому пальцу
    LU: [[86, 40], [90, 160], 'LU-5', 'LU-6', 'LU-7', 'LU-9', 'LU-10', 'LU-11'],
  },
};
