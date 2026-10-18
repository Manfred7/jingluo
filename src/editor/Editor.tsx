import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Figure } from '../components/Figure';
import { CHANNELS, type ChannelId } from '../data/channels';
import { pointById, pointsOf } from '../data/points';
import { round, type Vec } from '../figures/geometry';
import type { ViewDef, ViewId } from '../figures/types';
import { OVERRIDES, VIEWS, placementsOf, type Overrides } from '../figures/views';
import './editor.css';

const ALL = 'all';
type ChannelSelection = ChannelId | typeof ALL;

interface DragState {
  pointerId: number;
  pointId: string;
  view: ViewDef;
  target: Element;
}

const isBilateral = (id: string) => pointById(id)?.bilateral ?? false;

function cloneOverrides(source: Overrides): Overrides {
  const clone: Overrides = {};
  for (const viewId of Object.keys(source) as ViewId[]) {
    const points = source[viewId];
    if (!points) continue;
    const copied: Record<string, Vec> = {};
    for (const [pointId, position] of Object.entries(points)) copied[pointId] = [position[0], position[1]];
    clone[viewId] = copied;
  }
  return clone;
}

function withPosition(source: Overrides, view: ViewDef, pointId: string, position: Vec): Overrides {
  const next = round(position);
  const previous = source[view.id]?.[pointId] ?? view.computed[pointId];
  if (previous && previous[0] === next[0] && previous[1] === next[1]) return source;
  return {
    ...source,
    [view.id]: {
      ...(source[view.id] ?? {}),
      [pointId]: next,
    },
  };
}

