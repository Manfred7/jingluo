/** Режимы стартового экрана */
export type Mode = 'atlas' | 'quiz' | 'compose' | 'channel' | 'locate';

export const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: 'atlas', label: 'Атлас', hint: 'Каналы и точки на фигуре, без проверки' },
  { id: 'quiz', label: 'Узнай точку', hint: 'Маркер на фигуре — выбрать название или код из четырёх' },
  { id: 'compose', label: 'Состав', hint: 'Маркер на фигуре — выбрать канал, затем номер' },
  { id: 'channel', label: 'Узнай канал', hint: 'Подсвечена линия — какой это канал' },
  { id: 'locate', label: 'Отметь точку', hint: 'Дано название — нажать на место точки на фигуре' },
];

/** Направления режима «Узнай точку» */
export type QuizDirection = 'marker>name' | 'marker>code' | 'name>code' | 'code>name';

export const QUIZ_DIRECTIONS: { id: QuizDirection; label: string }[] = [
  { id: 'marker>name', label: 'Место → название' },
  { id: 'marker>code', label: 'Место → код' },
  { id: 'name>code', label: 'Название → код' },
  { id: 'code>name', label: 'Код → название' },
];

/**
 * Ключи прогресса (Лейтнер, logic/progress.ts). Прогресс ведётся по паре «id × track»:
 * id — точка ('LI-4'), а в режиме «Узнай канал» — канал ('LI').
 */
export const TRACK = {
  quiz: (d: QuizDirection) => `quiz:${d}`,
  compose: 'compose',
  channel: 'channel',
  locate: 'locate',
} as const;

/** Вопросов за сессию */
export const SESSION_LENGTHS = [10, 20, 40];
