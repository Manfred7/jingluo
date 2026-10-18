import { useState } from 'react';
import { Figure } from '../components/Figure';
import { type ChannelId, channelById } from '../data/channels';
import { POINTS, pointById, pointsOf } from '../data/points';
import type { ViewId } from '../figures/types';
import { placementsOf, viewsOfChannel } from '../figures/views';

interface Props {
  channel: ChannelId;
  onBack: () => void;
}

const isBilateral = (id: string) => pointById(id)?.bilateral ?? false;

/** Атлас канала: ход и точки на видах тела, карточка выбранной точки, список точек */
export function ChannelScreen({ channel, onBack }: Props) {
  const ch = channelById(channel);
  const points = pointsOf(channel);
  const views = viewsOfChannel(channel);
  const [viewId, setViewId] = useState<ViewId | undefined>(views[0]?.id);
  const [selectedId, setSelectedId] = useState<string>();
  const view = views.find((v) => v.id === viewId);
  const placed = view ? placementsOf(view, undefined, isBilateral) : [];
  const ofChannel = (id: string) => id.startsWith(`${channel}-`);
  const selected = selectedId ? pointById(selectedId) : undefined;
  const placedIds = new Set(views.flatMap((v) => placementsOf(v).map((p) => p.pointId)));

  /** Выбор из списка: переключиться на вид, где точка есть */
  const select = (id: string) => {
    setSelectedId(id);
    if (view && placed.some((p) => p.pointId === id)) return;
    const other = views.find((v) => placementsOf(v).some((p) => p.pointId === id));
    if (other) setViewId(other.id);
  };

  return (
    <main className="screen">
      <div className="top-bar">
        <button className="icon-btn" onClick={onBack} aria-label="Назад">
          ←
        </button>
        <h2>
          {ch.code} · {ch.name}
        </h2>
      </div>

      {view ? (
        <section className="panel atlas">
          {views.length > 1 && (
            <div className="segmented">
              {views.map((v) => (
                <button key={v.id} aria-pressed={v.id === viewId} onClick={() => setViewId(v.id)}>
                  {v.title}
                </button>
              ))}
            </div>
          )}
          <Figure
            view={view}
            placed={placed}
            channels={[channel]}
            activeChannel={channel}
            showPoint={ofChannel}
            selectedId={selectedId}
            labels={(id) => (ofChannel(id) ? String(pointById(id)?.number ?? '') : undefined)}
            onPointDown={(id) => setSelectedId(id)}
          />
          {selected ? (
            <div className="point-card">
              <span className="point-card__code">{selected.code}</span>
              <span className="point-card__name">{selected.nameRu}</span>
              <span className="point-card__hanzi hanzi">{selected.hanzi}</span>
              <span className="muted point-card__who">ВОЗ {selected.who}</span>
            </div>
          ) : (
            <p className="muted atlas__hint">Нажмите на точку</p>
          )}
        </section>
      ) : (
        <p className="muted">Фигуры для этого канала ещё не нарисованы — пока только список.</p>
      )}

      <section className="panel" aria-label="Точки канала">
        <ul className="list">
          {points.map((p) => (
            <li key={p.id}>
              <button
                className={`point-row ${p.id === selectedId ? 'is-selected' : ''}`}
                onClick={() => select(p.id)}
                disabled={!placedIds.has(p.id) && views.length > 0}
              >
                <span className="point-row__code">{p.code}</span>
                <span className="point-row__name">{p.nameRu}</span>
                <span className="point-row__hanzi hanzi">{p.hanzi}</span>
                <span className="point-row__who">
                  ВОЗ {p.who}
                  {views.length > 0 && !placedIds.has(p.id) && ' · не размещена'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
      <p className="muted">
        {points.length} точек канала · всего {POINTS.length}
      </p>
    </main>
  );
}
