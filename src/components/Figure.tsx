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
  svgRef?: Ref<SVGSVGElement>;
  className?: string;
  overlay?: ReactNode;
}

/**
 * Вид тела: контур объединения форм (обводка всех форм снизу, заливка сверху),
 * ориентиры, ход каналов и точки. Мишень у точки шире маркера — под палец.
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
  svgRef,
  className,
  overlay,
}: Props) {
  const outlines = view.shapes.map(shapePath);
  const visible = placed.filter((p) => showPoint(p.pointId));
  return (
    <svg
      ref={svgRef}
      className={`figure ${className ?? ''}`}
      viewBox={`0 0 ${view.width} ${view.height}`}
      role="img"
      aria-label={view.title}
      onPointerDown={onBackgroundDown}
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

      {channels.map((ch) => {
        const pts = pathOf(view, ch, placed);
        if (pts.length < 2) return null;
        return (
          <path key={ch} className={`figure__channel ${ch === activeChannel ? 'is-active' : ''}`} d={smoothPath(pts)} />
        );
      })}

      {visible.map((p) => {
        const [x, y] = p.pos;
        const selected = p.pointId === selectedId;
        const label = labels?.(p.pointId);
        return (
          <g
            key={`${p.pointId}${p.mirrored ? ':m' : ''}`}
            className={`figure__point ${selected ? 'is-selected' : ''} ${p.mirrored ? 'is-mirrored' : ''}`}
            onPointerDown={
              onPointDown
                ? (e) => {
                    e.stopPropagation();
                    onPointDown(p.pointId, !!p.mirrored, e);
                  }
                : undefined
            }
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
