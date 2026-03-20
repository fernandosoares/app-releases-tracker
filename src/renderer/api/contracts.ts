export interface TrackedAppDto {
  id: string;
  name: string;
  sourceUrl: string;
  currentVersion: string | null;
  latestVersion: string | null;
  lastCheckedAt: string | null;
  hasUpdateAvailable: boolean;
}

export interface AddAppPayload {
  name: string;
  sourceUrl: string;
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
