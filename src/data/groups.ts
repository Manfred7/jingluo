import { type Channel, CHANNELS, type ChannelId, channelById, LEVELS } from './channels';

/** Стихии каналов (пять фаз): Огонь — у сердца, тонкого кишечника, перикарда и тройного обогревателя */
const ELEMENTS: { title: string; hanzi: string; channels: ChannelId[] }[] = [
  { title: 'Дерево', hanzi: '木', channels: ['LIV', 'GB'] },
  { title: 'Огонь', hanzi: '火', channels: ['HE', 'SI', 'P', 'TB'] },
  { title: 'Земля', hanzi: '土', channels: ['SP', 'ST'] },
  { title: 'Металл', hanzi: '金', channels: ['LU', 'LI'] },
  { title: 'Вода', hanzi: '水', channels: ['KI', 'BL'] },
];

export interface ChannelGroup {
  title: string;
  /** Подпись мелко: иероглифы, пояснение */
  note?: string;
  channels: Channel[];
}

export type GroupingId = 'circle' | 'levels' | 'limbs' | 'elements';

export const GROUPINGS: { id: GroupingId; label: string }[] = [
  { id: 'circle', label: 'Круг' },
  { id: 'levels', label: 'Уровни' },
  { id: 'limbs', label: 'Рука / нога' },
  { id: 'elements', label: 'Стихии' },
];

const ordinary = CHANNELS.filter((c) => c.level);
const midline: ChannelGroup = { title: 'Срединные каналы', note: '任脈 · 督脈', channels: CHANNELS.filter((c) => !c.level) };

/** Разделы списка каналов в атласе */
export function groupChannels(grouping: GroupingId): ChannelGroup[] {
  switch (grouping) {
    case 'circle':
      return [{ title: 'Суточный круг', note: 'от лёгких к печени', channels: ordinary }, midline];
    case 'levels':
      return [
        ...LEVELS.map((l) => ({
          title: `${l.name} — ${l.meaning}`,
          note: l.hanzi,
          // ручной, затем ножной
          channels: ordinary
            .filter((c) => c.level === l.id)
            .sort((a, b) => Number(a.limb === 'foot') - Number(b.limb === 'foot')),
        })),
        midline,
      ];
    case 'limbs': {
      const pick = (limb: 'hand' | 'foot', yin: boolean) =>
        ordinary.filter((c) => c.limb === limb && LEVELS.find((l) => l.id === c.level)!.yin === yin);
      return [
        { title: 'Инь руки', note: 'от груди к пальцам руки', channels: pick('hand', true) },
        { title: 'Ян руки', note: 'от пальцев руки к голове', channels: pick('hand', false) },
        { title: 'Ян ноги', note: 'от головы к пальцам ноги', channels: pick('foot', false) },
        { title: 'Инь ноги', note: 'от пальцев ноги к груди', channels: pick('foot', true) },
        midline,
      ];
    }
    case 'elements':
      return [
        ...ELEMENTS.map((e) => ({ title: e.title, note: e.hanzi, channels: e.channels.map(channelById) })),
        midline,
      ];
  }
}
