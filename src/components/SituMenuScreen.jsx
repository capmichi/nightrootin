import { SITU_SCRIPTS } from '../lib/situScripts';

const styles = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: '0',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: '52px 28px 28px',
    gap: '16px',
  },
  backBtn: {
    background: 'transparent',
    border: 'none',
    color: '#404050',
    fontSize: '13px',
    cursor: 'pointer',
    padding: '4px 0',
    letterSpacing: '0.05em',
    WebkitTapHighlightColor: 'transparent',
  },
  title: {
    fontSize: '15px',
    color: '#7070a0',
    fontWeight: '400',
    letterSpacing: '0.1em',
  },
  list: {
    flex: 1,
    padding: '0 24px 40px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    overflowY: 'auto',
  },
  card: {
    background: '#0f0f1a',
    border: '1px solid #1e1e2e',
    borderRadius: '12px',
    padding: '22px 24px',
    cursor: 'pointer',
    transition: 'background 0.2s, border-color 0.2s',
    WebkitTapHighlightColor: 'transparent',
    textAlign: 'left',
  },
  cardTitle: {
    fontSize: '15px',
    color: '#b0b0c8',
    fontWeight: '400',
    letterSpacing: '0.04em',
    marginBottom: '8px',
  },
  cardDesc: {
    fontSize: '12px',
    color: '#404050',
    letterSpacing: '0.05em',
    lineHeight: 1.5,
  },
  playIcon: {
    fontSize: '11px',
    color: '#404058',
    marginTop: '14px',
    letterSpacing: '0.08em',
  },
};

export default function SituMenuScreen({ onSelect, onBack }) {
  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack}>
          ← もどる
        </button>
        <div style={styles.title}>シチュボイス</div>
      </div>

      <div style={styles.list}>
        {SITU_SCRIPTS.map((script) => (
          <button
            key={script.id}
            style={styles.card}
            onClick={() => onSelect(script)}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#141424';
              e.currentTarget.style.borderColor = '#2a2a40';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#0f0f1a';
              e.currentTarget.style.borderColor = '#1e1e2e';
            }}
          >
            <div style={styles.cardTitle}>{script.title}</div>
            <div style={styles.cardDesc}>{script.description}</div>
            <div style={styles.playIcon}>▷ 再生</div>
          </button>
        ))}
      </div>
    </div>
  );
}
