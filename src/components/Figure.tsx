import type { PointerEvent as ReactPointerEvent, ReactNode, Ref } from 'react';
import type { ChannelId } from '../data/channels';
import { shapePath, smoothPath } from '../figures/geometry';
import type { ViewDef } from '../figures/types';
import { pathOf, type Placed } from '../figures/views';

interface Props {
  view: ViewDef;
  placed: Placed[];
  /** Каналы, чей ход рисуем; активный — киноварью */
  channels: ChannelId[];
  activeChannel?: ChannelId;
  /** Какие точки показывать маркерами (по умолчанию все) */
  showPoint?: (pointId: string) => boolean;
  selectedId?: string;
  /** Подписи кодов рядом с маркерами */
  labels?: (pointId: string) => string | undefined;
  onPointDown?: (pointId: string, mirrored: boolean, e: ReactPointerEvent) => void;
  onBackgroundDown?: (e: ReactPointerEvent<SVGSVGElement>) => void;
  /**
   * Фигура принимает нажатия пальцем (режим «Отметь точку», редактор): добавляет на <svg> класс `figure--touch`
   * (в нём `touch-action: none` — палец не прокручивает страницу). По умолчанию false — на фигуре можно прокручивать.
   */
  touch?: boolean;
  svgRef?: Ref<SVGSVGElement>;
  className?: string;
  overlay?: ReactNode;
}

/** Радиус выбора точки, px экрана (≥44 px мишень на касание) */
const HIT_RADIUS_PX = 22;

/**
 * Вид тела: контур объединения форм (обводка всех форм снизу, заливка сверху),
 * ориентиры, ход каналов и точки. Нажатие разбирается на всём <svg>: выбирается
 * ближайшая к пальцу видимая точка в радиусе HIT_RADIUS_PX экранных пикселей.
 */
export function Figure({
  view,
  placed,
  channels,
  activeChannel,
  showPoint = () => true,
  selectedId,
  labels,
  onPointDown,
  onBackgroundDown,
  touch = false,
  svgRef,
  className,
  overlay,
}: Props) {
  const outlines = view.shapes.map(shapePath);
  const visible = placed.filter((p) => showPoint(p.pointId));

  const handlePointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const ctm = svg.getScreenCTM();
    let nearest: Placed | undefined;
    if (ctm) {
      // Нажатие в координаты viewBox, радиус из px экрана — через масштаб CTM
      const point = svg.createSVGPoint();
      point.x = e.clientX;
      point.y = e.clientY;
      const at = point.matrixTransform(ctm.inverse());
      const radius = HIT_RADIUS_PX / ctm.a;
      let best = radius * radius;
      for (const p of visible) {
        const dx = p.pos[0] - at.x;
        const dy = p.pos[1] - at.y;
        const dist2 = dx * dx + dy * dy;
        if (dist2 <= best) {
          best = dist2;
          nearest = p;
        }
      }
    }
    if (nearest) {
      if (onPointDown) onPointDown(nearest.pointId, !!nearest.mirrored, e);
    } else if (onBackgroundDown) {
      onBackgroundDown(e);
    }
  };

  return (
    <svg
      ref={svgRef}
      className={`figure${touch ? ' figure--touch' : ''} ${className ?? ''}`}
      viewBox={`0 0 ${view.width} ${view.height}`}
      role="img"
      aria-label={view.title}
      onPointerDown={onPointDown || onBackgroundDown ? handlePointerDown : undefined}
    >
      <g className="figure__outline">
        {outlines.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <g className="figure__fill">
        {outlines.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <g className="figure__details">
        {view.details.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>

      {channels.flatMap((ch) =>
        pathOf(view, ch, placed)
          .filter((pts) => pts.length > 1)
          .map((pts, i) => (
            <path
              key={`${ch}:${i}`}
              className={`figure__channel ${ch === activeChannel ? 'is-active' : ''}`}
              d={smoothPath(pts)}
            />
          )),
      )}

      {visible.map((p) => {
        const [x, y] = p.pos;
        const selected = p.pointId === selectedId;
        const label = labels?.(p.pointId);
        return (
          <g
            key={`${p.pointId}${p.mirrored ? ':m' : ''}`}
            className={`figure__point ${selected ? 'is-selected' : ''} ${p.mirrored ? 'is-mirrored' : ''}`}
          >
            <circle className="figure__hit" cx={x} cy={y} r={14} />
            {selected && <circle className="figure__halo" cx={x} cy={y} r={11} />}
            <circle className="figure__dot" cx={x} cy={y} r={selected ? 5.5 : 4.5} />
            {label && (
              <text className="figure__label" x={x + 8} y={y - 7}>
                {label}
              </text>
            )}
          </g>
        );
      })}
      {overlay}
    </svg>
  );
}
