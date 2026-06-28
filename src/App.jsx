import { usePlayer } from './hooks/usePlayer';
import HomeScreen from './components/HomeScreen';
import PlayerScreen from './components/PlayerScreen';

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

  function handleStart() {
    player.start();
  }

  function handleStop() {
    player.stop();
  }

  const showPlayer = player.phase !== 'idle';

  return (
    <div style={appStyle}>
      {showPlayer ? (
        <PlayerScreen player={player} onStop={handleStop} />
      ) : (
        <HomeScreen onStart={handleStart} />
      )}
    </div>
  );
}
