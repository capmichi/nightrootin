import { useState, useRef, useMemo } from 'react';
import { ROUTINE } from '../lib/routine';
import { getAudio, saveAudio } from '../lib/db';
import { playChime, startSilentLoop } from '../lib/chime';

const BATCH_SIZE = 5;
const APP_VERSION = '1.0';

// ステップのキャッシュキー
function cacheKey(blockIdx, stepIdx) {
  return `${ROUTINE.id}-v${APP_VERSION}-${blockIdx}-${stepIdx}`;
}

function sanitizeText(text) {
  return text.replace(/[\*#\-=`]/g, '').replace(/\s+/g, ' ').trim();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ROUTINE をフラットな step 配列に展開
function buildFlatSteps() {
  return ROUTINE.blocks.flatMap((block, bi) =>
    block.steps.map((step, si) => ({
      ...step,
      blockId: block.id,
      blockName: block.name,
      blockIdx: bi,
      stepIdx: si,
    }))
  );
}

export function usePlayer() {
  // ─── UI 用ステート ───
  const [phase, setPhase] = useState('idle');
  // idle | loading | playing | paused | done
  const [playerState, setPlayerState] = useState('speaking');
  // speaking | holding | chiming
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loadProgress, setLoadProgress] = useState({ done: 0, total: 0 });
  const [holdRemaining, setHoldRemaining] = useState(0);

  // ─── 非同期制御用 Ref ───
  const audioCtxRef = useRef(null);
  const currentAudioRef = useRef(null);
  const silentSrcRef = useRef(null);
  const tokenRef = useRef(0);       // インクリメントでループをキャンセル
  const pausedRef = useRef(false);
  const holdEndAtRef = useRef(0);
  const currentIdxRef = useRef(0);
  const playerStateRef = useRef('speaking');

  const flatSteps = useMemo(() => buildFlatSteps(), []);

  // ─── ユーティリティ ───
  function alive(token) {
    return token === tokenRef.current;
  }

  function cancelLoop() {
    tokenRef.current++;
  }

  function stopSilentLoop() {
    try { silentSrcRef.current?.stop(); } catch (_) {}
    silentSrcRef.current = null;
  }

  function updateMediaSession(blockName) {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'おやすみルーティン',
        artist: blockName,
        album: '20分',
      });
    } catch (_) {}
  }

  function registerMediaHandlers() {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.setActionHandler('play', resume);
      navigator.mediaSession.setActionHandler('pause', pause);
      navigator.mediaSession.setActionHandler('nexttrack', skipBlock);
    } catch (_) {}
  }

  // ─── 音声生成・キャッシュ ───
  async function fetchFromServer(text) {
    const res = await fetch('/api/fish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: sanitizeText(text) }),
    });
    if (!res.ok) throw new Error(`fish error ${res.status}`);
    return await res.arrayBuffer();
  }

  async function generateAllAudio() {
    const total = flatSteps.length;
    let done = 0;
    setLoadProgress({ done, total });

    // 未キャッシュ分を収集
    const needed = [];
    for (let i = 0; i < total; i++) {
      const key = cacheKey(flatSteps[i].blockIdx, flatSteps[i].stepIdx);
      const cached = await getAudio(key);
      if (cached) {
        done++;
      } else {
        needed.push({ i, key, text: flatSteps[i].text });
      }
    }
    setLoadProgress({ done, total });

    // バッチ並列生成
    for (let b = 0; b < needed.length; b += BATCH_SIZE) {
      const batch = needed.slice(b, b + BATCH_SIZE);
      await Promise.all(
        batch.map(async ({ i, key, text }) => {
          try {
            const ab = await fetchFromServer(text);
            await saveAudio(key, ab);
          } catch (e) {
            console.warn(`step ${i} 生成失敗（ブラウザTTSにフォールバック）`, e);
            // null のままにしておく→再生時にブラウザTTSを使う
          }
          done++;
          setLoadProgress({ done, total });
        })
      );
    }
  }

  // ─── 再生: Fish Audio ───
  async function speakWithAudio(ab, token) {
    const blob = new Blob([ab], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentAudioRef.current = audio;

    await new Promise((resolve) => {
      let settled = false;
      function done() {
        if (settled) return;
        settled = true;
        clearInterval(watcher);
        URL.revokeObjectURL(url);
        resolve();
      }
      audio.onended = done;
      audio.onerror = done;
      setTimeout(done, 120_000); // 2 分の安全タイムアウト

      // キャンセル or スキップを検知
      const watcher = setInterval(() => {
        if (!alive(token)) done();
      }, 100);

      audio.play().catch(done);
    });
  }

  // ─── 再生: ブラウザ TTS フォールバック ───
  async function speakWithBrowserTTS(text, token) {
    if (!window.speechSynthesis) return;

    return new Promise((resolve) => {
      let settled = false;
      function done() {
        if (settled) return;
        settled = true;
        clearInterval(watcher);
        clearTimeout(timeout);
        resolve();
      }

      const utter = new SpeechSynthesisUtterance(sanitizeText(text));
      utter.lang = 'ja-JP';
      utter.rate = 0.85;
      utter.onend = done;
      utter.onerror = done;

      const timeout = setTimeout(() => {
        speechSynthesis.cancel();
        done();
      }, 20_000);

      const watcher = setInterval(() => {
        if (!alive(token)) {
          speechSynthesis.cancel();
          done();
        }
      }, 100);

      speechSynthesis.speak(utter);
    });
  }

  // ─── ステップ読み上げ ───
  async function speakStep(idx, token) {
    playerStateRef.current = 'speaking';
    setPlayerState('speaking');

    const step = flatSteps[idx];
    const key = cacheKey(step.blockIdx, step.stepIdx);
    const ab = await getAudio(key);

    if (ab && ab.byteLength > 0) {
      await speakWithAudio(ab, token);
    } else {
      await speakWithBrowserTTS(step.text, token);
    }
  }

  // ─── holdSec 無音待機（endAt 方式） ───
  async function holdFor(sec, token) {
    if (sec <= 0) return;

    playerStateRef.current = 'holding';
    setPlayerState('holding');

    holdEndAtRef.current = Date.now() + sec * 1000;
    let wasPaused = false;
    let savedRemaining = sec * 1000;

    while (true) {
      if (!alive(token)) return;

      const now = Date.now();
      const isPaused = pausedRef.current;

      if (isPaused) {
        // ポーズ中: 残り時間を保存して待機
        savedRemaining = Math.max(0, holdEndAtRef.current - now);
        wasPaused = true;
        setHoldRemaining(Math.ceil(savedRemaining / 1000));
        await sleep(100);
        continue;
      }

      if (wasPaused) {
        // 再開直後: endAt を残り時間から再計算
        holdEndAtRef.current = Date.now() + savedRemaining;
        wasPaused = false;
      }

      if (Date.now() >= holdEndAtRef.current) break;

      setHoldRemaining(Math.ceil((holdEndAtRef.current - Date.now()) / 1000));
      await sleep(200);
    }

    setHoldRemaining(0);
  }

  // ─── チャイム ───
  async function doChime(token) {
    if (!alive(token)) return;
    playerStateRef.current = 'chiming';
    setPlayerState('chiming');

    const ctx = audioCtxRef.current;
    if (ctx) {
      await playChime(ctx);
    }
    // ポーズ中ならチャイム後に待機
    while (pausedRef.current) {
      if (!alive(token)) return;
      await sleep(100);
    }
  }

  // ─── メインループ ───
  async function runFrom(startIdx, token) {
    // 無音オーディオでセッション維持
    if (audioCtxRef.current && !silentSrcRef.current) {
      silentSrcRef.current = startSilentLoop(audioCtxRef.current);
    }

    registerMediaHandlers();

    for (let i = startIdx; i < flatSteps.length; i++) {
      if (!alive(token)) return;

      setCurrentIdx(i);
      currentIdxRef.current = i;
      updateMediaSession(flatSteps[i].blockName);

      // ポーズ中なら再開を待つ
      while (pausedRef.current) {
        if (!alive(token)) return;
        await sleep(100);
      }

      // 読み上げ
      await speakStep(i, token);
      if (!alive(token)) return;

      // ポーズ中なら再開を待つ
      while (pausedRef.current) {
        if (!alive(token)) return;
        await sleep(100);
      }

      // 無音保持
      if (flatSteps[i].holdSec > 0) {
        await holdFor(flatSteps[i].holdSec, token);
        if (!alive(token)) return;
      }

      // チャイム
      if (flatSteps[i].chime) {
        await doChime(token);
        if (!alive(token)) return;
      }
    }

    // 完了
    stopSilentLoop();
    setPhase('done');
  }

  // ─── 公開 API ───
  async function start() {
    // ユーザーのジェスチャー内で AudioContext を初期化
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    }

    setPhase('loading');
    setCurrentIdx(0);
    currentIdxRef.current = 0;

    await generateAllAudio();

    pausedRef.current = false;
    setPhase('playing');
    const token = ++tokenRef.current;
    runFrom(0, token);
  }

  function pause() {
    if (pausedRef.current) return;
    pausedRef.current = true;
    setPhase('paused');

    // 読み上げ中なら HTML Audio を一時停止
    if (playerStateRef.current === 'speaking') {
      currentAudioRef.current?.pause();
    }
  }

  function resume() {
    if (!pausedRef.current) return;
    pausedRef.current = false;
    setPhase('playing');

    // 読み上げ再開
    if (playerStateRef.current === 'speaking') {
      currentAudioRef.current?.play().catch(console.warn);
    }
    // holding は holdFor ループが pausedRef を検知して自動再開
  }

  function skipBlock() {
    const currStep = flatSteps[currentIdxRef.current];
    if (!currStep) return;

    // 次のブロックの先頭を探す
    const nextIdx = flatSteps.findIndex(
      (s, i) => i > currentIdxRef.current && s.blockId !== currStep.blockId
    );
    if (nextIdx === -1) return;

    // 現在のループをキャンセル
    cancelLoop();
    currentAudioRef.current?.pause();
    speechSynthesis?.cancel();
    pausedRef.current = false;
    setHoldRemaining(0);

    setCurrentIdx(nextIdx);
    currentIdxRef.current = nextIdx;
    setPhase('playing');

    const token = tokenRef.current;
    runFrom(nextIdx, token);
  }

  function stop() {
    cancelLoop();
    currentAudioRef.current?.pause();
    speechSynthesis?.cancel();
    stopSilentLoop();
    pausedRef.current = false;

    setPhase('idle');
    setCurrentIdx(0);
    currentIdxRef.current = 0;
    setHoldRemaining(0);
    setPlayerState('speaking');
  }

  // ─── 派生データ ───
  const currentStep = flatSteps[currentIdx] ?? null;
  const blockInfo = ROUTINE.blocks.map((block, bi) => ({
    id: block.id,
    name: block.name,
    isActive: block.id === currentStep?.blockId,
    isDone: bi < (currentStep?.blockIdx ?? 0),
  }));

  return {
    phase,
    playerState,
    currentIdx,
    currentStep,
    blockInfo,
    loadProgress,
    holdRemaining,
    totalSteps: flatSteps.length,
    start,
    pause,
    resume,
    skipBlock,
    stop,
  };
}
