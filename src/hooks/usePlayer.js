import { useState, useRef } from 'react';
import { ROUTINE } from '../lib/routine';
import { getAudio, saveAudio } from '../lib/db';
import { playChime, startSilentLoop } from '../lib/chime';

const BATCH_SIZE = 5;
const APP_VERSION = '1.0';

function cacheKey(scriptId, blockIdx, stepIdx) {
  return `${scriptId}-v${APP_VERSION}-${blockIdx}-${stepIdx}`;
}

function sanitizeText(text) {
  return text.replace(/[\*#\-=`]/g, '').replace(/\s+/g, ' ').trim();
}

// Fish Audio S2 タグ([soft][breathy]等)を除去 — ブラウザTTSフォールバック用
function stripTags(text) {
  return text.replace(/\[[^\]]*\]/g, '').trim();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// スクリプトをフラットな step 配列に展開
function flattenScript(script) {
  return script.blocks.flatMap((block, bi) =>
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

  // ─── 現在のスクリプト Ref (start() 時にセット) ───
  const flatStepsRef = useRef(flattenScript(ROUTINE));
  const blocksRef = useRef(ROUTINE.blocks);
  const scriptIdRef = useRef(ROUTINE.id);
  const scriptTitleRef = useRef(ROUTINE.title);
  const voiceKeyRef = useRef('A');

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
        title: scriptTitleRef.current,
        artist: blockName,
        album: '',
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
  async function fetchFromServer(text, voiceKey) {
    const res = await fetch('/api/fish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: sanitizeText(text), voiceKey }),
    });
    if (!res.ok) throw new Error(`fish error ${res.status}`);
    return await res.arrayBuffer();
  }

  async function generateAllAudio(flatSteps, scriptId, voiceKey) {
    const total = flatSteps.length;
    let done = 0;
    setLoadProgress({ done, total });

    // 未キャッシュ分を収集 (空テキスト=ポーズステップは即カウント)
    const needed = [];
    for (let i = 0; i < total; i++) {
      if (!flatSteps[i].text) {
        done++;
        continue;
      }
      const key = cacheKey(scriptId, flatSteps[i].blockIdx, flatSteps[i].stepIdx);
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
            const ab = await fetchFromServer(text, voiceKey);
            await saveAudio(key, ab);
          } catch (e) {
            console.warn(`step ${i} 生成失敗（ブラウザTTSにフォールバック）`, e);
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

      // Fish Audio S2 タグを除去してから読み上げ
      const ttsText = stripTags(sanitizeText(text));
      const utter = new SpeechSynthesisUtterance(ttsText || text);
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
    const step = flatStepsRef.current[idx];

    // 空テキスト = ポーズステップ、読み上げをスキップ
    if (!step.text) return;

    playerStateRef.current = 'speaking';
    setPlayerState('speaking');

    const key = cacheKey(scriptIdRef.current, step.blockIdx, step.stepIdx);
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
        savedRemaining = Math.max(0, holdEndAtRef.current - now);
        wasPaused = true;
        setHoldRemaining(Math.ceil(savedRemaining / 1000));
        await sleep(100);
        continue;
      }

      if (wasPaused) {
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
    while (pausedRef.current) {
      if (!alive(token)) return;
      await sleep(100);
    }
  }

  // ─── メインループ ───
  async function runFrom(startIdx, token) {
    if (audioCtxRef.current && !silentSrcRef.current) {
      silentSrcRef.current = startSilentLoop(audioCtxRef.current);
    }

    registerMediaHandlers();

    const flatSteps = flatStepsRef.current;
    for (let i = startIdx; i < flatSteps.length; i++) {
      if (!alive(token)) return;

      setCurrentIdx(i);
      currentIdxRef.current = i;
      updateMediaSession(flatSteps[i].blockName);

      while (pausedRef.current) {
        if (!alive(token)) return;
        await sleep(100);
      }

      await speakStep(i, token);
      if (!alive(token)) return;

      while (pausedRef.current) {
        if (!alive(token)) return;
        await sleep(100);
      }

      if (flatSteps[i].holdSec > 0) {
        await holdFor(flatSteps[i].holdSec, token);
        if (!alive(token)) return;
      }

      if (flatSteps[i].chime) {
        await doChime(token);
        if (!alive(token)) return;
      }
    }

    stopSilentLoop();
    setPhase('done');
  }

  // ─── 公開 API ───
  async function start(script = ROUTINE) {
    // スクリプト情報をセット
    flatStepsRef.current = flattenScript(script);
    blocksRef.current = script.blocks;
    scriptIdRef.current = script.id;
    scriptTitleRef.current = script.title;
    voiceKeyRef.current = script.voiceKey ?? 'A';

    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    }

    setPhase('loading');
    setCurrentIdx(0);
    currentIdxRef.current = 0;

    await generateAllAudio(flatStepsRef.current, script.id, script.voiceKey ?? 'A');

    pausedRef.current = false;
    setPhase('playing');
    const token = ++tokenRef.current;
    runFrom(0, token);
  }

  function pause() {
    if (pausedRef.current) return;
    pausedRef.current = true;
    setPhase('paused');

    if (playerStateRef.current === 'speaking') {
      currentAudioRef.current?.pause();
    }
  }

  function resume() {
    if (!pausedRef.current) return;
    pausedRef.current = false;
    setPhase('playing');

    if (playerStateRef.current === 'speaking') {
      currentAudioRef.current?.play().catch(console.warn);
    }
  }

  function skipBlock() {
    const flatSteps = flatStepsRef.current;
    const currStep = flatSteps[currentIdxRef.current];
    if (!currStep) return;

    const nextIdx = flatSteps.findIndex(
      (s, i) => i > currentIdxRef.current && s.blockId !== currStep.blockId
    );
    if (nextIdx === -1) return;

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
  const currentStep = flatStepsRef.current[currentIdx] ?? null;
  const blockInfo = blocksRef.current.map((block, bi) => ({
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
    scriptTitle: scriptTitleRef.current,
    totalSteps: flatStepsRef.current.length,
    start,
    pause,
    resume,
    skipBlock,
    stop,
  };
}
