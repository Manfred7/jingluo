import { type ChannelId, channelById } from '../data/channels';
import { pointsOf } from '../data/points';

interface Props {
  channel: ChannelId;
  onBack: () => void;
}

/** Точки канала списком — пока без фигуры; удобно для сверки с книгой */
export function ChannelScreen({ channel, onBack }: Props) {
  const ch = channelById(channel);
  const points = pointsOf(channel);
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

      <section className="panel" aria-label="Точки канала">
        <ul className="list">
          {points.map((p) => (
            <li key={p.id} className="point-row">
              <span className="point-row__code">{p.code}</span>
              <span className="point-row__name">{p.nameRu}</span>
              <span className="point-row__hanzi hanzi">{p.hanzi}</span>
              <span className="point-row__who">ВОЗ {p.who}</span>
            </li>
          ))}
        </ul>
      </section>
      <p className="muted">{points.length} точек</p>
    </main>
  );
}
