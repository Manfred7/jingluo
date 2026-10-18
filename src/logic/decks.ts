import { CHANNELS } from '../data/channels';
import { POINTS, pointsOf } from '../data/points';
import { TRACK } from './modes';
import { type Progress, UNLOCK_SHARE, mastery } from './progress';

export interface Deck {
  id: string;
  title: string;
  pointIds: string[];
  /** Колода, которую нужно освоить на UNLOCK_SHARE, чтобы открылась эта */
  requires?: string;
}

/** 12 точек «небесных звёзд» Ма Даньяна — стартовая колода */
const MA_DANYANG = ['ST-36', 'ST-44', 'LI-11', 'LI-4', 'BL-40', 'BL-57', 'LIV-3', 'BL-60', 'GB-30', 'GB-34', 'HE-5', 'LU-7'];

const channelDecks: Deck[] = CHANNELS.map((c, i) => ({
  id: `ch-${c.id}`,
  title: `${c.code} · ${c.name}`,
  pointIds: pointsOf(c.id).map((p) => p.id),
  requires: i === 0 ? 'madanyang' : `ch-${CHANNELS[i - 1].id}`,
}));

/** Порядок: Ма Даньян → каналы по суточному кругу, затем Жэнь-май и Ду-май → все точки */
export const DECKS: Deck[] = [
  { id: 'madanyang', title: '12 точек Ма Даньяна', pointIds: MA_DANYANG },
  ...channelDecks,
  { id: 'all', title: 'Все точки', pointIds: POINTS.map((p) => p.id), requires: channelDecks[channelDecks.length - 1].id },
];

export const deckById = (id: string) => DECKS.find((d) => d.id === id) ?? DECKS[0];

export const deckPoints = (deck: Deck) => deck.pointIds.flatMap((id) => POINTS.filter((p) => p.id === id));

/** Освоение колоды — лучшее из «Место → название» и «Отметь точку» */
export const deckMastery = (p: Progress, deck: Deck) =>
  Math.max(mastery(p, deck.pointIds, TRACK.quiz('marker>name')), mastery(p, deck.pointIds, TRACK.locate));

export const isUnlocked = (deck: Deck, p: Progress, unlockAll: boolean) =>
  unlockAll || !deck.requires || p.unlocked.includes(deck.id);

/** Открывает колоды, у которых требуемая освоена на UNLOCK_SHARE; раз открытая не закрывается */
export function withUnlocks(p: Progress): Progress {
  let unlocked = p.unlocked;
  for (const deck of DECKS) {
    if (!deck.requires || unlocked.includes(deck.id)) continue;
    const req = deckById(deck.requires);
    const reqOpen = !req.requires || unlocked.includes(req.id);
    if (reqOpen && deckMastery(p, req) >= UNLOCK_SHARE) unlocked = [...unlocked, deck.id];
  }
  return unlocked === p.unlocked ? p : { ...p, unlocked };
}
