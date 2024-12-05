export class Timer {
  private interval: ReturnType<typeof setInterval> | null = null;
  private remaining = 0;
  private callback: (remaining: number) => void;
  private onComplete: () => void;

  constructor(onTick: (remaining: number) => void, onComplete: () => void) {
    this.callback = onTick;
    this.onComplete = onComplete;
  }

  start(duration: number) {
    this.remaining = duration;
    if (this.interval) clearInterval(this.interval);
    
    this.interval = setInterval(() => {
      this.remaining -= 1;
      this.callback(this.remaining);
      
      if (this.remaining <= 0) {
        this.clear();
        this.onComplete();
      }
    }, 1000);
  }

  pause() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  resume() {
    if (!this.interval && this.remaining > 0) {
      this.start(this.remaining);
    }
  }

  clear() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  getTimeRemaining() {
    return this.remaining;
  }
}
