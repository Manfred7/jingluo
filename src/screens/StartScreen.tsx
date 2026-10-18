import { useEffect } from 'react';
import { CHANNELS, type ChannelId } from '../data/channels';
import { POINTS, pointsOf } from '../data/points';
import { DECKS, deckMastery, isUnlocked } from '../logic/decks';
import { MODES, QUIZ_DIRECTIONS, type QuizDirection, SESSION_LENGTHS } from '../logic/modes';
import type { Progress } from '../logic/progress';
import type { Settings } from '../logic/settings';
import { THEMES } from '../logic/theme';

interface Props {
  settings: Settings;
  progress: Progress;
  onSettings: (patch: Partial<Settings>) => void;
  onChannel: (id: ChannelId) => void;
  onStart: () => void;
  onResetProgress: () => void;
}

const pct = (x: number) => `${Math.round(x * 100)}%`;

/** Стартовый экран: режим, колода (для тренировки) или список каналов (атлас), настройки */
export function StartScreen({ settings, progress, onSettings, onChannel, onStart, onResetProgress }: Props) {
  const mode = MODES.find((m) => m.id === settings.mode) ?? MODES[0];
  const deck = DECKS.find((d) => d.id === settings.deckId) ?? DECKS[0];
  const deckOpen = isUnlocked(deck, progress, settings.unlockAll);

  // Выбранная колода закрылась (сняли «Открыть все» или сбросили прогресс) — вернуться к первой, она открыта всегда
  useEffect(() => {
    if (!deckOpen) onSettings({ deckId: DECKS[0].id });
  }, [deckOpen, onSettings]);

  const toggleDirection = (id: QuizDirection) => {
    const has = settings.directions.includes(id);
    if (has && settings.directions.length === 1) return; // хотя бы одно направление
    onSettings({ directions: has ? settings.directions.filter((d) => d !== id) : [...settings.directions, id] });
  };

  return (
    <main className="screen">
      <header className="start__hero">
        <div className="start__glyphs hanzi" aria-hidden>
          經絡
        </div>
        <h1>Каналы</h1>
        <p className="muted">14 каналов · {POINTS.length} точек</p>
      </header>

      <section className="panel" aria-label="Режим">
        <div className="mode-grid">
          {MODES.map((m) => (
            <button key={m.id} className="mode-btn" aria-pressed={m.id === mode.id} onClick={() => onSettings({ mode: m.id })}>
              {m.label}
            </button>
          ))}
        </div>
        <p className="muted start__hint">{mode.hint}</p>
      </section>

      {mode.id === 'atlas' ? (
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
      ) : (
        <>
          <section className="panel" aria-label="Колода">
            <h2>Колода</h2>
            <ul className="list">
              {DECKS.map((d) => {
                const open = isUnlocked(d, progress, settings.unlockAll);
                return (
                  <li key={d.id}>
                    <button
                      className={`deck-row ${d.id === deck.id ? 'is-selected' : ''}`}
                      onClick={() => onSettings({ deckId: d.id })}
                      disabled={!open}
                    >
                      <span>{open ? d.title : `🔒 ${d.title}`}</span>
                      <span className="deck-row__pct">{pct(deckMastery(progress, d))}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <label className="check">
              <input type="checkbox" checked={settings.unlockAll} onChange={(e) => onSettings({ unlockAll: e.target.checked })} />
              Открыть все колоды
            </label>
          </section>

          {mode.id === 'quiz' && (
            <section className="panel" aria-label="Направления">
              <h2>Что спрашивать</h2>
              {QUIZ_DIRECTIONS.map((d) => (
                <label key={d.id} className="check">
                  <input type="checkbox" checked={settings.directions.includes(d.id)} onChange={() => toggleDirection(d.id)} />
                  {d.label}
                </label>
              ))}
            </section>
          )}

          <section className="panel" aria-label="Длина сессии">
            <div className="segmented">
              {SESSION_LENGTHS.map((n) => (
                <button key={n} aria-pressed={settings.length === n} onClick={() => onSettings({ length: n })}>
                  {n} вопросов
                </button>
              ))}
            </div>
          </section>

          <button className="btn btn--primary btn--wide" onClick={onStart} disabled={!deckOpen}>
            Начать: {mode.label}
          </button>
        </>
      )}

      <section className="panel" aria-label="Тема">
        <div className="segmented">
          {THEMES.map((t) => (
            <button key={t.id} aria-pressed={settings.theme === t.id} onClick={() => onSettings({ theme: t.id })}>
              {t.label}
            </button>
          ))}
        </div>
        <button className="btn btn--ghost btn--wide" onClick={onResetProgress}>
          Сбросить прогресс
        </button>
      </section>
    </main>
  );
}
