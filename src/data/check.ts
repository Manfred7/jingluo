import { CHANNELS } from './channels';
import { POINTS, pointsOf } from './points';

/**
 * Проверка данных: номера по возрастанию без повторов, иероглифы без повторов,
 * совпадения названий в кириллице (их различаем кодом и иероглифом, как 10 Люй / 56 Люй в sign-trainer).
 * Возвращает ошибки и предупреждения; в dev-сборке печатается в консоль при старте.
 */
export function checkData(): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const ch of CHANNELS) {
    const nums = pointsOf(ch.id).map((p) => p.number);
    nums.forEach((n, i) => {
      if (i > 0 && n <= nums[i - 1]) errors.push(`${ch.code}: номер ${n} не по порядку или повторяется`);
    });
  }

  const byHanzi = new Map<string, string[]>();
  const byName = new Map<string, string[]>();
  for (const p of POINTS) {
    byHanzi.set(p.hanzi, [...(byHanzi.get(p.hanzi) ?? []), p.code]);
    byName.set(p.nameRu, [...(byName.get(p.nameRu) ?? []), `${p.code} ${p.hanzi}`]);
  }
  for (const [hanzi, codes] of byHanzi) if (codes.length > 1) errors.push(`${hanzi} повторяется: ${codes.join(', ')}`);
  for (const [name, codes] of byName) if (codes.length > 1) warnings.push(`«${name}» у нескольких точек: ${codes.join(', ')}`);

  return { errors, warnings };
}
