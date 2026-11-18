// Subtle Web Audio API synthesizer for live quiz cues (no external audio files needed)
class QuizSoundEngine {
  private ctx: AudioContext | null = null;
  public muted = false;

  private getContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private tone(freq: number, duration: number, type: OscillatorType = 'sine', gainVal = 0.08, delay = 0) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainVal, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playJoin() {
    this.tone(587.33, 0.12, 'triangle', 0.06, 0);
    this.tone(880, 0.18, 'triangle', 0.06, 0.07);
  }

  playLockIn() {
    this.tone(523.25, 0.1, 'sine', 0.07, 0);
  }

  playTick() {
    this.tone(740, 0.05, 'sine', 0.035, 0);
  }

  playQuestionStart() {
    this.tone(440, 0.12, 'triangle', 0.07, 0);
    this.tone(554.37, 0.12, 'triangle', 0.07, 0.09);
    this.tone(659.25, 0.22, 'triangle', 0.08, 0.18);
  }

  playReveal() {
    this.tone(523.25, 0.14, 'triangle', 0.08, 0);
    this.tone(659.25, 0.14, 'triangle', 0.08, 0.1);
    this.tone(783.99, 0.28, 'triangle', 0.09, 0.2);
  }

  playWin() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => this.tone(n, 0.26, 'triangle', 0.09, idx * 0.11));
  }
}

export const quizSound = new QuizSoundEngine();
