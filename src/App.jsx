import { useState } from 'react';
import { usePlayer } from './hooks/usePlayer';
import { ROUTINE } from './lib/routine';
import HomeScreen from './components/HomeScreen';
import PlayerScreen from './components/PlayerScreen';
import SituMenuScreen from './components/SituMenuScreen';

const appStyle = {
  fontFamily: "'Hiragino Sans', 'Noto Sans JP', 'Helvetica Neue', sans-serif",
  background: '#090909',
  color: '#c0c0cc',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
};

export default function App() {
  const player = usePlayer();
  const [screen, setScreen] = useState('home'); // 'home' | 'situ'

  function handleStartRoutine() {
    player.start(ROUTINE);
  }

  function handleStartSitu(script) {
    player.start(script);
  }

  function handleStop() {
    player.stop();
  }

  const showPlayer = player.phase !== 'idle';

  return (
    <div style={appStyle}>
      {showPlayer ? (
        <PlayerScreen player={player} onStop={handleStop} />
      ) : screen === 'situ' ? (
        <SituMenuScreen
          onSelect={handleStartSitu}
          onBack={() => setScreen('home')}
        />
      ) : (
        <HomeScreen
          onStart={handleStartRoutine}
          onSitu={() => setScreen('situ')}
        />
      )}
    </div>
  );
}
