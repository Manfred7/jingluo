/**
 * ОБЩИЙ КОНТРАКТ режимов тренировки — его используют logic/quiz.ts, logic/hitTest.ts и экраны режимов.
 * Менять только вместе со всеми потребителями.
 */
import type { ChannelId } from '../data/channels';
import type { Point } from '../data/points';
import type { Vec } from '../figures/geometry';
import type { ViewId } from '../figures/types';
import type { QuizDirection } from './modes';

/** «Узнай точку»: варианты — id точек (верная среди них), порядок уже перемешан */
export interface ChoiceQuestion {
  kind: 'choice';
  pointId: string;
  direction: QuizDirection;
  options: string[];
}

/** «Состав»: шаг 1 — канал из всех 14 (порядок CHANNELS), шаг 2 — номер из 4–6 номеров этого канала по возрастанию */
export interface ComposeQuestion {
  kind: 'compose';
  pointId: string;
  channelOptions: ChannelId[];
  numberOptions: number[];
}

/** «Узнай канал»: подсвечен ход канала на виде viewId; варианты — 4 канала, порядок перемешан */
export interface ChannelQuestion {
  kind: 'channel';
  channel: ChannelId;
  viewId: ViewId;
  options: ChannelId[];
}

/** «Отметь точку»: итог нажатия на фигуру */
export interface TapVerdict {
  ok: boolean;
  /** Ближайшая к нажатию точка на виде (с учётом отражений); при ok — сама верная */
  nearestId: string;
  /** Расстояние от нажатия до ближайшего места верной точки, в цунях */
  distanceCun: number;
  /** Ближайшее место верной точки (на симметричных видах — со стороны нажатия) */
  targetPos: Vec;
}

/** Результат одного вопроса для экрана итогов: id — точка или (в «Узнай канал») канал */
export interface SessionResult {
  id: string;
  ok: boolean;
}

/** Пропсы всех экранов-сессий */
export interface SessionProps {
  /** Точки выбранной колоды */
  pool: Point[];
  /** Вопросов в сессии */
  length: number;
  /** Уровень Лейтнера 0–5 для пары id × track (ключи track — TRACK из logic/modes.ts) */
  levelOf: (id: string, track: string) => number;
  /** Записать ответ в прогресс — вызывать сразу после ответа на вопрос */
  onRecord: (id: string, track: string, ok: boolean) => void;
  /** Сессия закончена: все результаты по порядку */
  onFinish: (results: SessionResult[]) => void;
  /** Выход в меню без итогов */
  onExit: () => void;
}

export interface QuizScreenProps extends SessionProps {
  /** Включённые направления; вопрос берёт случайное из них */
  directions: QuizDirection[];
}
