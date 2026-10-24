import { type Channel, CHANNELS, type ChannelId, channelById, channelsOfLevel, type Level, LEVELS, type LevelId } from '../data/channels';

/**
 * Вопросы режима «Уровни» (шесть уровней 六經):
 * - channel>level — канал → какой уровень (6 вариантов);
 * - level>pair — уровень → какие два канала (4 пары);
 * - limb>channel — «ручной канал Шао-ян» → какой канал (4 варианта).
 * Прогресс: по каналу (channel>level, limb>channel) и по уровню (level>pair), трек TRACK.levels.
 */
export type LevelQuestion =
  | { kind: 'channel>level'; channel: ChannelId; options: LevelId[] }
  | { kind: 'level>pair'; level: LevelId; options: [ChannelId, ChannelId][] }
  | { kind: 'limb>channel'; level: LevelId; limb: 'hand' | 'foot'; options: ChannelId[] };

const isLevelId = (id: string): id is LevelId => LEVELS.some((l) => l.id === id);

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Элементы сессии из точек колоды: каналы с уровнем и их уровни */
export function levelItems(channelIds: ChannelId[]): { id: string }[] {
  const channels = CHANNELS.filter((c) => c.level && channelIds.includes(c.id));
  const own = channels.length ? channels : CHANNELS.filter((c) => c.level); // в колоде только Жэнь-май / Ду-май
  const levels = [...new Set(own.map((c) => c.level!))];
  return [...own.map((c) => ({ id: c.id })), ...levels.map((id) => ({ id }))];
}

/** Вопрос по элементу сессии; level — уровень Лейтнера элемента (2+ — неверные варианты ближе) */
export function makeLevelQuestion(id: string, level: number): LevelQuestion {
  if (isLevelId(id)) {
    const [hand, foot] = channelsOfLevel(id);
    const others = LEVELS.filter((l) => l.id !== id).map((l) => channelsOfLevel(l.id));
    // Сложнее — «полуверные» пары: верный ручной с чужим ножным и наоборот
    const mixed: [ChannelId, ChannelId][] = others.flatMap(([h, f]) => [
      [hand.id, f.id] as [ChannelId, ChannelId],
      [h.id, foot.id] as [ChannelId, ChannelId],
    ]);
    const plain: [ChannelId, ChannelId][] = others.map(([h, f]) => [h.id, f.id]);
    const wrong = level >= 2 ? [...shuffle(mixed).slice(0, 2), ...shuffle(plain).slice(0, 1)] : shuffle(plain).slice(0, 3);
    return { kind: 'level>pair', level: id, options: shuffle([[hand.id, foot.id], ...wrong]) };
  }
  const channel = channelById(id as ChannelId);
  if (Math.random() < 0.5) {
    return { kind: 'channel>level', channel: channel.id, options: LEVELS.map((l) => l.id) };
  }
  const sameLimb = CHANNELS.filter((c) => c.level && c.limb === channel.limb && c.id !== channel.id);
  const otherLimb = CHANNELS.filter((c) => c.level && c.limb !== channel.limb);
  // Сложнее — второй канал того же уровня (рука ↔ нога): его чаще всего и путают
  const partner = channelsOfLevel(channel.level!).find((c) => c.id !== channel.id)!;
  const wrong =
    level >= 2
      ? [partner, ...shuffle(sameLimb).slice(0, 2)]
      : shuffle([...sameLimb, ...otherLimb]).slice(0, 3);
  return { kind: 'limb>channel', level: channel.level!, limb: channel.limb!, options: shuffle([channel, ...wrong].map((c) => c.id)) };
}

/** Верный ли ответ: варианты сравниваются по индексу в options */
export function isCorrect(q: LevelQuestion, index: number): boolean {
  switch (q.kind) {
    case 'channel>level':
      return q.options[index] === channelById(q.channel).level;
    case 'level>pair': {
      const [hand, foot] = channelsOfLevel(q.level);
      const [h, f] = q.options[index];
      return h === hand.id && f === foot.id;
    }
    case 'limb>channel': {
      const c = channelById(q.options[index]);
      return c.level === q.level && c.limb === q.limb;
    }
  }
}

/** id элемента для прогресса и итогов */
export const questionId = (q: LevelQuestion) => (q.kind === 'level>pair' ? q.level : q.kind === 'channel>level' ? q.channel : correctChannel(q).id);

function correctChannel(q: Extract<LevelQuestion, { kind: 'limb>channel' }>): Channel {
  return channelsOfLevel(q.level).find((c) => c.limb === q.limb)!;
}

export const levelLabel = (l: Level) => `${l.name} — ${l.meaning}`;
export { isLevelId };
