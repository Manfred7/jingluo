import { across, along, add, mirrorShape, mul, normal, smoothPath, sub, unit, type Vec } from './geometry';
import { armPalmar, L as P } from './armPalmar';
import type { ViewDef } from './types';

/**
 * Правая рука, тыльная сторона (смотрим со спины). Это зеркало ладонного вида:
 * лучевая сторона (большой палец) — справа. Те же уровни локтя и запястья, 20 px на цунь.
 */
const CUN = 20;
const W = armPalmar.width;
const AXIS = W / 2;

/** II пястная кость (указательный): основание → головка */
const mc2Base: Vec = [132, 528];
const mc2Head: Vec = [136, 612];
const indexTip: Vec = [138, 692];

const DETAILS: string[] = [
  // локтевой отросток и надмыщелок плечевой кости
  smoothPath([[108, 292], [120, 300], [132, 292]]),
  `M${AXIS - 8},${P.elbow - 10}a8,8 0 1,0 16,0`,
  // тыльная складка запястья
  smoothPath([[90, P.wrist], [120, P.wrist + 2], [152, P.wrist]]),
  // сухожилия к пальцам (веером)
  ...[[mc2Base, mc2Head], [[121, 530], [115, 614]], [[112, 532], [94, 612]], [[104, 536], [75, 608]]].map(([a, b]) =>
    smoothPath([a as Vec, b as Vec]),
  ),
  // ногти
  ...[[138, 688], [115, 701], [94, 692], [72, 668]].map(([x, y]) => `M${x - 5},${y - 12}h10v9q-5,4 -10,0Z`),
  // анатомическая табакерка
  smoothPath([[146, 512], [152, 528], [160, 540]]),
];

const li11: Vec = [173, P.elbow];
const li5: Vec = [149, P.wrist + 2];
const li15: Vec = [160, 44];

const COMPUTED: Record<string, Vec> = {
  // Лучевая сторона указательного пальца, 0,1 цуня от угла ногтевого ложа
  'LI-1': add(add(indexTip, mul(unit(sub(indexTip, mc2Head)), -4)), mul(unit(normal(sub(indexTip, mc2Head))), -9)),
  // Тыл кисти, у середины II пястной кости с лучевой стороны
  'LI-4': across(add(mc2Base, mul(sub(mc2Head, mc2Base), 0.5)), mc2Base, mc2Head, -15),
  // Анатомическая табакерка, лучевой край тыльной складки запястья
  'LI-5': li5,
  // 3, 5 и 10 цуней выше LI-5 на линии LI-5 — LI-11 (12 цуней)
  'LI-6': along(li5, li11, 3, 12),
  'LI-7': along(li5, li11, 5, 12),
  'LI-10': along(li5, li11, 10, 12),
  // Латеральный конец локтевой складки (локоть согнут), посередине между LU-5 и надмыщелком
  'LI-11': li11,
  // 7 цуней выше LI-11 на линии LI-11 — LI-15, у прикрепления дельтовидной мышцы
  'LI-14': along(li11, li15, 7, 9.5),
  // Вершина плеча, во впадине под акромионом (рука отведена)
  'LI-15': li15,
};

export const armDorsal: ViewDef = {
  id: 'arm-dorsal',
  title: 'Рука, тыл',
  width: W,
  height: armPalmar.height,
  cun: CUN,
  shapes: armPalmar.shapes.map((s) => mirrorShape(s, AXIS)),
  details: DETAILS,
  computed: COMPUTED,
  paths: {
    // От указательного пальца по лучевому краю тыла предплечья к плечу
    LI: ['LI-1', [140, 640], 'LI-4', 'LI-5', 'LI-6', 'LI-7', 'LI-10', 'LI-11', [170, 200], 'LI-14', 'LI-15'],
  },
};
