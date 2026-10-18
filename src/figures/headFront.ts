import { mirror, smoothPath, type Shape, type Vec } from './geometry';
import type { ViewDef } from './types';

/**
 * Голова спереди. Правая сторона человека — слева на рисунке.
 * Масштаб: 14 px на цунь. Пропорции ВОЗ: межбровье — передний край роста волос 3 цуня,
 * между углами роста волос (ST-8) 9 цуней.
 */
const CUN = 14;
const AXIS = 150;

export const L = {
  hairline: 80,
  glabella: 122,
  eye: 138,
  pupilX: AXIS - 32,
  ala: 178,
  mouth: 206,
  chin: 226,
};

const SHAPES: Shape[] = [
  { kind: 'ellipse', c: [AXIS, 140], rx: 96, ry: 116 },
  { kind: 'ellipse', c: [52, 152], rx: 12, ry: 28 },
  { kind: 'ellipse', c: [248, 152], rx: 12, ry: 28 },
  { kind: 'capsule', a: [AXIS, 240], b: [AXIS, 330], ra: 52, rb: 64 },
];

const both = (pts: Vec[]) => [smoothPath(pts), smoothPath(pts.map((p) => mirror(p, AXIS)))];

const DETAILS: string[] = [
  // линия роста волос
  smoothPath([[70, 96], [86, 74], [120, 66], [AXIS, L.hairline - 16], [180, 66], [214, 74], [230, 96]]),
  // брови, глаза
  ...both([[136, L.glabella - 2], [118, L.glabella - 6], [98, L.glabella - 2]]),
  ...both([[139, L.eye], [128, L.eye - 6], [112, L.eye - 6], [100, L.eye]]),
  ...both([[139, L.eye], [124, L.eye + 5], [100, L.eye]]),
  ...[L.pupilX, mirror([L.pupilX, 0], AXIS)[0]].map((x) => `M${x - 3},${L.eye - 1}a3,3 0 1,0 6,0a3,3 0 1,0 -6,0`),
  // нос, губной желобок, рот
  smoothPath([[143, L.eye + 2], [140, 166], [136, L.ala], [144, L.ala + 6], [AXIS, L.ala + 4], [156, L.ala + 6], [164, L.ala], [160, 166], [157, L.eye + 2]]),
  `M${AXIS - 4},${L.ala + 8}L${AXIS - 3},${L.mouth - 8}M${AXIS + 4},${L.ala + 8}L${AXIS + 3},${L.mouth - 8}`,
  smoothPath([[126, L.mouth], [AXIS, L.mouth + 4], [174, L.mouth]]),
  smoothPath([[136, L.chin - 6], [AXIS, L.chin - 2], [164, L.chin - 6]]),
];

const at = (d: number, y: number): Vec => [AXIS - d * CUN, y];

const COMPUTED: Record<string, Vec> = {
  // Желудок
  'ST-1': [L.pupilX, L.eye + 14], // под зрачком, между глазным яблоком и краем глазницы
  'ST-2': [L.pupilX, L.eye + 28], // в подглазничном отверстии
  'ST-3': [L.pupilX, L.ala + 2], // под зрачком на уровне нижнего края крыла носа
  'ST-4': [120, L.mouth + 2], // 0,4 цуня кнаружи от угла рта
  'ST-8': at(4.5, L.hairline - 8), // 0,5 цуня внутри угла роста волос, 4,5 цуня от срединной линии

  // Толстый кишечник
  'LI-20': [132, L.ala - 2], // у середины наружного края крыла носа

  // Мочевой пузырь
  'BL-1': [139, L.eye - 3], // чуть выше внутреннего угла глаза
  'BL-2': [137, L.glabella - 2], // у внутреннего конца брови

  // Желчный пузырь
  'GB-1': [93, L.eye], // 0,5 цуня кнаружи от наружного угла глаза
  'GB-13': at(3, L.hairline + 4), // 0,5 цуня внутри роста волос, 3 цуня от срединной линии
  'GB-14': [L.pupilX, L.glabella - 18], // 1 цунь выше середины брови, над зрачком
  'GB-15': [L.pupilX, L.hairline - 2], // над зрачком, 0,5 цуня внутри роста волос

  // Тройной обогреватель
  'TB-23': [97, L.glabella - 2], // во впадине у наружного конца брови

  // Ду-май и Жэнь-май
  'DU-23': [AXIS, L.hairline - 30], // 1 цунь внутри переднего края роста волос
  'DU-24': [AXIS, L.hairline - 23], // 0,5 цуня внутри
  'DU-26': [AXIS, L.ala + 12], // верхняя треть губного желобка
  'REN-24': [AXIS, L.chin - 4], // подбородочно-губная борозда
};

export const headFront: ViewDef = {
  id: 'head-front',
  title: 'Голова спереди',
  width: 300,
  height: 340,
  cun: CUN,
  shapes: SHAPES,
  details: DETAILS,
  mirrorX: AXIS,
  computed: COMPUTED,
  paths: {
    ST: ['ST-8', [96, 110], 'ST-1', 'ST-2', 'ST-3', 'ST-4', [108, 236], [96, 254]],
    // Канал пересекается в губном желобке и заканчивается у крыла носа противоположной стороны
    LI: [[96, 320], [112, 244], [126, 214], [AXIS, L.ala + 12], mirror([132, L.ala - 2], AXIS)],
    BL: ['BL-1', 'BL-2', [134, 60], [136, 30]],
    GB: [['GB-1', [70, 140]], ['GB-13', 'GB-14', 'GB-15', [114, 50]]],
    TB: [[62, 128], 'TB-23'],
    DU: ['DU-26', [AXIS, 150], 'DU-24', 'DU-23', [AXIS, 26]],
    REN: [[AXIS, 330], 'REN-24'],
  },
};
