export type ChannelId = 'LU' | 'LI' | 'ST' | 'SP' | 'HE' | 'SI' | 'BL' | 'KI' | 'P' | 'TB' | 'GB' | 'LIV' | 'REN' | 'DU';

/** Шесть уровней (六經): у каждого — ручной и ножной канал */
export type LevelId = 'taiyang' | 'yangming' | 'shaoyang' | 'taiyin' | 'shaoyin' | 'jueyin';

export interface Level {
  id: LevelId;
  /** Транскрипция: «Шао-ян» */
  name: string;
  /** Перевод: «Малый Ян» (у Мачоча — Lesser Yang; формулировку сверить с русским изданием) */
  meaning: string;
  hanzi: string;
  yin: boolean;
}

export const LEVELS: Level[] = [
  { id: 'taiyang', name: 'Тай-ян', meaning: 'Большой Ян', hanzi: '太陽', yin: false },
  { id: 'yangming', name: 'Ян-мин', meaning: 'Светлый Ян', hanzi: '陽明', yin: false },
  { id: 'shaoyang', name: 'Шао-ян', meaning: 'Малый Ян', hanzi: '少陽', yin: false },
  { id: 'taiyin', name: 'Тай-инь', meaning: 'Большой Инь', hanzi: '太陰', yin: true },
  { id: 'shaoyin', name: 'Шао-инь', meaning: 'Малый Инь', hanzi: '少陰', yin: true },
  { id: 'jueyin', name: 'Цзюэ-инь', meaning: 'Предельный Инь', hanzi: '厥陰', yin: true },
];

export const levelById = (id: LevelId) => LEVELS.find((l) => l.id === id)!;

export interface Channel {
  id: ChannelId;
  /** Код как у Мачоча: L.I., T.B., G.B. — из него собирается код точки «L.I.-4» */
  code: string;
  /** Код ВОЗ 2008 — справочно */
  who: string;
  /** Название по-русски — сверить с изданием Мачоча (вопрос 5 ТЗ) */
  name: string;
  /** Парные точки по обе стороны тела; у Жэнь-май и Ду-май — по средней линии */
  bilateral: boolean;
  /** Уровень и конечность — у 12 основных каналов; у Жэнь-май и Ду-май нет */
  level?: LevelId;
  limb?: 'hand' | 'foot';
  /** Полное название иероглифами: 手太陰肺經 */
  fullHanzi: string;
  /** Орган в родительном падеже — для полного названия: «канал лёгких» */
  organOf?: string;
}

/** Порядок — суточный круг, затем два срединных канала */
export const CHANNELS: Channel[] = [
  { id: 'LU', code: 'LU', who: 'LU', name: 'Лёгкие', bilateral: true, level: 'taiyin', limb: 'hand', fullHanzi: '手太陰肺經', organOf: 'лёгких' },
  { id: 'LI', code: 'L.I.', who: 'LI', name: 'Толстый кишечник', bilateral: true, level: 'yangming', limb: 'hand', fullHanzi: '手陽明大腸經', organOf: 'толстого кишечника' },
  { id: 'ST', code: 'ST', who: 'ST', name: 'Желудок', bilateral: true, level: 'yangming', limb: 'foot', fullHanzi: '足陽明胃經', organOf: 'желудка' },
  { id: 'SP', code: 'SP', who: 'SP', name: 'Селезёнка', bilateral: true, level: 'taiyin', limb: 'foot', fullHanzi: '足太陰脾經', organOf: 'селезёнки' },
  { id: 'HE', code: 'HE', who: 'HT', name: 'Сердце', bilateral: true, level: 'shaoyin', limb: 'hand', fullHanzi: '手少陰心經', organOf: 'сердца' },
  { id: 'SI', code: 'S.I.', who: 'SI', name: 'Тонкий кишечник', bilateral: true, level: 'taiyang', limb: 'hand', fullHanzi: '手太陽小腸經', organOf: 'тонкого кишечника' },
  { id: 'BL', code: 'BL', who: 'BL', name: 'Мочевой пузырь', bilateral: true, level: 'taiyang', limb: 'foot', fullHanzi: '足太陽膀胱經', organOf: 'мочевого пузыря' },
  { id: 'KI', code: 'KI', who: 'KI', name: 'Почки', bilateral: true, level: 'shaoyin', limb: 'foot', fullHanzi: '足少陰腎經', organOf: 'почек' },
  { id: 'P', code: 'P', who: 'PC', name: 'Перикард', bilateral: true, level: 'jueyin', limb: 'hand', fullHanzi: '手厥陰心包經', organOf: 'перикарда' },
  { id: 'TB', code: 'T.B.', who: 'TE', name: 'Тройной обогреватель', bilateral: true, level: 'shaoyang', limb: 'hand', fullHanzi: '手少陽三焦經', organOf: 'тройного обогревателя' },
  { id: 'GB', code: 'G.B.', who: 'GB', name: 'Желчный пузырь', bilateral: true, level: 'shaoyang', limb: 'foot', fullHanzi: '足少陽膽經', organOf: 'желчного пузыря' },
  { id: 'LIV', code: 'LIV', who: 'LR', name: 'Печень', bilateral: true, level: 'jueyin', limb: 'foot', fullHanzi: '足厥陰肝經', organOf: 'печени' },
  { id: 'REN', code: 'Ren', who: 'CV', name: 'Жэнь-май', bilateral: false, fullHanzi: '任脈' },
  { id: 'DU', code: 'Du', who: 'GV', name: 'Ду-май', bilateral: false, fullHanzi: '督脈' },
];

export const channelById = (id: ChannelId) => CHANNELS.find((c) => c.id === id)!;

/** Полное название: «Ручной канал лёгких Тай-инь (Большой Инь)»; у Жэнь-май и Ду-май — просто имя */
export function fullName(ch: Channel): string {
  if (!ch.level || !ch.limb) return ch.name;
  const lv = levelById(ch.level);
  return `${ch.limb === 'hand' ? 'Ручной' : 'Ножной'} канал ${ch.organOf} ${lv.name} (${lv.meaning})`;
}

/** Каналы уровня: [ручной, ножной] */
export const channelsOfLevel = (level: LevelId): [Channel, Channel] => {
  const pair = CHANNELS.filter((c) => c.level === level);
  return [pair.find((c) => c.limb === 'hand')!, pair.find((c) => c.limb === 'foot')!];
};
