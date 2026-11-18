// Dramatic Web Audio API studio music & SFX engine (zero external MP3 dependencies)
class QuizSoundEngine {
  private ctx: AudioContext | null = null;
  private loopTimer: number | null = null;
  private stepCount = 0;
  private currentMode: 'none' | 'lobby' | 'question' | 'question-urgent' = 'none';
  public muted = false;

  private getContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlock() {
    this.getContext();
  }

  public setMuted(mute: boolean) {
    this.muted = mute;
    if (mute) {
      this.stopMusic();
    }
  }

  private playVoice(
    freq: number,
    duration: number,
    type: OscillatorType = 'triangle',
    gainVal = 0.08,
    delay = 0,
    endFreq?: number
  ) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    }
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(gainVal, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.03);
  }

  private playNoiseHit(duration = 0.08, gainVal = 0.04, highpass = 1800, delay = 0) {
    const ctx = this.getContext();
    if (!ctx) return;
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = highpass;
    const gain = ctx.createGain();
    const now = ctx.currentTime + delay;
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start(now);
  }

  public stopMusic() {
    if (this.loopTimer !== null) {
      window.clearInterval(this.loopTimer);
      this.loopTimer = null;
    }
    this.currentMode = 'none';
  }

  public startLobbyMusic() {
    if (this.muted || this.currentMode === 'lobby') return;
    this.stopMusic();
    this.currentMode = 'lobby';
    this.stepCount = 0;

    // Warm, uplifting campus-lounge groove (~112 BPM 8th-note steps)
    const bassNotes = [110, 110, 130.81, 146.83, 164.81, 146.83, 130.81, 98];
    const arpNotes = [440, 523.25, 659.25, 880, 659.25, 523.25, 587.33, 659.25];

    const step = () => {
      if (this.muted || this.currentMode !== 'lobby') return;
      const i = this.stepCount % 8;
      if (i % 2 === 0) {
        this.playVoice(bassNotes[i], 0.28, 'sine', 0.055);
      }
      this.playVoice(arpNotes[i], 0.19, 'triangle', 0.032);
      if (i % 4 === 2) {
        this.playNoiseHit(0.04, 0.015, 4500);
      }
      this.stepCount++;
    };

    step();
    this.loopTimer = window.setInterval(step, 265);
  }

  public startQuestionMusic(urgent = false) {
    const targetMode = urgent ? 'question-urgent' : 'question';
    if (this.muted || this.currentMode === targetMode) return;
    this.stopMusic();
    this.currentMode = targetMode;
    this.stepCount = 0;

    // Dramatic suspense beat (drives faster & sharper in final 5 seconds)
    const pulseBass = [98, 98, 116.54, 110, 98, 98, 130.81, 116.54];
    const tensionNotes = [392, 466.16, 523.25, 587.33];
    const intervalMs = urgent ? 185 : 250;

    const step = () => {
      if (this.muted || (this.currentMode !== 'question' && this.currentMode !== 'question-urgent')) return;
      const i = this.stepCount % 8;

      // Deep dramatic heartbeat sub-bass
      if (i % 2 === 0) {
        this.playVoice(pulseBass[i], 0.2, 'sawtooth', urgent ? 0.045 : 0.035, 0, pulseBass[i] * 0.72);
        this.playVoice(pulseBass[i] * 0.5, 0.22, 'sine', urgent ? 0.09 : 0.07);
      }

      // Crisp rhythmic tension tick
      this.playNoiseHit(0.035, urgent ? 0.028 : 0.018, 3600);

      // Suspense stabs on off-beats
      if (i === 1 || i === 5) {
        const note = tensionNotes[(Math.floor(this.stepCount / 4)) % tensionNotes.length];
        this.playVoice(note, 0.14, 'triangle', urgent ? 0.045 : 0.03);
      }

      if (urgent && i % 2 === 1) {
        this.playVoice(880, 0.07, 'sine', 0.035);
      }

      this.stepCount++;
    };

    step();
    this.loopTimer = window.setInterval(step, intervalMs);
  }

  playJoin() {
    this.playVoice(523.25, 0.14, 'triangle', 0.08, 0);
    this.playVoice(659.25, 0.14, 'triangle', 0.08, 0.06);
    this.playVoice(1046.5, 0.24, 'sine', 0.07, 0.12);
  }

  playLockIn() {
    this.playVoice(587.33, 0.1, 'triangle', 0.08, 0);
    this.playVoice(880, 0.14, 'sine', 0.07, 0.05);
  }

  playTick(urgent = false) {
    if (urgent) {
      this.playVoice(987.77, 0.07, 'triangle', 0.06, 0);
      this.playVoice(1174.66, 0.08, 'sine', 0.045, 0.06);
    } else {
      this.playVoice(740, 0.05, 'sine', 0.035, 0);
    }
  }

  playQuestionStart() {
    // Dramatic low impact + rising fanfare swell
    this.playVoice(140, 0.35, 'sine', 0.16, 0, 48);
    this.playNoiseHit(0.18, 0.05, 1200, 0);
    this.playVoice(440, 0.18, 'triangle', 0.08, 0.05);
    this.playVoice(554.37, 0.18, 'triangle', 0.08, 0.13);
    this.playVoice(659.25, 0.25, 'triangle', 0.09, 0.21);
    this.playVoice(880, 0.35, 'sawtooth', 0.045, 0.28);
  }

  playReveal() {
    this.stopMusic();
    // Rapid dramatic drumroll into triumphant major reveal chord
    this.playNoiseHit(0.05, 0.04, 1500, 0);
    this.playNoiseHit(0.05, 0.05, 1500, 0.07);
    this.playNoiseHit(0.06, 0.06, 1500, 0.14);
    this.playVoice(160, 0.35, 'sine', 0.14, 0.2, 55);
    this.playVoice(523.25, 0.45, 'triangle', 0.09, 0.22);
    this.playVoice(659.25, 0.45, 'triangle', 0.08, 0.22);
    this.playVoice(783.99, 0.5, 'triangle', 0.09, 0.22);
    this.playVoice(1046.5, 0.55, 'sine', 0.07, 0.28);
  }

  playWin() {
    this.stopMusic();
    // Epic victory fanfare
    const melody = [
      { f: 523.25, d: 0.16, t: 0 },
      { f: 659.25, d: 0.16, t: 0.12 },
      { f: 783.99, d: 0.16, t: 0.24 },
      { f: 1046.5, d: 0.35, t: 0.36 },
      { f: 783.99, d: 0.16, t: 0.58 },
      { f: 1046.5, d: 0.7, t: 0.72 }
    ];
    this.playVoice(130.81, 0.45, 'sine', 0.14, 0, 65);
    melody.forEach((n) => {
      this.playVoice(n.f, n.d, 'triangle', 0.1, n.t);
      this.playVoice(n.f * 0.5, n.d, 'sawtooth', 0.035, n.t);
    });
    // Final shimmering chord
    this.playVoice(523.25, 0.8, 'sine', 0.07, 0.72);
    this.playVoice(659.25, 0.8, 'sine', 0.07, 0.72);
    this.playVoice(783.99, 0.8, 'sine', 0.07, 0.72);
  }
}

export const quizSound = new QuizSoundEngine();
