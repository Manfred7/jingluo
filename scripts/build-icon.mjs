// Иконка приложения: 經絡 («каналы и коллатерали») контурами из данных черт hanzi-writer-data.
// Пишет public/pwa-icon.svg и public/favicon.svg; PNG дальше делает `npm run icons`.
// Данные черт в проект не ставятся (≈30 МБ): путь к пакету — первым аргументом,
// по умолчанию — из соседнего bazi-trainer. Запуск: npm run icon [-- <путь к hanzi-writer-data>]
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = resolve(process.argv[2] ?? join(ROOT, '..', 'bazi-trainer', 'node_modules', 'hanzi-writer-data'));
const PUBLIC = join(ROOT, 'public');
if (!existsSync(join(DATA, '經.json'))) throw new Error(`Нет данных черт в ${DATA} — передайте путь к hanzi-writer-data`);

// Киноварь и бумага — как у соседних тренажёров; фон maskable-иконки — в pwa-assets.config.ts
const BG = '#B23A2B';
const FG = '#F5F0E6';

const strokes = (ch) =>
  JSON.parse(readFileSync(join(DATA, `${ch}.json`), 'utf8'))
    .strokes.map((d) => `<path d="${d}"/>`)
    .join('');

/** Знак в квадрате 1024·s: x, y — левый верхний угол, s — масштаб от 1024 */
function glyph(ch, x, y, s) {
  // Данные Hanzi Writer: квадрат 1024, ось Y вверх, базовая линия 900
  const ty = y + 900 * s + 1024 * s * 0.02;
  return `<g fill="${FG}" transform="translate(${x.toFixed(2)},${ty.toFixed(2)}) scale(${s},${-s})">${strokes(ch)}</g>`;
}

// 512×512: 經絡 в строку — так знаки ложатся в круглую маску Android-лаунчера с запасом
const s = 0.16;
const left = (512 - 2 * 1024 * s) / 2;
const y = (512 - 1024 * s) / 2;
const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${BG}"/>
  ${glyph('經', left, y, s)}
  ${glyph('絡', left + 1024 * s, y, s)}
</svg>
`;

// Вкладка браузера (16–32 px): два знака сольются, поэтому только 經
const fs = 0.029;
const fx = (32 - 1024 * fs) / 2;
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="${BG}"/>
  ${glyph('經', fx, fx, fs)}
</svg>
`;

writeFileSync(join(PUBLIC, 'pwa-icon.svg'), icon);
writeFileSync(join(PUBLIC, 'favicon.svg'), favicon);
console.log('public/pwa-icon.svg, public/favicon.svg — готово');
