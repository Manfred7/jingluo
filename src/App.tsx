import { useEffect, useState } from 'react';
import type { ChannelId } from './data/channels';
import { loadSettings, saveSettings, type Settings } from './logic/settings';
import { watchTheme } from './logic/theme';
import { ChannelScreen } from './screens/ChannelScreen';
import { StartScreen } from './screens/StartScreen';

type Screen = { name: 'start' } | { name: 'channel'; channel: ChannelId };

export default function App() {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [screen, setScreen] = useState<Screen>({ name: 'start' });

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);
  useEffect(() => watchTheme(settings.theme), [settings.theme]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen]);

  if (screen.name === 'channel') {
    return <ChannelScreen channel={screen.channel} onBack={() => setScreen({ name: 'start' })} />;
  }
  return (
    <StartScreen
      theme={settings.theme}
      onTheme={(theme) => setSettings((s) => ({ ...s, theme }))}
      onChannel={(channel) => setScreen({ name: 'channel', channel })}
    />
  );
}
