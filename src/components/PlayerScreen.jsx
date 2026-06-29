const styles = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: '0',
  },
  // ─ 上部: ブロック名・ステート ─
  header: {
    padding: '52px 32px 0',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockName: {
    fontSize: '17px',
    color: '#9090a8',
    letterSpacing: '0.12em',
    marginBottom: '16px',
    textAlign: 'center',
    fontWeight: '400',
  },
  stateLabel: {
    fontSize: '12px',
    color: '#383848',
    letterSpacing: '0.15em',
    marginBottom: '40px',
    minHeight: '18px',
  },
  // ─ ブロック進行ドット ─
  dots: {
    display: 'flex',
    gap: '10px',
    marginBottom: '12px',
  },
  dot: (active, done) => ({
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: active ? '#6060a0' : done ? '#303040' : '#1c1c28',
    transition: 'background 0.4s',
  }),
  // ─ ローディング ─
  loadWrap: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 40px',
  },
  loadLabel: {
    fontSize: '14px',
    color: '#505060',
    marginBottom: '20px',
    letterSpacing: '0.05em',
  },
  progressBar: {
    width: '100%',
    maxWidth: '240px',
    height: '2px',
    background: '#1c1c28',
    borderRadius: '1px',
    overflow: 'hidden',
    marginBottom: '12px',
  },
  progressFill: (pct) => ({
    height: '100%',
    width: `${pct}%`,
    background: '#4040708a',
    borderRadius: '1px',
    transition: 'width 0.3s',
  }),
  progressText: {
    fontSize: '11px',
    color: '#303040',
    letterSpacing: '0.1em',
  },
  loadNote: {
    fontSize: '11px',
    color: '#282830',
    marginTop: '28px',
    letterSpacing: '0.05em',
  },
  // ─ 完了 ─
  doneWrap: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 32px',
    gap: '12px',
  },
  doneMoon: {
    fontSize: '40px',
    opacity: 0.6,
    marginBottom: '8px',
  },
  doneText: {
    fontSize: '16px',
    color: '#505060',
    letterSpacing: '0.08em',
    textAlign: 'center',
    lineHeight: 1.7,
  },
  // ─ 下部コントロール ─
  controls: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '20px',
    padding: '0 32px 48px',
  },
  ctrlBtn: {
    padding: '10px 22px',
    borderRadius: '20px',
    border: '1px solid #1e1e2a',
    background: 'transparent',
    color: '#404050',
    fontSize: '12px',
    letterSpacing: '0.08em',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  },
  pauseBtn: {
    padding: '10px 26px',
    borderRadius: '20px',
    border: '1px solid #252535',
    background: '#111120',
    color: '#6060a0',
    fontSize: '13px',
    letterSpacing: '0.06em',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  },
  backBtn: {
    padding: '8px 18px',
    borderRadius: '16px',
    border: '1px solid #1a1a22',
    background: 'transparent',
    color: '#303038',
    fontSize: '11px',
    letterSpacing: '0.08em',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  },
  holdTimer: {
    fontSize: '11px',
    color: '#303040',
    letterSpacing: '0.1em',
    minHeight: '16px',
    marginTop: '8px',
  },
};

export default function PlayerScreen({ player, onStop }) {
  const { phase, playerState, currentStep, blockInfo, loadProgress, holdRemaining, scriptTitle } = player;

  if (phase === 'loading') {
    const pct = loadProgress.total > 0
      ? Math.round((loadProgress.done / loadProgress.total) * 100)
      : 0;
    return (
      <div style={styles.wrap}>
        <div style={styles.loadWrap}>
          <div style={styles.loadLabel}>音声を準備中...</div>
          <div style={styles.progressBar}>
            <div style={styles.progressFill(pct)} />
          </div>
          <div style={styles.progressText}>
            {loadProgress.done} / {loadProgress.total}
          </div>
          <div style={styles.loadNote}>次回からはすぐ始まります</div>
        </div>
        <div style={styles.controls}>
          <button style={styles.backBtn} onClick={onStop}>
            もどる
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'done') {
    const isRoutine = scriptTitle === 'おやすみルーティン';
    return (
      <div style={styles.wrap}>
        <div style={styles.doneWrap}>
          <div style={styles.doneMoon}>🌙</div>
          <div style={styles.doneText}>
            {isRoutine ? (
              <>おやすみなさい。<br />ゆっくり眠れますように。</>
            ) : (
              <>おわり。<br />{scriptTitle}</>
            )}
          </div>
        </div>
        <div style={styles.controls}>
          <button style={styles.backBtn} onClick={onStop}>
            とじる
          </button>
        </div>
      </div>
    );
  }

  // playing | paused
  const stateText = {
    speaking: '読み上げ中',
    holding: holdRemaining > 0 ? `${holdRemaining}秒` : '',
    chiming: '',
  }[playerState] ?? '';

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <div style={{ fontSize: '11px', color: '#2a2a38', letterSpacing: '0.12em', marginBottom: '24px' }}>
          {scriptTitle}
        </div>
        <div style={styles.blockName}>
          {currentStep?.blockName ?? ''}
        </div>
        <div style={styles.dots}>
          {blockInfo.map((b) => (
            <div key={b.id} style={styles.dot(b.isActive, b.isDone)} />
          ))}
        </div>
        <div style={styles.holdTimer}>
          {stateText}
        </div>
      </div>

      <div style={styles.controls}>
        <button
          style={styles.ctrlBtn}
          onClick={player.skipBlock}
          aria-label="次のブロックへ"
        >
          次へ
        </button>
        <button
          style={styles.pauseBtn}
          onClick={phase === 'paused' ? player.resume : player.pause}
          aria-label={phase === 'paused' ? '再開' : '一時停止'}
        >
          {phase === 'paused' ? '再開' : '一時停止'}
        </button>
        <button style={styles.ctrlBtn} onClick={onStop} aria-label="終了">
          終了
        </button>
      </div>
    </div>
  );
}
