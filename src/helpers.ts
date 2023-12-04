export class Timer {
  private timerId: number | undefined = undefined;
  private start: Date = new Date();
  private remaining: number;

  constructor(private callback: () => void, delay: number) {
    this.remaining = delay;
    this.resume();
  }

  public pause() {
    clearTimeout(this.timerId);
    this.remaining -= new Date().valueOf() - this.start.valueOf();
  };

  resume() {
    clearTimeout(this.timerId);
    this.timerId = window.setTimeout(this.callback, this.remaining);
  };

  clear() {
    clearTimeout(this.timerId);
  };
}
