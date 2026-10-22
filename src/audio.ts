export class DeskAudio {
  private context: AudioContext | null = null;
  muted = true;
  play(kind: 'paper' | 'stamp' | 'phone' | 'button') {
    if (this.muted || document.hidden) return;
    try {
      this.context ??= new AudioContext();
      void this.context.resume();
      const ctx = this.context;
      const now = ctx.currentTime;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = kind === 'paper' ? 'triangle' : 'sine';
      const freq = { paper: 170, stamp: 80, phone: 680, button: 320 }[kind];
      oscillator.frequency.setValueAtTime(freq, now);
      oscillator.frequency.exponentialRampToValueAtTime(freq * 0.55, now + 0.1);
      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (kind === 'phone' ? 0.28 : 0.12));
      oscillator.connect(gain); gain.connect(ctx.destination);
      oscillator.start(); oscillator.stop(now + 0.3);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    } catch { /* Sound is optional; documents carry all information. */ }
  }
  suspend() { if (this.context?.state === 'running') void this.context.suspend(); }
}
