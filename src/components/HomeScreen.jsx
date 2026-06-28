const styles = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '40px 32px',
    gap: '0',
  },
  moon: {
    fontSize: '56px',
    marginBottom: '28px',
    opacity: 0.85,
  },
  title: {
    fontSize: '22px',
    fontWeight: '500',
    color: '#c8c8d0',
    letterSpacing: '0.04em',
    marginBottom: '10px',
  },
  sub: {
    fontSize: '13px',
    color: '#505060',
    letterSpacing: '0.08em',
    marginBottom: '64px',
    lineHeight: 1.6,
    textAlign: 'center',
  },
  btn: {
    width: '88px',
    height: '88px',
    borderRadius: '50%',
    border: '1.5px solid #2a2a3a',
    background: '#13131f',
    color: '#9090b0',
    fontSize: '28px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s, border-color 0.2s',
    WebkitTapHighlightColor: 'transparent',
  },
  btnLabel: {
    fontSize: '12px',
    color: '#404050',
    marginTop: '16px',
    letterSpacing: '0.1em',
  },
};

export default function HomeScreen({ onStart }) {
  return (
    <div style={styles.wrap}>
      <div style={styles.moon}>🌙</div>
      <div style={styles.title}>おやすみルーティン</div>
      <div style={styles.sub}>
        約20分 · 声だけで眠りまで
        <br />
        画面を消したまま使えます
      </div>
      <button
        style={styles.btn}
        onClick={onStart}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#1c1c2e';
          e.currentTarget.style.borderColor = '#3a3a5a';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#13131f';
          e.currentTarget.style.borderColor = '#2a2a3a';
        }}
        aria-label="はじめる"
      >
        ▷
      </button>
      <div style={styles.btnLabel}>はじめる</div>
    </div>
  );
}
