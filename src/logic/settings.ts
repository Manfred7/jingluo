import { DECKS } from './decks';
import { MODES, type Mode, QUIZ_DIRECTIONS, type QuizDirection, SESSION_LENGTHS } from './modes';
import { THEMES, type Theme } from './theme';

export interface Settings {
  theme: Theme;
  mode: Mode;
  deckId: string;
  /** Вопросов в сессии */
  length: number;
  /** Направления «Узнай точку» */
  directions: QuizDirection[];
  /** Все колоды доступны сразу, без порога */
  unlockAll: boolean;
}

const KEY = 'jingluo:settings';

const DEFAULTS: Settings = {
  theme: 'system',
  mode: 'atlas',
  deckId: DECKS[0].id,
  length: 20,
  directions: ['marker>name'],
  unlockAll: false,
};

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    const known = new Set(QUIZ_DIRECTIONS.map((d) => d.id));
    const directions = Array.isArray(parsed.directions) ? parsed.directions.filter((d) => known.has(d)) : [];
    return {
      theme: THEMES.some((t) => t.id === parsed.theme) ? parsed.theme! : DEFAULTS.theme,
      mode: MODES.some((m) => m.id === parsed.mode) ? parsed.mode! : DEFAULTS.mode,
      deckId: DECKS.some((d) => d.id === parsed.deckId) ? parsed.deckId! : DEFAULTS.deckId,
      length: SESSION_LENGTHS.includes(parsed.length ?? 0) ? parsed.length! : DEFAULTS.length,
      directions: directions.length ? directions : DEFAULTS.directions,
      unlockAll: parsed.unlockAll === true,
    };
  } catch {
    return DEFAULTS;
  }
}

export function saveSettings(s: Settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // хранилище недоступно (приватный режим и т. п.) — настройки живут до перезагрузки
  }
}
