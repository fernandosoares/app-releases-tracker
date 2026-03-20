import { TrackedAppId } from "../domain/app/TrackedAppId";
import { NotificationPort } from "../domain/ports/NotificationPort";
import { ReleaseSourcePort } from "../domain/ports/ReleaseSourcePort";
import { TrackedAppRepository } from "../domain/ports/TrackedAppRepository";

export interface CheckForUpdatesInput {
  /** Omit to check all tracked apps. */
  appId?: string;
}

export interface AppUpdateResult {
  id: string;
  name: string;
  updateAvailable: boolean;
  latestVersion: string;
  error?: string;
}

export interface CheckForUpdatesOutput {
  results: AppUpdateResult[];
}

/**
 * Use case: check one or all tracked apps for new releases.
 *
 * For each app:
 * 1. Ask the ReleaseSourcePort for the latest version.
 * 2. Call TrackedApp.markChecked() — domain decides whether an update is available.
 * 3. If update detected, delegate notification to NotificationPort.
 * 4. Persist the updated app.
 *
 * Errors per-app are caught individually so a single failing source never
 * blocks the remaining apps.
 */
export class CheckForUpdates {
  constructor(
    private readonly repository: TrackedAppRepository,
    private readonly source: ReleaseSourcePort,
    private readonly notifications: NotificationPort,
  ) {}

  async execute(input: CheckForUpdatesInput): Promise<CheckForUpdatesOutput> {
    const apps = input.appId
      ? await this.fetchOne(input.appId)
      : await this.repository.listAll();

    const results: AppUpdateResult[] = await Promise.all(
      apps.map(async (app) => {
        try {
          const latestVersion = await this.source.fetchLatestVersion(
            app.sourceUrl,
          );

          app.markChecked(latestVersion, new Date());

          if (app.hasUpdateAvailable()) {
            await this.notifications.notifyUpdateAvailable(
              app.id,
              app.name,
              latestVersion.toString(),
            );
          }

          await this.repository.save(app);

          return {
            id: app.id.toString(),
            name: app.name,
            updateAvailable: app.hasUpdateAvailable(),
            latestVersion: latestVersion.toString(),
          };
        } catch (error) {
          return {
            id: app.id.toString(),
            name: app.name,
            updateAvailable: false,
            latestVersion: app.latest?.toString() ?? "unknown",
            error: error instanceof Error ? error.message : String(error),
          };
        }
      }),
    );

    return { results };
  }

  private async fetchOne(appId: string) {
    const id = TrackedAppId.create(appId);
    const app = await this.repository.findById(id);

    if (!app) {
      throw new Error(`TrackedApp not found: ${appId}`);
    }

    return [app];
  }
}
