import { TrackedAppId } from "../app/TrackedAppId";

/**
 * Outbound port — delivers a notification to the user.
 * The infrastructure adapter decides the mechanism (OS notification,
 * in-app store update, etc.).
 */
export interface NotificationPort {
  notifyUpdateAvailable(
    appId: TrackedAppId,
    appName: string,
    latestVersion: string,
  ): Promise<void>;
}
