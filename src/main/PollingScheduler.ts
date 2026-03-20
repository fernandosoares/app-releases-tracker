import type { CheckForUpdates } from "../application/CheckForUpdates";

const DEFAULT_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

/**
 * Runs CheckForUpdates on a configurable interval.
 * Errors are logged but never crash the process — a failing poll is retried
 * on the next tick.
 */
export class PollingScheduler {
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly checkForUpdates: CheckForUpdates,
    private readonly intervalMs: number = DEFAULT_INTERVAL_MS,
  ) {}

  start(): void {
    if (this.timer !== null) {
      return;
    }

    this.timer = setInterval(() => {
      this.poll().catch((err: unknown) => {
        console.error("[PollingScheduler] poll error:", err);
      });
    }, this.intervalMs);
  }

  stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** Run a poll immediately (also called on app ready). */
  async pollNow(): Promise<void> {
    await this.poll();
  }

  private async poll(): Promise<void> {
    await this.checkForUpdates.execute({});
  }
}
