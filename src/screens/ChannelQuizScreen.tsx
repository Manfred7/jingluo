import { useEffect, useRef, useState } from 'react';
import { Figure } from '../components/Figure';
import { SessionTop } from '../components/SessionTop';
import { CHANNELS, channelById, type ChannelId } from '../data/channels';
import { pointById } from '../data/points';
import { TRACK } from '../logic/modes';
import { placedOn } from '../logic/placement';
import { makeChannelQuestion } from '../logic/quiz';
import type { ChannelQuestion, SessionProps, SessionResult } from '../logic/quizTypes';
import { pickNext } from '../logic/session';
import { viewById } from '../figures/views';
import './quiz.css';

interface ChannelCard {
  id: ChannelId;
}

interface Answer {
  id: ChannelId;
  ok: boolean;
}

/** Следующий канал по прогрессу режима */
function nextQuestion(
  pool: ChannelCard[],
  shownIds: string[],
  levelOf: SessionProps['levelOf'],
): ChannelQuestion | undefined {
  if (!pool.length) return undefined;
  const channel = pickNext(pool, shownIds, (id) => levelOf(id, TRACK.channel));
  return makeChannelQuestion(channel.id, levelOf(channel.id, TRACK.channel));
}

/** «Узнай канал»: ход канала на фигуре и четыре варианта */
export function ChannelQuizScreen({ pool, length, levelOf, onRecord, onFinish, onExit }: SessionProps) {
  const channelPool = CHANNELS.filter((channel) => pool.some((point) => point.channel === channel.id)).map(
    ({ id }) => ({ id }),
  );
  const [question, setQuestion] = useState<ChannelQuestion | undefined>(() =>
    nextQuestion(channelPool, [], levelOf),
  );
  const [shownIds, setShownIds] = useState<string[]>(() => (question ? [question.channel] : []));
  const [results, setResults] = useState<SessionResult[]>([]);
  const [answer, setAnswer] = useState<Answer>();
  const timerRef = useRef<number | undefined>(undefined);
  // Актуальные значения для перехода: таймер захвачен рендером до onRecord
  const latestRef = useRef({ channelPool, shownIds, levelOf, length, onFinish });

  useEffect(() => {
    latestRef.current = { channelPool, shownIds, levelOf, length, onFinish };
  });

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
    const { channelPool, shownIds, levelOf, length, onFinish } = latestRef.current;
    if (answered.length >= length) {
      onFinish(answered);
      return;
    }
    const next = nextQuestion(channelPool, shownIds, levelOf);
    if (!next) {
      onFinish(answered);
      return;
    }
    setQuestion(next);
    setShownIds([...shownIds, next.channel]);
    setAnswer(undefined);
  };

  const choose = (id: ChannelId) => {
    if (!question || answer) return;
    const ok = id === question.channel;
    const answered = [...results, { id: question.channel, ok }];
    setAnswer({ id, ok });
    setResults(answered);
    onRecord(question.channel, TRACK.channel, ok);
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
      <main className="screen quiz channel-quiz">
        <SessionTop done={results.length} total={length} onExit={exit} />
        <section className="panel">
          <p className="muted">В выбранной колоде нет каналов для тренировки.</p>
        </section>
      </main>
    );
  }

  const channel = channelById(question.channel);
  const view = viewById(question.viewId);
  const placed = placedOn(view);
  const verdictClass = answer ? (answer.ok ? ' card--ok' : ' card--bad') : '';

  return (
    <main className="screen quiz channel-quiz">
      <SessionTop done={results.length} total={length} onExit={exit} />

      <section className={`card quiz-card${verdictClass}`}>
        <div className="quiz__figure-wrap">
          <Figure
            className="quiz__figure"
            view={view}
            placed={placed}
            channels={[question.channel]}
            activeChannel={question.channel}
            showPoint={(id) => id.startsWith(`${question.channel}-`)}
            labels={
              answer
                ? (id) => {
                    const point = pointById(id);
                    return point?.channel === question.channel ? String(point.number) : undefined;
                  }
                : undefined
            }
          />
        </div>
        {answer ? (
          <div className="quiz__reveal" role="status">
            <span className="quiz__reveal-code">{channel.code}</span>
            <span className="quiz__reveal-name">{channel.name}</span>
          </div>
        ) : (
          <p className="card__prompt">Какой это канал?</p>
        )}
      </section>

      <div className="answers channel-quiz__answers">
        {question.options.map((id, index) => {
          const option = channelById(id);
          const correct = id === question.channel;
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
                {option.code} · {option.name}
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
