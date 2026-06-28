// Web Audio API によるやわらかいチャイム音 (528Hz 正弦波)
export function playChime(audioCtx) {
  return new Promise((resolve) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = 'sine';
    osc.frequency.value = 528;

    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

    osc.start(now);
    osc.stop(now + 1.4);
    osc.onended = resolve;
  });
}

// holdSec 中にオーディオセッションを維持するための極小無音ループ
export function startSilentLoop(audioCtx) {
  const sampleRate = audioCtx.sampleRate;
  const buf = audioCtx.createBuffer(1, sampleRate * 2, sampleRate);
  const data = buf.getChannelData(0);
  // 完全な無音だとiOSがセッションを切ることがある。極小ノイズで維持
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * 1e-6;
  }

  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  src.connect(audioCtx.destination);
  src.start();
  return src;
}
