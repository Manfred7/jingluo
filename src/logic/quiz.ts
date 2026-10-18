import { CHANNELS, type ChannelId } from '../data/channels';
import { POINTS, pointById, pointsOf, type Point } from '../data/points';
import type { QuizDirection } from './modes';
import { channelViews, placementFor } from './placement';
import type { ChannelQuestion, ChoiceQuestion, ComposeQuestion } from './quizTypes';

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function requiredPoint(pointId: string): Point {
  const point = pointById(pointId);
  if (!point) throw new Error(`Неизвестная точка «${pointId}»`);
  return point;
}

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids)];
}

/** Ближайшие неотражённые точки лучшего вида. */
function nearestOnView(pointId: string, otherChannelsOnly: boolean): string[] {
  const point = requiredPoint(pointId);
  const placement = placementFor(pointId);
  if (!placement) return [];
  const [x, y] = placement.pos;
  return placement.placed
    .filter((placed) => !placed.mirrored && placed.pointId !== pointId)
    .map((placed) => ({
      pointId: placed.pointId,
      distance: Math.hypot(placed.pos[0] - x, placed.pos[1] - y),
    }))
    .filter((candidate) => {
      const candidatePoint = pointById(candidate.pointId);
      return !!candidatePoint && (!otherChannelsOnly || candidatePoint.channel !== point.channel);
    })
    .sort((a, b) => a.distance - b.distance)
    .map((candidate) => candidate.pointId);
}

function channelNeighbors(pointId: string): string[] {
  const point = requiredPoint(pointId);
  const channelPoints = pointsOf(point.channel);
  const ownIndex = channelPoints.findIndex((candidate) => candidate.id === pointId);
  return channelPoints
    .map((candidate, index) => ({ id: candidate.id, index, distance: Math.abs(index - ownIndex) }))
    .filter((candidate) => candidate.distance >= 1 && candidate.distance <= 3)
    .sort((a, b) => a.distance - b.distance || a.index - b.index)
    .map((candidate) => candidate.id);
}

function mediumCandidates(pointId: string): string[] {
  return uniqueIds([...channelNeighbors(pointId), ...nearestOnView(pointId, false)]);
}

function hardCandidates(pointId: string): string[] {
  const point = requiredPoint(pointId);
  const sameNames = POINTS.filter((candidate) => candidate.id !== pointId && candidate.nameRu === point.nameRu).map(
    (candidate) => candidate.id,
  );
  return uniqueIds([...sameNames, ...nearestOnView(pointId, true)]);
}

/** Вопрос «Узнай точку»: четыре варианта с усложнением неверных по уровню. */
export function makeChoiceQuestion(
  pointId: string,
  direction: QuizDirection,
  level: number,
  pool: Point[],
): ChoiceQuestion {
  const randomFromPool = shuffle(pool.map((point) => point.id));
  const tiers =
    level >= 4
      ? [hardCandidates(pointId), mediumCandidates(pointId), randomFromPool]
      : level >= 2
        ? [mediumCandidates(pointId), randomFromPool]
        : [randomFromPool];
  const options = [pointId];
  const usedIds = new Set(options);
  // Ключ уникальности — то, что видно на кнопке: у «→ название» это ещё и иероглиф (Цзюйляо 巨髎 / 居髎 различимы)
  const shownAs = (id: string) => (direction.endsWith('>name') ? `${optionLabel(id, direction)} ${pointById(id)?.hanzi}` : optionLabel(id, direction));
  const usedLabels = new Set([shownAs(pointId)]);

  const addCandidates = (candidates: string[]) => {
    for (const id of candidates) {
      if (options.length === 4) return;
      if (usedIds.has(id) || !pointById(id)) continue;
      const label = shownAs(id);
      if (usedLabels.has(label)) continue;
      options.push(id);
      usedIds.add(id);
      usedLabels.add(label);
    }
  };

  tiers.forEach(addCandidates);
  if (options.length < 4) addCandidates(shuffle(POINTS.map((point) => point.id)));
  return { kind: 'choice', pointId, direction, options: shuffle(options) };
}

/** Вопрос «Состав»: все каналы и 4–6 ближайших по порядку номеров. */
export function makeComposeQuestion(pointId: string): ComposeQuestion {
  const point = requiredPoint(pointId);
  const channelPoints = pointsOf(point.channel);
  const ownIndex = channelPoints.findIndex((candidate) => candidate.id === pointId);
  const count = Math.min(channelPoints.length, 4 + Math.floor(Math.random() * 3));
  const numberOptions = channelPoints
    .map((candidate, index) => ({
      number: candidate.number,
      index,
      distance: Math.abs(index - ownIndex),
    }))
    .sort((a, b) => a.distance - b.distance || a.index - b.index)
    .slice(0, count)
    .map((candidate) => candidate.number)
    .sort((a, b) => a - b);
  return {
    kind: 'compose',
    pointId,
    channelOptions: CHANNELS.map((channel) => channel.id),
    numberOptions,
  };
}

/** Вопрос «Узнай канал»: случайный вид с ходом и четыре канала. */
export function makeChannelQuestion(channel: ChannelId, level: number): ChannelQuestion {
  const views = channelViews(channel);
  if (!views.length) throw new Error(`Для канала «${channel}» нет вида с ходом`);
  const view = views[Math.floor(Math.random() * views.length)];
  const others = CHANNELS.map((candidate) => candidate.id).filter((id) => id !== channel);
  const candidates =
    level >= 2
      ? [
          ...shuffle(others.filter((id) => view.paths[id])),
          ...shuffle(others.filter((id) => !view.paths[id])),
        ]
      : shuffle(others);
  return {
    kind: 'channel',
    channel,
    viewId: view.id,
    options: shuffle([channel, ...candidates.slice(0, 3)]),
  };
}

/** Подпись варианта: название или код по Мачоча. */
export function optionLabel(pointId: string, direction: QuizDirection): string {
  const point = requiredPoint(pointId);
  return direction === 'marker>name' || direction === 'code>name' ? point.nameRu : point.code;
}

/** Текст вопроса; при маркере на фигуре текст не нужен. */
export function promptLabel(pointId: string, direction: QuizDirection): string | null {
  if (direction === 'marker>name' || direction === 'marker>code') return null;
  const point = requiredPoint(pointId);
  return direction === 'name>code' ? point.nameRu : point.code;
}
