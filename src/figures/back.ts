import { lerp, mirror, smoothPath, type Vec } from './geometry';
import { SHAPES } from './front';
import type { ViewDef } from './types';

/**
 * Тело сзади. Правая сторона человека — справа на рисунке. Силуэт тот же, что спереди.
 * Масштаб туловища: 16 px на цунь; от задней срединной линии до внутренней линии BL — 1,5 цуня,
 * до внешней — 3 цуня (медиальный край лопатки).
 */
const CUN = 16;
const AXIS = 200;

/** Уровни остистых отростков: C7, T1–T12, L1–L5, крестцовые отверстия S1–S4 */
const C7 = 172;
const T = (n: number) => C7 + 14 * n;
const Lv = (n: number) => T(12) + 18 * n;
const S = (n: number) => Lv(5) + 16 + 14 * (n - 1);
/** «Под остистым отростком» — середина между позвонками */
const below = (y: number, step = 14) => y + step / 2;

const inner = (y: number): Vec => [AXIS + 1.5 * CUN, y];
const outer = (y: number): Vec => [AXIS + 3 * CUN, y];
const mid = (y: number): Vec => [AXIS, y];

/** Задний край роста волос по срединной линии; n цуней выше него */
const hairline = 140;
const aboveHair = (n: number): Vec => mid(hairline - n * CUN);

const trochanter: Vec = [292, 526];
const sacralHiatus: Vec = [AXIS, 506];

const both = (pts: Vec[]) => [smoothPath(pts), smoothPath(pts.map((p) => mirror(p, AXIS)))];

const DETAILS: string[] = [
  // линия роста волос, позвоночник (остистые отростки — точками)
  smoothPath([[176, hairline - 4], [AXIS, hairline], [224, hairline - 4]]),
  ...[C7, ...Array.from({ length: 12 }, (_, i) => T(i + 1)), ...Array.from({ length: 5 }, (_, i) => Lv(i + 1))].map(
    (y) => `M${AXIS - 1.5},${y}a1.5,1.5 0 1,0 3,0a1.5,1.5 0 1,0 -3,0`,
  ),
  // лопатки: медиальный край, ость
  ...both([[248, T(2)], [250, T(5)], [254, T(7)], [282, T(6) + 4], [294, T(2)]]),
  ...both([[250, T(3) + 2], [300, 196]]),
  // гребни подвздошных костей, крестец, ягодичные складки
  ...both([[214, Lv(4)], [260, Lv(3)], [296, Lv(4) + 10]]),
  smoothPath([[186, S(1) - 8], [AXIS, sacralHiatus[1] + 4], [214, S(1) - 8]]),
  ...both([[206, 566], [240, 576], [280, 568]]),
  // подколенные складки
  ...both([[226, 720], [238, 722], [250, 720]]),
];

const COMPUTED: Record<string, Vec> = {
  // Мочевой пузырь, внутренняя линия: 1,5 цуня от срединной линии на уровне нижнего края остистого отростка
  'BL-10': [AXIS + 1.3 * CUN, aboveHair(0.5)[1]], // на уровне Du-15 (верхний край остистого отростка C2), латеральнее трапециевидной мышцы
  'BL-11': inner(below(T(1))),
  'BL-12': inner(below(T(2))),
  'BL-13': inner(below(T(3))),
  'BL-14': inner(below(T(4))),
  'BL-15': inner(below(T(5))),
  'BL-17': inner(below(T(7))),
  'BL-18': inner(below(T(9))),
  'BL-19': inner(below(T(10))),
  'BL-20': inner(below(T(11))),
  'BL-21': inner(below(T(12))),
  'BL-22': inner(below(Lv(1), 18)),
  'BL-23': inner(below(Lv(2), 18)),
  'BL-25': inner(below(Lv(4), 18)),
  'BL-27': inner(S(1)), // на уровне 1-го крестцового отверстия
  'BL-28': inner(S(2)),
  'BL-32': [AXIS + 0.8 * CUN, S(2)], // во 2-м заднем крестцовом отверстии
  // Внешняя линия: 3 цуня от срединной линии
  'BL-42': outer(below(T(3))),
  'BL-43': outer(below(T(4))),
  'BL-44': outer(below(T(5))),
  'BL-47': outer(below(T(9))),
  'BL-49': outer(below(T(11))),
  'BL-52': outer(below(Lv(2), 18)),
  // Середина подколенной складки
  'BL-40': [238, 722],

  // Ду-май: по задней срединной линии под остистыми отростками
  'DU-1': [AXIS, 516], // между верхушкой копчика и анусом
  'DU-2': sacralHiatus,
  'DU-3': mid(below(Lv(4), 18)),
  'DU-4': mid(below(Lv(2), 18)),
  'DU-9': mid(below(T(7))),
  'DU-11': mid(below(T(5))),
  'DU-12': mid(below(T(3))),
  'DU-13': mid(below(T(1))),
  'DU-14': mid(below(C7)),
  'DU-15': aboveHair(0.5), // 0,5 цуня выше заднего края роста волос
  'DU-16': aboveHair(1), // 1 цунь выше края роста волос, под наружным затылочным бугром
  'DU-17': aboveHair(2.5), // над наружным затылочным бугром, 1,5 цуня выше Du-16
  'DU-19': aboveHair(5.5), // 1,5 цуня позади Du-20
  'DU-20': aboveHair(7), // макушка: 7 цуней от заднего края роста волос (подробнее — вид головы)

  // Тонкий кишечник на лопатке и плече
  'SI-9': [318, 244], // 1 цунь выше задней подмышечной складки
  'SI-10': [314, 208], // над SI-9, под остью лопатки
  'SI-11': [272, 240], // центр подостной ямки
  'SI-12': [276, 198], // центр надостной ямки, над SI-11

  // Тройной обогреватель
  'TB-14': [338, 198], // сзади и книзу от акромиона

  // Желчный пузырь
  'GB-20': [226, aboveHair(1)[1]], // под затылочной костью, между грудино-ключично-сосцевидной и трапециевидной мышцами, на уровне Du-16
  'GB-21': [272, 182], // середина линии Du-14 — акромион
  'GB-30': lerp(trochanter, sacralHiatus, 1 / 3), // ⅓ от большого вертела к крестцовой щели
};

export const back: ViewDef = {
  id: 'back',
  title: 'Сзади',
  width: 400,
  height: 940,
  cun: CUN,
  shapes: SHAPES,
  details: DETAILS,
  mirrorX: AXIS,
  computed: COMPUTED,
  paths: {
    BL: [
      ['BL-10', 'BL-11', 'BL-12', 'BL-13', 'BL-14', 'BL-15', 'BL-17', 'BL-18', 'BL-19', 'BL-20', 'BL-21', 'BL-22', 'BL-23', 'BL-25', 'BL-27', 'BL-28', 'BL-32', [234, 560], [236, 640], 'BL-40'],
      [[AXIS + 3 * CUN, 182], 'BL-42', 'BL-43', 'BL-44', 'BL-47', 'BL-49', 'BL-52', [252, 480], [244, 600], 'BL-40', [234, 820]],
    ],
    DU: ['DU-1', 'DU-2', 'DU-3', 'DU-4', 'DU-9', 'DU-11', 'DU-12', 'DU-13', 'DU-14', 'DU-15', 'DU-16', 'DU-17', 'DU-19', 'DU-20'],
    SI: [[352, 330], 'SI-9', 'SI-10', 'SI-11', 'SI-12', [250, 170]],
    GB: ['GB-20', 'GB-21', [300, 330], [296, 460], 'GB-30'],
  },
};
