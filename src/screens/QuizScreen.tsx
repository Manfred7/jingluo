import { useEffect, useRef, useState } from 'react';
import { Figure } from '../components/Figure';
import { SessionTop } from '../components/SessionTop';
import { pointById, type Point } from '../data/points';
import { TRACK, type QuizDirection } from '../logic/modes';
import { placementFor } from '../logic/placement';
import { makeChoiceQuestion, optionLabel, promptLabel } from '../logic/quiz';
import type { ChoiceQuestion, QuizScreenProps, SessionResult } from '../logic/quizTypes';
import { pickNext } from '../logic/session';
import './quiz.css';

interface Answer {
  id: string;
  ok: boolean;
}

/** Следующий вопрос; для маркера исключает точки без места на фигурах */
function nextQuestion(
  pool: Point[],
  directions: QuizDirection[],
  shownIds: string[],
  levelOf: QuizScreenProps['levelOf'],
): ChoiceQuestion | undefined {
  if (!pool.length || !directions.length) return undefined;
  const start = Math.floor(Math.random() * directions.length);
  for (let offset = 0; offset < directions.length; offset += 1) {
    const direction = directions[(start + offset) % directions.length];
    const candidates = direction.startsWith('marker>') ? pool.filter((point) => placementFor(point.id)) : pool;
    if (!candidates.length) continue;
    const track = TRACK.quiz(direction);
    const point = pickNext(candidates, shownIds, (id) => levelOf(id, track));
    return makeChoiceQuestion(point.id, direction, levelOf(point.id, track), pool);
  }
  return undefined;
}

/** «Узнай точку»: маркер или подпись и четыре варианта ответа */
export function QuizScreen({ pool, length, directions, levelOf, onRecord, onFinish, onExit }: QuizScreenProps) {
  const [question, setQuestion] = useState<ChoiceQuestion | undefined>(() =>
    nextQuestion(pool, directions, [], levelOf),
  );
  const [shownIds, setShownIds] = useState<string[]>(() => (question ? [question.pointId] : []));
  const [results, setResults] = useState<SessionResult[]>([]);
  const [answer, setAnswer] = useState<Answer>();
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (timerRef.current !== undefined) window.clearTimeout(timerRef.current);
    };
  }, []);

  const advance = (answered: SessionResult[]) => {
    if (timerRef.current !== undefined) {
      window.clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
    if (answered.length >= length) {
      onFinish(answered);
      return;
    }
    const next = nextQuestion(pool, directions, shownIds, levelOf);
    if (!next) {
      onFinish(answered);
      return;
    }
    setQuestion(next);
    setShownIds([...shownIds, next.pointId]);
    setAnswer(undefined);
  };

  const choose = (id: string) => {
    if (!question || answer) return;
    const ok = id === question.pointId;
    const track = TRACK.quiz(question.direction);
    const answered = [...results, { id: question.pointId, ok }];
    setAnswer({ id, ok });
    setResults(answered);
    onRecord(question.pointId, track, ok);
    if (ok) timerRef.current = window.setTimeout(() => advance(answered), 800);
  };

  const exit = () => {
    if (timerRef.current !== undefined) window.clearTimeout(timerRef.current);
    timerRef.current = undefined;
    onExit();
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
      if (!answer && question && /^[1-9]$/.test(event.key)) {
        const id = question.options[Number(event.key) - 1];
        if (id) choose(id);
      } else if (answer && !answer.ok && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        advance(results);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  if (!question) {
    return (
      <main className="screen quiz">
        <SessionTop done={results.length} total={length} onExit={exit} />
        <section className="panel">
          <p className="muted">В этой колоде нет точек, доступных для выбранных направлений.</p>
        </section>
      </main>
    );
  }

  const point = pointById(question.pointId);
  const placement = placementFor(question.pointId);
  const isMarker = question.direction.startsWith('marker>');
  const toName = question.direction.endsWith('>name');
  const ask = toName ? 'Как называется точка?' : 'Какой код у точки?';
  const verdictClass = answer ? (answer.ok ? ' card--ok' : ' card--bad') : '';

  return (
    <main className="screen quiz">
      <SessionTop done={results.length} total={length} onExit={exit} />

      <section className={`card quiz-card${verdictClass}`}>
        {(isMarker || answer) && placement && (
          <div className="quiz__figure-wrap">
            <Figure
              className="quiz__figure"
              view={placement.view}
              placed={placement.placed}
              channels={[]}
              showPoint={(id) => id === question.pointId}
              selectedId={question.pointId}
            />
          </div>
        )}

        {!answer && !isMarker && (
          <div className="card__ask">
            <div className="quiz__prompt">
              <p className="card__prompt">{ask}</p>
              <p className="quiz__prompt-value">{promptLabel(question.pointId, question.direction)}</p>
              {question.direction === 'name>code' && point && (
                <span className="quiz__prompt-hanzi hanzi">{point.hanzi}</span>
              )}
            </div>
          </div>
        )}

        {!answer && isMarker && <p className="card__prompt">{ask}</p>}

        {answer && point && (
          <div className="quiz__reveal" role="status">
            <span className="quiz__reveal-code">{point.code}</span>
            <span className="quiz__reveal-name">{point.nameRu}</span>
            <span className="quiz__reveal-hanzi hanzi">{point.hanzi}</span>
          </div>
        )}
      </section>

      <div className="answers">
        {question.options.map((id, index) => {
          const correct = id === question.pointId;
          const selected = id === answer?.id;
          const stateClass = answer ? (correct ? ' answer--ok' : selected ? ' answer--bad' : ' answer--dim') : '';
          const mark = answer && correct ? '✓' : answer && selected ? '✗' : '';
          return (
            <button key={id} className={`answer${stateClass}`} disabled={!!answer} onClick={() => choose(id)}>
              <span className="answer__key" aria-hidden>
                {index + 1}
              </span>
              <span className="answer__mark" aria-hidden>
                {mark}
              </span>
              <span className="answer__text">
                <span>{optionLabel(id, question.direction)}</span>
                {toName && <span className="answer__hanzi hanzi">{pointById(id)?.hanzi}</span>}
              </span>
            </button>
          );
        })}
      </div>

      <div className="quiz__footer">
        {answer && !answer.ok && (
          <button className="btn btn--primary btn--wide" onClick={() => advance(results)}>
            Дальше
          </button>
        )}
      </div>
    </main>
  );
}
