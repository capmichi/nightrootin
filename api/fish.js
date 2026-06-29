// Fish Audio TTS プロキシ — NightCast 専用（単一ボイス FISH_VOICE_A）
const rateLimits = new Map();
const DAILY_LIMIT = 200;

function checkRate(ip) {
  const now = Date.now();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const resetAt = midnight.getTime();

  let entry = rateLimits.get(ip);
  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt };
    rateLimits.set(ip, entry);
  }
  if (entry.count >= DAILY_LIMIT) return false;
  entry.count++;
  return true;
}

function sanitize(text) {
  return text.replace(/[\*#\-=`]/g, '').replace(/\s+/g, ' ').trim();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  if (!checkRate(ip)) {
    return res.status(429).json({ error: '1日の上限に達しました。' });
  }

  const apiKey = process.env.FISH_AUDIO_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Server misconfigured' });

  const { text, voiceKey } = req.body;
  if (!text) return res.status(400).json({ error: 'Missing text' });

  const clean = sanitize(text);
  if (clean.length > 400) {
    return res.status(400).json({ error: 'Text too long' });
  }

  // voiceKey → 対応する env 変数を参照。未設定なら FISH_VOICE_A にフォールバック
  const voiceEnvKey = voiceKey ? `FISH_VOICE_${voiceKey}` : 'FISH_VOICE_A';
  const voiceId = process.env[voiceEnvKey] || process.env.FISH_VOICE_A;

  try {
    const body = { text: clean, format: 'mp3', latency: 'balanced' };
    if (voiceId) body.reference_id = voiceId;

    const response = await fetch('https://api.fish.audio/v1/tts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      return res.status(response.status).json({
        error: `Fish Audio error: ${response.status}`,
        detail: errText,
      });
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    res.setHeader('Content-Type', 'audio/mpeg');
    res.status(200).send(buffer);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
