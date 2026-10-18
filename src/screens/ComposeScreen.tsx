import { useCallback, useEffect, useMemo, useState } from 'react';
import { Figure } from '../components/Figure';
import { SessionTop } from '../components/SessionTop';
import { type ChannelId, channelById } from '../data/channels';
import { pointById } from '../data/points';
import { TRACK } from '../logic/modes';
import { placementFor } from '../logic/placement';
import { makeComposeQuestion } from '../logic/quiz';
import type { SessionProps, SessionResult } from '../logic/quizTypes';
import { pickNext } from '../logic/session';
import './compose.css';

/** Сессия «Состав»: сначала канал точки, затем её номер */
export function ComposeScreen({ pool, length, levelOf, onRecord, onFinish, onExit }: SessionProps) {
  const sessionPool = useMemo(() => pool.filter((point) => placementFor(point.id) !== undefined), [pool]);
  const [currentId, setCurrentId] = useState<string | undefined>(() => {
    if (!sessionPool.length) return undefined;
    return pickNext(sessionPool, [], (id) => levelOf(id, TRACK.compose)).id;
  });
  const [shownIds, setShownIds] = useState<string[]>(() => (currentId ? [currentId] : []));
  const [results, setResults] = useState<SessionResult[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<ChannelId>();
  const [selectedNumber, setSelectedNumber] = useState<number>();

  const point = currentId ? pointById(currentId) : undefined;
  const placement = currentId ? placementFor(currentId) : undefined;
  const question = useMemo(() => (currentId ? makeComposeQuestion(currentId) : undefined), [currentId]);
  const answered = selectedNumber !== undefined;
  const channelOk = selectedChannel !== undefined && selectedChannel === point?.channel;
  const numberOk = selectedNumber !== undefined && selectedNumber === point?.number;
  const ok = channelOk && numberOk;

  const chooseChannel = useCallback((channel: ChannelId) => {
    setSelectedChannel((selected) => (selected === undefined ? channel : selected));
  }, []);

  const chooseNumber = useCallback(
    (number: number) => {
      if (!point || selectedChannel === undefined || selectedNumber !== undefined) return;
      const answerOk = selectedChannel === point.channel && number === point.number;
      setSelectedNumber(number);
      setResults([...results, { id: point.id, ok: answerOk }]);
      onRecord(point.id, TRACK.compose, answerOk);
    },
    [onRecord, point, results, selectedChannel, selectedNumber],
  );

  const advance = useCallback(() => {
    if (selectedNumber === undefined) return;
    if (results.length >= length) {
      onFinish(results);
      return;
    }
    const next = pickNext(sessionPool, shownIds, (id) => levelOf(id, TRACK.compose));
    setShownIds((ids) => [...ids, next.id]);
    setCurrentId(next.id);
    setSelectedChannel(undefined);
    setSelectedNumber(undefined);
  }, [length, levelOf, onFinish, results, selectedNumber, sessionPool, shownIds]);

  useEffect(() => {
    if (!answered || !ok) return;
    const timer = window.setTimeout(advance, 800);
    return () => window.clearTimeout(timer);
  }, [advance, answered, ok]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
      if ((event.key === 'Enter' || event.key === ' ') && answered && !ok) {
        event.preventDefault();
        advance();
        return;
      }
      if (answered || !question || !/^[1-9]$/.test(event.key)) return;
      const index = Number(event.key) - 1;
      if (selectedChannel === undefined) {
        const channel = question.channelOptions[index];
        if (channel !== undefined) {
          event.preventDefault();
          chooseChannel(channel);
        }
        return;
      }
      const number = question.numberOptions[index];
      if (number !== undefined) {
        event.preventDefault();
        chooseNumber(number);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [advance, answered, chooseChannel, chooseNumber, ok, question, selectedChannel]);

  if (!point || !question || !placement) {
    return (
      <main className="screen compose">
        <SessionTop done={0} total={length} onExit={onExit} />
        <section className="panel">
          <p className="muted">В выбранной колоде нет точек, размещённых на фигурах.</p>
          <button className="btn btn--primary btn--wide" onClick={onExit}>
            В меню
          </button>
        </section>
      </main>
    );
  }

  const channel = channelById(point.channel);
  const marker = placement.placed.filter((placed) => placed.pointId === point.id && !placed.mirrored);

  return (
    <main className="screen compose">
      <SessionTop done={results.length} total={length} onExit={onExit} />

      <section className={`card compose__card ${answered ? (ok ? 'card--ok' : 'card--bad') : ''}`}>
        <p className="card__prompt">Определите канал и номер точки</p>
        <Figure
          view={placement.view}
          placed={marker}
          channels={[]}
          selectedId={point.id}
          className="compose__figure"
        />
        {answered && (
          <>
            <p className={`compose__verdict ${ok ? 'compose__verdict--ok' : 'compose__verdict--bad'}`} role="status">
              {ok ? 'Верно ✓' : 'Неверно ✗'}
            </p>
            <div className="point-card compose__point" aria-label="Правильный ответ">
              <span className="point-card__code">{point.code}</span>
              <span className="point-card__name">{point.nameRu}</span>
              <span className="point-card__hanzi hanzi">{point.hanzi}</span>
            </div>
          </>
        )}
      </section>

      <section className="panel compose__steps">
        {selectedChannel === undefined ? (
          <>
            <p className="card__prompt">Шаг 1. Выберите канал</p>
            <div className="answers compose__channels">
              {question.channelOptions.map((id, index) => {
                const option = channelById(id);
                return (
                  <button
                    key={id}
                    className="answer compose__channel"
                    onClick={() => chooseChannel(id)}
                  >
                    {index < 9 && (
                      <span className="answer__key" aria-hidden="true">
                        {index + 1}
                      </span>
                    )}
                    <span className="compose__channel-code">{option.code}</span>
                    <span className="compose__channel-name">{option.name}</span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <p
              className={`compose__feedback ${channelOk ? 'compose__feedback--ok' : 'compose__feedback--bad'}`}
              role="status"
            >
              {channelOk
                ? `Канал: ${channel.code} ✓`
                : `Канал: ${channelById(selectedChannel).code} ✗ — верно ${channel.code}`}
            </p>
            <p className="card__prompt">Шаг 2. Выберите номер</p>
            <div className="answers compose__numbers">
              {question.numberOptions.map((number, index) => {
                const correct = number === point.number;
                const selected = number === selectedNumber;
                const stateClass = !answered
                  ? ''
                  : correct
                    ? 'answer--ok'
                    : selected
                      ? 'answer--bad'
                      : 'answer--dim';
                return (
                  <button
                    key={number}
                    className={`answer compose__number ${stateClass}`}
                    disabled={answered}
                    onClick={() => chooseNumber(number)}
                  >
                    {index < 9 && (
                      <span className="answer__key" aria-hidden="true">
                        {index + 1}
                      </span>
                    )}
                    {channel.code}-{number}
                    {answered && correct && (
                      <span className="answer__mark" aria-label="Верный номер">
                        ✓
                      </span>
                    )}
                    {answered && selected && !correct && (
                      <span className="answer__mark" aria-label="Неверный номер">
                        ✗
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </section>

      <div className="quiz__footer">
        {answered && !ok && (
          <button className="btn btn--primary btn--wide" onClick={advance}>
            Дальше
          </button>
        )}
      </div>
    </main>
  );
}
