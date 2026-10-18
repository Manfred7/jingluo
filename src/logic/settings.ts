import { THEMES, type Theme } from './theme';

export interface Settings {
  theme: Theme;
}

const KEY = 'jingluo:settings';

const DEFAULTS: Settings = { theme: 'system' };

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      theme: THEMES.some((t) => t.id === parsed.theme) ? parsed.theme! : DEFAULTS.theme,
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
