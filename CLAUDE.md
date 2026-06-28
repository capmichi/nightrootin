# NightCast — Claude Code 開発ガイド

## 概要
就寝前の誘導音声PWA。再生を押してスマホを伏せたら、声だけで眠りへ連れて行く。

## 技術スタック
- Vite + React (JSX)、SPA
- Vercel Functions (`api/` ディレクトリ)
- デプロイ: Vercel (未リンク。リンク後このファイルに URL を記載)
- ポート: 3003 (dev server)

## ファイル構成

| 場所 | 役割 |
|------|------|
| `src/lib/routine.js` | 台本データ(ROUTINE)。唯一の真実 |
| `src/lib/db.js` | IndexedDB ヘルパー(getAudio / saveAudio / clearAllAudio) |
| `src/lib/chime.js` | Web Audio チャイム生成 + 無音ループ |
| `src/hooks/usePlayer.js` | 再生ステートマシン |
| `src/components/HomeScreen.jsx` | ホーム画面(再生ボタン) |
| `src/components/PlayerScreen.jsx` | 再生中・ローディング・完了画面 |
| `api/fish.js` | Fish Audio TTS プロキシ |

## 環境変数

| キー | 用途 |
|------|------|
| `FISH_AUDIO_KEY` | Fish Audio API キー |
| `FISH_VOICE_A` | 夜用ナレーター声ID。落ち着いた低速の声を選ぶ |

## 再生エンジン仕様

**ステート**: `idle | loading | playing | paused | done`  
**playerState** (内部): `speaking | holding | chiming`

再生フロー: `text 読み上げ → holdSec 秒の無音 → chime:true ならチャイム → 次のstep`

- holdSec は `endAt` 方式(`Date.now() + holdSec*1000`)で計測。setInterval ドリフト対策
- ポーズ中は `holdEndAt` の残り時間を保存し、再開時に `Date.now() + 残り` で復元
- キャンセルは `tokenRef` インクリメントで実装。全 async 関数が `alive(token)` を確認

## IndexedDB 設計

- DB名: `nightcast-db`
- ストア名: `audio-cache`
- キー形式: `{routineId}-v{APP_VERSION}-{blockIdx}-{stepIdx}`  
  例: `default-v1.0-0-2`
- 値: `ArrayBuffer` (mp3)

APP_VERSION (`usePlayer.js` 内定数) を上げるとキャッシュキーが変わり自動無効化。

## 音声生成

- Fish Audio → `/api/fish` 経由。BATCH_SIZE=5 の並列バッチ生成
- フォールバック: ブラウザ `speechSynthesis` (ja-JP, rate: 0.85)
- ブラウザTTSは onend が来ないことがある → 20秒タイムアウト
- 生成失敗ステップは null のままキャッシュに保存されず、再生時にブラウザTTSを使う

## オーディオセッション維持

- `holdSec` 中の無音でiOS Safariのセッションが切れないよう、`startSilentLoop()` で
  極小振幅バッファを AudioContext でループ再生
- `wakeLock` は使わない(画面を消したいので逆効果)

## MediaSession API

ロック画面・通知から操作可能:
- play → resume()
- pause → pause()
- nexttrack → skipBlock() (次ブロックへスキップ)

## チャイム

Web Audio API で生成(ファイルなし):
- 528Hz 正弦波、約1.4秒フェードアウト
- `chime:true` のステップ後のみ鳴らす
- ボディスキャン全体は `chime:false` 固定(眠りに入る区間)

## sw.js キャッシュ

キャッシュ名: `nightcast-v{APP_VERSION}`。sw.js 自体は `no-cache`(vercel.json 設定済み)。  
バージョンを上げるときは sw.js の CACHE_NAME と APP_VERSION を合わせて更新。

## 将来の拡張(MVPには含まない)

- 朝版モード(morningRoutine.js): HANDOFF-morning.md 参照
- お散歩モード(walkMode.js): HANDOFF-walk.md 参照
- DayCastニュース連携: HANDOFF-news.md 参照
- 15分短縮版: routine.js の拡張メモ参照
