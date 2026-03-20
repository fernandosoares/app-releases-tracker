import { Notification } from "electron";
import type { NotificationPort } from "../../domain/ports/NotificationPort";
import type { TrackedAppId } from "../../domain/app/TrackedAppId";

/**
 * Adapter — delivers OS-level notifications via Electron's Notification API.
 *
 * Runs in the Main process. The Notification constructor is called only when
 * Electron's `isSupported()` guard passes, so the adapter degrades silently
 * on environments where notifications are unavailable (e.g. CI).
 */
export class ElectronNotificationAdapter implements NotificationPort {
  async notifyUpdateAvailable(
    _appId: TrackedAppId,
    appName: string,
    latestVersion: string,
  ): Promise<void> {
    if (!Notification.isSupported()) {
      return;
    }

    const notification = new Notification({
      title: `Update available — ${appName}`,
      body: `Version ${latestVersion} is now available.`,
      silent: false,
    });

    notification.show();
  }
}
