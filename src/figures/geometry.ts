export type Vec = [number, number];

export const add = (a: Vec, b: Vec): Vec => [a[0] + b[0], a[1] + b[1]];
export const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1]];
export const mul = (a: Vec, k: number): Vec => [a[0] * k, a[1] * k];
export const len = (a: Vec) => Math.hypot(a[0], a[1]);
export const unit = (a: Vec): Vec => mul(a, 1 / (len(a) || 1));
/** Нормаль, повёрнутая на 90° по часовой стрелке (в экранных координатах — «вправо» от направления) */
export const normal = (a: Vec): Vec => [-a[1], a[0]];
export const lerp = (a: Vec, b: Vec, t: number): Vec => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
export const round = (a: Vec): Vec => [Math.round(a[0] * 10) / 10, Math.round(a[1] * 10) / 10];

/**
 * Пропорциональный отрезок (цуни): точка на отрезке A→B, отстоящая от A на `cun` из `total` цуней.
 * Так записываются описания вида «7 цуней выше LU-9 на линии LU-9 — LU-5 (12 цуней)».
 */
export const along = (a: Vec, b: Vec, cun: number, total: number): Vec => lerp(a, b, cun / total);

/** Сдвиг точки поперёк отрезка A→B на d (положительное — вправо от направления A→B на экране) */
export const across = (p: Vec, a: Vec, b: Vec, d: number): Vec => add(p, mul(unit(normal(sub(b, a))), d));

/** Фигура тела собирается из простых форм; контур объединения рисует Figure (обводка снизу, заливка сверху) */
export type Shape =
  | { kind: 'capsule'; a: Vec; b: Vec; ra: number; rb: number }
  | { kind: 'ellipse'; c: Vec; rx: number; ry: number }
  | { kind: 'blob'; pts: Vec[] };

/** Сужающаяся «капсула» — сегмент конечности между окружностями радиусов ra и rb */
export function capsulePath(a: Vec, b: Vec, ra: number, rb: number): string {
  const d = unit(sub(b, a));
  const n = normal(d);
  const pts: Vec[] = [];
  const steps = 10;
  // полуокружность у B: от +n через +d к −n
  for (let i = 0; i <= steps; i++) {
    const t = (Math.PI * i) / steps;
    pts.push(add(b, add(mul(n, rb * Math.cos(t)), mul(d, rb * Math.sin(t)))));
  }
  // полуокружность у A: от −n через −d к +n
  for (let i = 0; i <= steps; i++) {
    const t = (Math.PI * i) / steps;
    pts.push(add(a, add(mul(n, -ra * Math.cos(t)), mul(d, -ra * Math.sin(t)))));
  }
  return `M${pts.map((p) => round(p).join(',')).join('L')}Z`;
}

/** Гладкая кривая через точки (Catmull-Rom → кубические Безье) */
export function smoothPath(pts: Vec[], closed = false): string {
  if (pts.length < 2) return '';
  const p = (i: number) => (closed ? pts[(i + pts.length) % pts.length] : pts[Math.max(0, Math.min(pts.length - 1, i))]);
  const n = closed ? pts.length : pts.length - 1;
  let d = `M${round(pts[0]).join(',')}`;
  for (let i = 0; i < n; i++) {
    const p0 = p(i - 1);
    const p1 = p(i);
    const p2 = p(i + 1);
    const p3 = p(i + 2);
    const c1 = add(p1, mul(sub(p2, p0), 1 / 6));
    const c2 = sub(p2, mul(sub(p3, p1), 1 / 6));
    d += `C${round(c1).join(',')} ${round(c2).join(',')} ${round(p2).join(',')}`;
  }
  return closed ? `${d}Z` : d;
}

export function shapePath(s: Shape): string {
  switch (s.kind) {
    case 'capsule':
      return capsulePath(s.a, s.b, s.ra, s.rb);
    case 'ellipse': {
      const [cx, cy] = s.c;
      return `M${cx - s.rx},${cy}a${s.rx},${s.ry} 0 1,0 ${2 * s.rx},0a${s.rx},${s.ry} 0 1,0 ${-2 * s.rx},0Z`;
    }
    case 'blob':
      return smoothPath(s.pts, true);
  }
}

/** Зеркало относительно вертикали x = axis (вторая сторона тела) */
export const mirror = (p: Vec, axis: number): Vec => [2 * axis - p[0], p[1]];

export function mirrorShape(s: Shape, axis: number): Shape {
  switch (s.kind) {
    case 'capsule':
      return { ...s, a: mirror(s.a, axis), b: mirror(s.b, axis) };
    case 'ellipse':
      return { ...s, c: mirror(s.c, axis) };
    case 'blob':
      return { ...s, pts: s.pts.map((p) => mirror(p, axis)).reverse() };
  }
}
