import type { SpeedLevel } from '@core/types/scenario';

export class TimeManager {
  private speed: SpeedLevel = 'PLAY';
  private accumulator = 0;
  private lastTime = 0;
  private initialized = false;

  private readonly TICK_INTERVALS: Record<SpeedLevel, number> = {
    PAUSE: Infinity,
    PLAY: 1000 / 10,   // 10 TPS
    FAST: 1000 / 60,   // 60 TPS
    MAX: 0,            // time-budgeted
  };

  private static readonly MAX_BUDGET_MS = 12;
  private static readonly ACCUMULATOR_CAP = 200;

  private onTick: () => void;

  constructor(onTick: () => void) {
    this.onTick = onTick;
  }

  update(currentTime: number): void {
    if (!this.initialized) {
      this.lastTime = currentTime;
      this.initialized = true;
      return;
    }

    if (this.speed === 'PAUSE') {
      this.lastTime = currentTime;
      return;
    }

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    if (this.speed === 'MAX') {
      const startTime = performance.now();
      while (performance.now() - startTime < TimeManager.MAX_BUDGET_MS) {
        this.onTick();
      }
      return;
    }

    // Fixed timestep accumulator for PLAY/FAST
    const stepSize = this.TICK_INTERVALS[this.speed];
    this.accumulator += deltaTime;

    // Cap accumulator to prevent spiral of death
    if (this.accumulator > TimeManager.ACCUMULATOR_CAP) {
      this.accumulator = TimeManager.ACCUMULATOR_CAP;
    }

    while (this.accumulator >= stepSize) {
      this.onTick();
      this.accumulator -= stepSize;
    }
  }

  setSpeed(level: SpeedLevel): void {
    this.speed = level;
    this.accumulator = 0;
  }

  getSpeed(): SpeedLevel {
    return this.speed;
  }
}
