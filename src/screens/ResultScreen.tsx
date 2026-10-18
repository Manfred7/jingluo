import { CHANNELS } from '../data/channels';
import { pointById } from '../data/points';
import type { SessionResult } from '../logic/quizTypes';

export interface SessionSummary {
  deckTitle: string;
  masteryBefore: number;
  masteryAfter: number;
  /** Названия колод, открывшихся за эту сессию */
  newlyUnlocked: string[];
}

interface Props {
  results: SessionResult[];
  summary: SessionSummary;
  onRetryMistakes: (ids: string[]) => void;
  onRestart: () => void;
  onMenu: () => void;
}

const pct = (x: number) => `${Math.round(x * 100)}%`;

/** Итоги сессии: сколько верно, как вырос прогресс колоды, что повторить */
export function ResultScreen({ results, summary, onRetryMistakes, onRestart, onMenu }: Props) {
  const passed = results.filter((r) => r.ok).length;
  const failed = new Map<string, number>();
  for (const r of results) if (!r.ok) failed.set(r.id, (failed.get(r.id) ?? 0) + 1);
  const hardest = [...failed.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <main className="screen result">
      <section className="result__score">
        <div className="result__pct">
          {passed}/{results.length}
        </div>
        <p className="muted">ответов верно</p>
      </section>

      <section className="panel result__mastery">
        <div className="result__mastery-row">
          <span>Освоено: {summary.deckTitle}</span>
          <strong>
            {pct(summary.masteryBefore)} → {pct(summary.masteryAfter)}
          </strong>
        </div>
        <div className="bar">
          <div className="bar__fill" style={{ width: pct(summary.masteryAfter) }} />
        </div>
        {summary.newlyUnlocked.map((title) => (
          <p key={title} className="result__unlocked">
            Открыта колода «{title}»
          </p>
        ))}
      </section>

      {hardest.length > 0 ? (
        <section className="panel">
          <h2>Стоит повторить</h2>
          <ul className="mistakes">
            {hardest.map(([id, times]) => {
              const point = pointById(id);
              const channel = point ? undefined : CHANNELS.find((c) => c.id === id);
              return (
                <li key={id}>
                  <span className="mistakes__char">
                    {point ? (
                      <>
                        <strong>{point.code}</strong> {point.nameRu} <span className="hanzi muted">{point.hanzi}</span>
                      </>
                    ) : (
                      <>
                        <strong>{channel?.code ?? id}</strong> {channel?.name}
                      </>
                    )}
                  </span>
                  <span className="mistakes__count">×{times}</span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        <p className="result__perfect">Без ошибок</p>
      )}

      <div className="result__actions">
        {hardest.length > 0 && (
          <button className="btn btn--primary btn--wide" onClick={() => onRetryMistakes(hardest.map(([id]) => id))}>
            Повторить ошибки
          </button>
        )}
        <button className={`btn btn--wide ${hardest.length ? '' : 'btn--primary'}`} onClick={onRestart}>
          Ещё сессия
        </button>
        <button className="btn btn--ghost btn--wide" onClick={onMenu}>
          В меню
        </button>
      </div>
    </main>
  );
}
