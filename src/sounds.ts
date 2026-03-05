// Web Audio API を使用したサウンドエフェクト

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// 簡易的な完了音（1タスク完了時）
export function playCompleteSound(): void {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  // 明るい「ピコッ」音
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, now);
  osc.frequency.setValueAtTime(1100, now + 0.1);

  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.2);
}

// ファンファーレ（3タスク完了時）
export function playFanfare(): void {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  const notes = [
    { freq: 523.25, start: 0, duration: 0.15 },    // C5
    { freq: 659.25, start: 0.15, duration: 0.15 }, // E5
    { freq: 783.99, start: 0.3, duration: 0.15 },  // G5
    { freq: 1046.5, start: 0.45, duration: 0.4 },  // C6
  ];

  notes.forEach(({ freq, start, duration }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, now + start);

    gain.gain.setValueAtTime(0.2, now + start);
    gain.gain.exponentialRampToValueAtTime(0.01, now + start + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + start);
    osc.stop(now + start + duration + 0.1);
  });
}

// 全完了時の大ファンファーレ
export function playBigFanfare(): void {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  // メロディ
  const melody = [
    { freq: 523.25, start: 0, duration: 0.12 },
    { freq: 587.33, start: 0.12, duration: 0.12 },
    { freq: 659.25, start: 0.24, duration: 0.12 },
    { freq: 698.46, start: 0.36, duration: 0.12 },
    { freq: 783.99, start: 0.48, duration: 0.12 },
    { freq: 880.00, start: 0.6, duration: 0.12 },
    { freq: 987.77, start: 0.72, duration: 0.12 },
    { freq: 1046.5, start: 0.84, duration: 0.5 },
  ];

  melody.forEach(({ freq, start, duration }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, now + start);

    gain.gain.setValueAtTime(0.15, now + start);
    gain.gain.setValueAtTime(0.15, now + start + duration * 0.8);
    gain.gain.exponentialRampToValueAtTime(0.01, now + start + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + start);
    osc.stop(now + start + duration + 0.1);
  });

  // 和音
  const chordStart = 0.84;
  [523.25, 659.25, 783.99, 1046.5].forEach((freq) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + chordStart);

    gain.gain.setValueAtTime(0.1, now + chordStart);
    gain.gain.exponentialRampToValueAtTime(0.01, now + chordStart + 0.8);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + chordStart);
    osc.stop(now + chordStart + 1);
  });
}

// 励まし音（残念な時）
export function playEncouragementSound(): void {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, now);
  osc.frequency.setValueAtTime(392, now + 0.2);
  osc.frequency.setValueAtTime(440, now + 0.4);

  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.6);
}
