export type ChannelId = 'LU' | 'LI' | 'ST' | 'SP' | 'HE' | 'SI' | 'BL' | 'KI' | 'P' | 'TB' | 'GB' | 'LIV' | 'REN' | 'DU';

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
}

/** Порядок — суточный круг, затем два срединных канала */
export const CHANNELS: Channel[] = [
  { id: 'LU', code: 'LU', who: 'LU', name: 'Лёгкие', bilateral: true },
  { id: 'LI', code: 'L.I.', who: 'LI', name: 'Толстый кишечник', bilateral: true },
  { id: 'ST', code: 'ST', who: 'ST', name: 'Желудок', bilateral: true },
  { id: 'SP', code: 'SP', who: 'SP', name: 'Селезёнка', bilateral: true },
  { id: 'HE', code: 'HE', who: 'HT', name: 'Сердце', bilateral: true },
  { id: 'SI', code: 'S.I.', who: 'SI', name: 'Тонкий кишечник', bilateral: true },
  { id: 'BL', code: 'BL', who: 'BL', name: 'Мочевой пузырь', bilateral: true },
  { id: 'KI', code: 'KI', who: 'KI', name: 'Почки', bilateral: true },
  { id: 'P', code: 'P', who: 'PC', name: 'Перикард', bilateral: true },
  { id: 'TB', code: 'T.B.', who: 'TE', name: 'Тройной обогреватель', bilateral: true },
  { id: 'GB', code: 'G.B.', who: 'GB', name: 'Желчный пузырь', bilateral: true },
  { id: 'LIV', code: 'LIV', who: 'LR', name: 'Печень', bilateral: true },
  { id: 'REN', code: 'Ren', who: 'CV', name: 'Жэнь-май', bilateral: false },
  { id: 'DU', code: 'Du', who: 'GV', name: 'Ду-май', bilateral: false },
];

export const channelById = (id: ChannelId) => CHANNELS.find((c) => c.id === id)!;
