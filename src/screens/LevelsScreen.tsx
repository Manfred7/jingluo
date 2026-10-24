import { useEffect, useRef, useState } from 'react';
import { SessionTop } from '../components/SessionTop';
import { channelById, channelsOfLevel, fullName, levelById } from '../data/channels';
import { isCorrect, levelItems, levelLabel, type LevelQuestion, makeLevelQuestion, questionId } from '../logic/levels';
import { TRACK } from '../logic/modes';
import type { SessionProps, SessionResult } from '../logic/quizTypes';
import { pickNext } from '../logic/session';
import './quiz.css';

const channelLabel = (id: Parameters<typeof channelById>[0]) => {
  const c = channelById(id);
  return `${c.code} · ${c.name}`;
};

/** Текст вопроса и подписи вариантов */
function describe(q: LevelQuestion): { ask: string; prompt: string; hanzi?: string; options: string[] } {
  switch (q.kind) {
    case 'channel>level': {
      const c = channelById(q.channel);
      return {
        ask: 'Какой уровень у канала?',
        prompt: `${c.code} · ${c.name}`,
        options: q.options.map((id) => levelLabel(levelById(id))),
      };
    }
    case 'level>pair': {
      const l = levelById(q.level);
      return {
        ask: 'Какие два канала у уровня? (рука + нога)',
        prompt: levelLabel(l),
        hanzi: l.hanzi,
        options: q.options.map(([h, f]) => `${channelById(h).code} + ${channelById(f).code}`),
      };
    }
    case 'limb>channel': {
      const l = levelById(q.level);
      return {
        ask: `${q.limb === 'hand' ? 'Ручной' : 'Ножной'} канал уровня`,
        prompt: levelLabel(l),
        hanzi: l.hanzi,
        options: q.options.map(channelLabel),
      };
    }
  }
}

/** Раскрытие ответа: уровень и его пара каналов с полными названиями */
function reveal(q: LevelQuestion) {
  const levelId = q.kind === 'channel>level' ? channelById(q.channel).level! : q.level;
  const l = levelById(levelId);
  return { level: l, pair: channelsOfLevel(levelId) };
}

/** «Уровни»: шесть уровней каналов (六經) — канал ↔ уровень ↔ пара «рука + нога» */
export function LevelsScreen({ pool, length, levelOf, onRecord, onFinish, onExit }: SessionProps) {
  const [items] = useState(() => levelItems([...new Set(pool.map((p) => p.channel))]));
  const next = (shown: string[]) => {
    const item = pickNext(items, shown, (id) => levelOf(id, TRACK.levels));
    return makeLevelQuestion(item.id, levelOf(item.id, TRACK.levels));
  };
  const [question, setQuestion] = useState<LevelQuestion>(() => next([]));
  const [shownIds, setShownIds] = useState<string[]>(() => [questionId(question)]);
  const [results, setResults] = useState<SessionResult[]>([]);
  const [chosen, setChosen] = useState<number>();
  const timerRef = useRef<number>();
  // Таймер автоперехода создаётся в рендере до записи ответа — свежие значения берём из ref
  const latest = useRef({ levelOf, onFinish, shownIds });
  useEffect(() => {
    latest.current = { levelOf, onFinish, shownIds };
  });
  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const answered = chosen !== undefined;
  const ok = answered && isCorrect(question, chosen);

  const advance = (done: SessionResult[]) => {
    window.clearTimeout(timerRef.current);
    if (done.length >= length) {
      latest.current.onFinish(done);
      return;
    }
    const shown = latest.current.shownIds;
    const item = pickNext(items, shown, (id) => latest.current.levelOf(id, TRACK.levels));
    const q = makeLevelQuestion(item.id, latest.current.levelOf(item.id, TRACK.levels));
    setQuestion(q);
    setShownIds([...shown, questionId(q)]);
    setChosen(undefined);
  };

  const choose = (index: number) => {
    if (answered) return;
    const right = isCorrect(question, index);
    const id = questionId(question);
    const done = [...results, { id, ok: right }];
    setChosen(index);
    setResults(done);
    onRecord(id, TRACK.levels, right);
    if (right) timerRef.current = window.setTimeout(() => advance(done), 800);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
      if (!answered && /^[1-9]$/.test(e.key)) {
        const i = Number(e.key) - 1;
        if (i < question.options.length) choose(i);
      } else if (answered && !ok && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        advance(results);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const view = describe(question);
  const shown = reveal(question);

  return (
    <main className="screen quiz">
      <SessionTop
        done={results.length}
        total={length}
        onExit={() => {
          window.clearTimeout(timerRef.current);
          onExit();
        }}
      />

      <section className={`card quiz-card ${answered ? (ok ? 'card--ok' : 'card--bad') : ''}`}>
        <p className="card__prompt">{view.ask}</p>
        <p className="quiz__prompt-value">{view.prompt}</p>
        {view.hanzi && <span className="quiz__prompt-hanzi hanzi">{view.hanzi}</span>}
        {answered && (
          <div className="levels__reveal" role="status">
            <strong>
              {levelLabel(shown.level)} <span className="hanzi">{shown.level.hanzi}</span>
            </strong>
            {shown.pair.map((c) => (
              <span key={c.id}>
                {fullName(c)} <span className="hanzi muted">{c.fullHanzi}</span>
              </span>
            ))}
          </div>
        )}
      </section>

      <div className="answers">
        {view.options.map((label, i) => {
          const right = isCorrect(question, i);
          const state = answered ? (right ? ' answer--ok' : i === chosen ? ' answer--bad' : ' answer--dim') : '';
          return (
            <button key={label} className={`answer${state}`} disabled={answered} onClick={() => choose(i)}>
              <span className="answer__key" aria-hidden>
                {i + 1}
              </span>
              <span className="answer__mark" aria-hidden>
                {answered && right ? '✓' : answered && i === chosen ? '✗' : ''}
              </span>
              <span className="answer__text">{label}</span>
            </button>
          );
        })}
      </div>

      <div className="quiz__footer">
        {answered && !ok && (
          <button className="btn btn--primary btn--wide" onClick={() => advance(results)}>
            Дальше
          </button>
        )}
      </div>
    </main>
  );
}
