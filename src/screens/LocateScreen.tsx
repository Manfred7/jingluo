import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Figure } from '../components/Figure';
import { SessionTop } from '../components/SessionTop';
import { pointById } from '../data/points';
import type { Vec } from '../figures/geometry';
import { judgeTap } from '../logic/hitTest';
import { TRACK } from '../logic/modes';
import { placedOn, placementFor } from '../logic/placement';
import type { SessionProps, SessionResult, TapVerdict } from '../logic/quizTypes';
import { pickNext } from '../logic/session';
import './locate.css';

interface Answer {
  tap: Vec;
  verdict: TapVerdict;
}

/** «Отметь точку»: найти названную точку на фигуре без маркеров */
export function LocateScreen({ pool, length, levelOf, onRecord, onFinish, onExit }: SessionProps) {
  const sessionPool = useMemo(() => pool.filter((point) => placementFor(point.id) !== undefined), [pool]);
  const [currentId, setCurrentId] = useState<string | undefined>(() => {
    if (!sessionPool.length) return undefined;
    return pickNext(sessionPool, [], (id) => levelOf(id, TRACK.locate)).id;
  });
  const [shownIds, setShownIds] = useState<string[]>(() => (currentId ? [currentId] : []));
  const [results, setResults] = useState<SessionResult[]>([]);
  const [answer, setAnswer] = useState<Answer>();
  const answeredRef = useRef(false);
  const timerRef = useRef<number | undefined>(undefined);
  const svgRef = useRef<SVGSVGElement>(null);

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
    const next = pickNext(sessionPool, shownIds, (id) => levelOf(id, TRACK.locate));
    setCurrentId(next.id);
    setShownIds([...shownIds, next.id]);
    setAnswer(undefined);
    answeredRef.current = false;
  };

  const exit = () => {
    if (timerRef.current !== undefined) window.clearTimeout(timerRef.current);
    timerRef.current = undefined;
    onExit();
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
      if (answer && !answer.verdict.ok && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        advance(results);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const point = currentId ? pointById(currentId) : undefined;
  const placement = currentId ? placementFor(currentId) : undefined;

  const tapFigure = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!point || !placement || answer || answeredRef.current) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const svg = svgRef.current;
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return;
    const scale = Math.hypot(matrix.a, matrix.b);
    if (!Number.isFinite(scale) || scale === 0) return;
    event.preventDefault();

    const screenPoint = svg.createSVGPoint();
    screenPoint.x = event.clientX;
    screenPoint.y = event.clientY;
    const converted = screenPoint.matrixTransform(matrix.inverse());
    const tap: Vec = [converted.x, converted.y];
    const tolerance = Math.max(22 / scale, placement.view.cun * 0.7);
    const verdict = judgeTap(placedOn(placement.view), point.id, tap, tolerance, placement.view.cun);
    const answered = [...results, { id: point.id, ok: verdict.ok }];

    answeredRef.current = true;
    setAnswer({ tap, verdict });
    setResults(answered);
    onRecord(point.id, TRACK.locate, verdict.ok);
    if (verdict.ok) timerRef.current = window.setTimeout(() => advance(answered), 800);
  };

  if (!point || !placement) {
    return (
      <main className="screen locate">
        <SessionTop done={results.length} total={length} onExit={exit} />
        <section className="panel">
          <p className="muted">В выбранной колоде нет точек, размещённых на фигурах.</p>
          <button className="btn btn--primary btn--wide" onClick={exit}>
            В меню
          </button>
        </section>
      </main>
    );
  }

  const verdictClass = answer ? (answer.verdict.ok ? ' card--ok' : ' card--bad') : '';
  const nearestPoint = answer ? pointById(answer.verdict.nearestId) : undefined;
  const distance = answer?.verdict.distanceCun.toFixed(1).replace('.', ',');

  return (
    <main className="screen locate">
      <SessionTop done={results.length} total={length} onExit={exit} />

      <section className={`card locate__task${verdictClass}`}>
        <p className="card__prompt">Найдите точку на фигуре</p>
        <div className="point-card locate__point">
          <span className="point-card__code">{point.code}</span>
          <span className="point-card__name">{point.nameRu}</span>
          <span className="point-card__hanzi hanzi">{point.hanzi}</span>
        </div>
      </section>

      <div className="locate__figure-wrap">
        <Figure
          view={placement.view}
          placed={placement.placed}
          channels={[]}
          showPoint={() => false}
          onBackgroundDown={tapFigure}
          svgRef={svgRef}
          className="locate__figure"
          overlay={
            answer && (
              <g className="locate__overlay">
                <circle
                  className="locate__target-halo"
                  cx={answer.verdict.targetPos[0]}
                  cy={answer.verdict.targetPos[1]}
                  r={12}
                />
                <circle
                  className="locate__target"
                  cx={answer.verdict.targetPos[0]}
                  cy={answer.verdict.targetPos[1]}
                  r={6}
                />
                {answer.verdict.ok ? (
                  <circle className="locate__tap locate__tap--ok" cx={answer.tap[0]} cy={answer.tap[1]} r={10} />
                ) : (
                  <path
                    className="locate__tap locate__tap--bad"
                    d={`M${answer.tap[0] - 6},${answer.tap[1] - 6}L${answer.tap[0] + 6},${answer.tap[1] + 6}M${
                      answer.tap[0] - 6
                    },${answer.tap[1] + 6}L${answer.tap[0] + 6},${answer.tap[1] - 6}`}
                  />
                )}
              </g>
            )
          }
        />
      </div>

      {answer && (
        <div className={`locate__feedback ${answer.verdict.ok ? 'locate__feedback--ok' : 'locate__feedback--bad'}`} role="status">
          <strong>{answer.verdict.ok ? '✓ Верно' : '✗ Неверно'}</strong>
          {!answer.verdict.ok && (
            <>
              <span>Это ближе к {nearestPoint?.code ?? answer.verdict.nearestId}</span>
              <span>Мимо на {distance} цуня</span>
            </>
          )}
        </div>
      )}

      <div className="quiz__footer">
        {answer && !answer.verdict.ok && (
          <button className="btn btn--primary btn--wide" onClick={() => advance(results)}>
            Дальше
          </button>
        )}
      </div>
    </main>
  );
}
