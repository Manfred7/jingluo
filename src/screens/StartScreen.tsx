import { CHANNELS, type ChannelId } from '../data/channels';
import { POINTS, pointsOf } from '../data/points';
import { THEMES, type Theme } from '../logic/theme';

interface Props {
  theme: Theme;
  onTheme: (t: Theme) => void;
  onChannel: (id: ChannelId) => void;
}

/** Стартовый экран каркаса: каналы со счётчиком точек. Режимы тренировки появятся на этапах 3–5 */
export function StartScreen({ theme, onTheme, onChannel }: Props) {
  return (
    <main className="screen">
      <header className="start__hero">
        <div className="start__glyphs hanzi" aria-hidden>
          經絡
        </div>
        <h1>Каналы</h1>
        <p className="muted">
          14 каналов · {POINTS.length} точек
        </p>
      </header>

      <p className="draft-note">Список точек — черновик по памяти, его нужно сверить с «Основами китайской медицины» Мачоча.</p>

      <section className="panel" aria-label="Каналы">
        <ul className="list">
          {CHANNELS.map((c) => (
            <li key={c.id}>
              <button className="channel-row" onClick={() => onChannel(c.id)}>
                <span className="channel-row__code">{c.code}</span>
                <span>{c.name}</span>
                <span className="channel-row__count">{pointsOf(c.id).length}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel" aria-label="Тема">
        <div className="segmented">
          {THEMES.map((t) => (
            <button key={t.id} aria-pressed={theme === t.id} onClick={() => onTheme(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
