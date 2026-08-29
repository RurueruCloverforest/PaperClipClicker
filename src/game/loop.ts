export type TickHandler = (elapsedSeconds: number) => void;

export class GameLoop {
  private frameId = 0;
  private lastTime = 0;

  constructor(private readonly onTick: TickHandler) {}

  start(): void {
    this.lastTime = performance.now();
    this.frameId = requestAnimationFrame(this.tick);
  }

  stop(): void {
    cancelAnimationFrame(this.frameId);
  }

  private readonly tick = (time: number): void => {
    const elapsedSeconds = Math.max(0, (time - this.lastTime) / 1000);
    this.lastTime = time;
    this.onTick(elapsedSeconds);
    this.frameId = requestAnimationFrame(this.tick);
  };
}