/** Расстановка точек поверх формул; доступен только в dev-сервере по ?edit. */
export default function Editor() {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [overrides, setOverrides] = useState<Overrides>(() => cloneOverrides(OVERRIDES));
  const [savedJson, setSavedJson] = useState(() => JSON.stringify(OVERRIDES));
  const [viewId, setViewId] = useState<ViewId>(VIEWS[0].id);
  const [channelChoice, setChannelChoice] = useState<ChannelSelection>('LU');
  const [selectedId, setSelectedId] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const view = VIEWS.find((item) => item.id === viewId) ?? VIEWS[0];
  const placed = placementsOf(view, overrides, isBilateral);
  const ownPlaced = placed.filter((item) => !item.mirrored);
  const placedIds = new Set(ownPlaced.map((item) => item.pointId));
  const availableChannels = CHANNELS.filter(
    (channel) => view.paths[channel.id] || ownPlaced.some((item) => item.pointId.startsWith(`${channel.id}-`)),
  );
  const selectedChannel: ChannelSelection =
    channelChoice !== ALL && availableChannels.some((channel) => channel.id === channelChoice) ? channelChoice : ALL;
  const channelsToDraw: ChannelId[] =
    selectedChannel === ALL ? availableChannels.map((channel) => channel.id) : [selectedChannel];
  const listedPoints =
    selectedChannel === ALL
      ? ownPlaced.flatMap((item) => {
          const point = pointById(item.pointId);
          return point ? [point] : [];
        })
      : pointsOf(selectedChannel);
  const selectedPoint = selectedId ? pointById(selectedId) : undefined;
  const selectedPlaced = selectedId ? ownPlaced.find((item) => item.pointId === selectedId) : undefined;
  const selectedIsPlaced = selectedPlaced !== undefined;
  const hasOverride = selectedId !== undefined && overrides[view.id]?.[selectedId] !== undefined;
  const hasFormula = selectedId !== undefined && view.computed[selectedId] !== undefined;
  const dirty = JSON.stringify(overrides) !== savedJson;

  const toViewCoordinates = (clientX: number, clientY: number): Vec | undefined => {
    const svg = svgRef.current;
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return undefined;
    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    const converted = point.matrixTransform(matrix.inverse());
    return [converted.x, converted.y];
  };

  const startDrag = (pointId: string, mirrored: boolean, event: ReactPointerEvent) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    setSelectedId(pointId);
    if (mirrored) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { pointerId: event.pointerId, pointId, view, target: event.currentTarget };
  };

  const moveDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const position = toViewCoordinates(event.clientX, event.clientY);
    if (!position) return;
    event.preventDefault();
    setOverrides((current) => withPosition(current, drag.view, drag.pointId, position));
  };

  const finishDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.target.hasPointerCapture(drag.pointerId)) drag.target.releasePointerCapture(drag.pointerId);
    dragRef.current = null;
  };

  const placeSelected = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!selectedId || selectedPlaced || (event.pointerType === 'mouse' && event.button !== 0)) return;
    const position = toViewCoordinates(event.clientX, event.clientY);
    if (!position) return;
    event.preventDefault();
    setOverrides((current) => withPosition(current, view, selectedId, position));
  };

  const changeCoordinate = (axis: 0 | 1, raw: string) => {
    if (!selectedId || raw.trim() === '') return;
    const value = Number(raw);
    if (!Number.isFinite(value)) return;
    setOverrides((current) => {
      const previous = current[view.id]?.[selectedId] ?? view.computed[selectedId];
      if (!previous) return current;
      const next: Vec = axis === 0 ? [value, previous[1]] : [previous[0], value];
      return withPosition(current, view, selectedId, next);
    });
  };

  const removeOverride = () => {
    if (!selectedId) return;
    setOverrides((current) => {
      const own = current[view.id];
      if (!own || !(selectedId in own)) return current;
      const nextOwn = { ...own };
      delete nextOwn[selectedId];
      const next = { ...current };
      if (Object.keys(nextOwn).length > 0) next[view.id] = nextOwn;
      else delete next[view.id];
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    setNotice('');
    setError('');
    const body = JSON.stringify(overrides);
    try {
      const response = await fetch('/__jingluo/placements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Ошибка сохранения: ${response.status}`);
      }
      setSavedJson(body);
      setNotice('Правки сохранены');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось сохранить правки');
    } finally {
      setSaving(false);
    }
  };

  const copyJson = async () => {
    setNotice('');
    setError('');
    try {
      await navigator.clipboard.writeText(`${JSON.stringify(overrides, null, 2)}\n`);
      setNotice('JSON скопирован');
    } catch {
      setError('Не удалось скопировать JSON');
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!selectedId || !selectedIsPlaced || event.altKey || event.ctrlKey || event.metaKey) return;
      // в полях ввода стрелки меняют само поле, а не двигают точку
      if (
        event.target instanceof HTMLSelectElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLInputElement
      )
        return;
      let delta: Vec;
      switch (event.key) {
        case 'ArrowLeft':
          delta = [-1, 0];
          break;
        case 'ArrowRight':
          delta = [1, 0];
          break;
        case 'ArrowUp':
          delta = [0, -1];
          break;
        case 'ArrowDown':
          delta = [0, 1];
          break;
        default:
          return;
      }
      event.preventDefault();
      const step = event.shiftKey ? 5 : 1;
      setOverrides((current) => {
        const previous = current[view.id]?.[selectedId] ?? view.computed[selectedId];
        if (!previous) return current;
        return withPosition(current, view, selectedId, [previous[0] + delta[0] * step, previous[1] + delta[1] * step]);
      });
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedId, selectedIsPlaced, view]);

  return (
    <main className="editor">
      <header className="editor__header">
        <div>
          <h1>Редактор точек</h1>
          <p className={`editor__dirty ${dirty ? 'is-dirty' : ''}`}>
            {dirty ? 'Есть несохранённые правки' : 'Все правки сохранены'}
          </p>
        </div>
        <div className="editor__actions">
          <button type="button" className="editor__button" onClick={copyJson}>
            Скопировать JSON
          </button>
          <button type="button" className="editor__button editor__button--primary" onClick={save} disabled={saving || !dirty}>
            {saving ? 'Сохранение…' : 'Сохранить'}
          </button>
        </div>
      </header>

      <div className="editor__selectors">
        <label>
          <span>Вид</span>
          <select
            value={view.id}
            onChange={(event) => {
              setViewId(event.currentTarget.value as ViewId);
              setSelectedId(undefined);
              dragRef.current = null;
            }}
          >
            {VIEWS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Канал</span>
          <select
            value={selectedChannel}
            onChange={(event) => {
              setChannelChoice(event.currentTarget.value as ChannelSelection);
              setSelectedId(undefined);
            }}
          >
            <option value={ALL}>Все каналы</option>
            {availableChannels.map((channel) => (
              <option key={channel.id} value={channel.id}>
                {channel.code} · {channel.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {notice && <p className="editor__notice is-ok">{notice}</p>}
      {error && <p className="editor__notice is-bad">{error}</p>}

      <div className="editor__workspace">
        <section className="editor__figure-panel" aria-label="Фигура для расстановки точек">
          <div
            className="editor__canvas"
            onPointerMove={moveDrag}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
            onLostPointerCapture={() => {
              dragRef.current = null;
            }}
          >
            <Figure
              view={view}
              placed={placed}
              channels={channelsToDraw}
              activeChannel={selectedChannel === ALL ? undefined : selectedChannel}
              showPoint={(id) => selectedChannel === ALL || id.startsWith(`${selectedChannel}-`)}
              selectedId={selectedId}
              labels={(id) => pointById(id)?.code}
              onPointDown={startDrag}
              onBackgroundDown={placeSelected}
              svgRef={svgRef}
              className="editor__figure"
              overlay={
                <g className="editor__ghosts">
                  {ownPlaced.map((item) => {
                    if (selectedChannel !== ALL && !item.pointId.startsWith(`${selectedChannel}-`)) return null;
                    const formula = item.edited ? view.computed[item.pointId] : undefined;
                    if (!formula) return null;
                    return <circle key={item.pointId} className="editor__ghost" cx={formula[0]} cy={formula[1]} r={7} />;
                  })}
                </g>
              }
            />
          </div>
          <p className="editor__hint">
            Тяните точку мышью или пальцем. Стрелки двигают на 1, с Shift — на 5. Отражённые точки не редактируются.
          </p>
        </section>

        <aside className="editor__panel">
          {selectedPoint ? (
            <section className="editor__selected">
              <div className="editor__point-title">
                <strong>{selectedPoint.code}</strong>
                <span>{selectedPoint.nameRu}</span>
                <span className="hanzi">{selectedPoint.hanzi}</span>
              </div>
              {selectedPlaced ? (
                <>
                  <div className="editor__coordinates">
                    <label>
                      <span>X, px</span>
                      <input
                        type="number"
                        step="0.1"
                        value={selectedPlaced.pos[0]}
                        onChange={(event) => changeCoordinate(0, event.currentTarget.value)}
                      />
                      <small>{(selectedPlaced.pos[0] / view.cun).toFixed(2)} цуней</small>
                    </label>
                    <label>
                      <span>Y, px</span>
                      <input
                        type="number"
                        step="0.1"
                        value={selectedPlaced.pos[1]}
                        onChange={(event) => changeCoordinate(1, event.currentTarget.value)}
                      />
                      <small>{(selectedPlaced.pos[1] / view.cun).toFixed(2)} цуней</small>
                    </label>
                  </div>
                  <button
                    type="button"
                    className="editor__button"
                    onClick={removeOverride}
                    disabled={!hasOverride && hasFormula}
                  >
                    {hasFormula ? 'Вернуть по формуле' : 'Убрать с вида'}
                  </button>
                </>
              ) : (
                <p className="editor__hint">Точки нет на этом виде. Нажмите на фигуру, чтобы разместить её.</p>
              )}
            </section>
          ) : (
            <p className="editor__hint">Выберите точку на фигуре или в списке.</p>
          )}

          <section className="editor__points">
            <h2>{selectedChannel === ALL ? 'Точки на виде' : 'Точки канала'}</h2>
            {listedPoints.length > 0 ? (
              <ul className="editor__point-list">
                {listedPoints.map((point) => {
                  const isPlaced = placedIds.has(point.id);
                  return (
                    <li key={point.id}>
                      <button
                        type="button"
                        className={`editor__point-row ${point.id === selectedId ? 'is-selected' : ''}`}
                        onClick={() => setSelectedId(point.id)}
                      >
                        <strong>{point.code}</strong>
                        <span>{point.nameRu}</span>
                        <small className={`editor__presence ${isPlaced ? 'is-present' : 'is-absent'}`}>
                          {isPlaced ? 'размещена на этом виде' : 'нет на этом виде'}
                        </small>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="editor__hint">На этом виде пока нет точек.</p>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}
