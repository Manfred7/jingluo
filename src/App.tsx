import { useEffect, useRef, useState } from 'react';
import { type ChannelId, channelById } from './data/channels';
import type { Point } from './data/points';
import { type Deck, deckById, deckMastery, deckPoints, withUnlocks } from './logic/decks';
import type { Mode } from './logic/modes';
import { EMPTY_PROGRESS, levelOf, loadProgress, type Progress, recordResult, saveProgress } from './logic/progress';
import type { SessionProps, SessionResult } from './logic/quizTypes';
import { loadSettings, saveSettings, type Settings } from './logic/settings';
import { watchTheme } from './logic/theme';
import { ChannelQuizScreen } from './screens/ChannelQuizScreen';
import { ChannelScreen } from './screens/ChannelScreen';
import { LevelsScreen } from './screens/LevelsScreen';
import { ComposeScreen } from './screens/ComposeScreen';
import { LocateScreen } from './screens/LocateScreen';
import { QuizScreen } from './screens/QuizScreen';
import { ResultScreen, type SessionSummary } from './screens/ResultScreen';
import { StartScreen } from './screens/StartScreen';

type SessionMode = Exclude<Mode, 'atlas'>;

interface Session {
  mode: SessionMode;
  deck: Deck;
  pool: Point[];
  /** Освоение колоды на старте — для итогов */
  masteryBefore: number;
  unlockedBefore: string[];
  /** Новый ключ — новый экземпляр экрана (повтор сессии начинается с нуля) */
  key: number;
}

type Screen =
  | { name: 'start' }
  | { name: 'channel'; channel: ChannelId }
  | { name: 'session'; session: Session }
  | { name: 'result'; session: Session; results: SessionResult[]; summary: SessionSummary };

export default function App() {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [screen, setScreen] = useState<Screen>({ name: 'start' });
  // Последний ответ сессии мог ещё не попасть в отрисовку к моменту onFinish — итоги считаем по свежему прогрессу
  const progressRef = useRef(progress);
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);
  useEffect(() => {
    saveProgress(progress);
  }, [progress]);
  useEffect(() => watchTheme(settings.theme), [settings.theme]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen.name]);

  const toStart = () => setScreen({ name: 'start' });

  const startSession = (mode: SessionMode, deck: Deck, pool: Point[]) =>
    setScreen({
      name: 'session',
      session: { mode, deck, pool, masteryBefore: deckMastery(progress, deck), unlockedBefore: progress.unlocked, key: Date.now() },
    });

  if (screen.name === 'channel') {
    return <ChannelScreen channel={screen.channel} onBack={toStart} />;
  }

  if (screen.name === 'result') {
    const { session } = screen;
    return (
      <ResultScreen
        results={screen.results}
        summary={screen.summary}
        onRetryMistakes={(ids) => {
          // в «Узнай канал» ошибки — каналы: повторяем их точки из той же колоды
          const wrong = new Set(ids);
          // в «Уровнях» ошибки — каналы и уровни (Шао-ян…): повторяем точки этих каналов
          const pool = session.pool.filter(
            (p) => wrong.has(p.id) || wrong.has(p.channel) || wrong.has(channelById(p.channel).level ?? ''),
          );
          startSession(session.mode, session.deck, pool.length ? pool : session.pool);
        }}
        onRestart={() => startSession(session.mode, session.deck, deckPoints(session.deck))}
        onMenu={toStart}
      />
    );
  }

  if (screen.name === 'session') {
    const { session } = screen;
    const props: SessionProps = {
      pool: session.pool,
      length: settings.length,
      levelOf: (id, track) => levelOf(progress, id, track),
      onRecord: (id, track, ok) =>
        setProgress((p) => {
          const next = withUnlocks(recordResult(p, id, track, ok));
          progressRef.current = next;
          return next;
        }),
      onFinish: (results) => {
        const latest = progressRef.current;
        setScreen({
          name: 'result',
          session,
          results,
          summary: {
            deckTitle: session.deck.title,
            masteryBefore: session.masteryBefore,
            masteryAfter: deckMastery(latest, session.deck),
            newlyUnlocked: latest.unlocked
              .filter((id) => !session.unlockedBefore.includes(id))
              .map((id) => deckById(id).title),
          },
        });
      },
      onExit: toStart,
    };
    switch (session.mode) {
      case 'quiz':
        return <QuizScreen key={session.key} {...props} directions={settings.directions} />;
      case 'compose':
        return <ComposeScreen key={session.key} {...props} />;
      case 'channel':
        return <ChannelQuizScreen key={session.key} {...props} />;
      case 'levels':
        return <LevelsScreen key={session.key} {...props} />;
      case 'locate':
        return <LocateScreen key={session.key} {...props} />;
    }
  }

  return (
    <StartScreen
      settings={settings}
      progress={progress}
      onSettings={(patch) => setSettings((s) => ({ ...s, ...patch }))}
      onChannel={(channel) => setScreen({ name: 'channel', channel })}
      onStart={() => {
        if (settings.mode === 'atlas') return;
        const deck = deckById(settings.deckId);
        startSession(settings.mode, deck, deckPoints(deck));
      }}
      onResetProgress={() => {
        if (window.confirm('Сбросить весь прогресс? Это нельзя отменить.')) setProgress(EMPTY_PROGRESS);
      }}
    />
  );
}
