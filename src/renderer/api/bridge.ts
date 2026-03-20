import type {
  AddAppPayload,
  CheckForUpdatesOutput,
  DownloadStartOutput,
  TrackedAppDto,
} from "./contracts";

const IpcChannels = {
  APPS_GET_ALL: "apps:getAll",
  APPS_ADD: "apps:add",
  APPS_REMOVE: "apps:remove",
  SHELL_OPEN_EXTERNAL: "shell:openExternal",
  DOWNLOAD_START: "download:start",
  UPDATES_CHECK_ALL: "updates:checkAll",
  UPDATES_CHECK_ONE: "updates:checkOne",
  UPDATES_AVAILABLE: "updates:available",
} as const;

/**
 * Typed bridge wrapping window.api for use in React components.
 *
 * All IPC calls go through here — no component ever calls window.api directly.
 * This is the only file in renderer/ that references IPC channel names.
 */
export const bridge = {
  // ---------------------------------------------------------------------------
  // App management
  // ---------------------------------------------------------------------------
  getAllApps(): Promise<TrackedAppDto[]> {
    return window.api.invoke(IpcChannels.APPS_GET_ALL) as Promise<
      TrackedAppDto[]
    >;
  },

  addApp(
    payload: AddAppPayload,
  ): Promise<{ id: string; name: string; sourceUrl: string }> {
    return window.api.invoke(IpcChannels.APPS_ADD, payload) as Promise<{
      id: string;
      name: string;
      sourceUrl: string;
    }>;
  },

  removeApp(id: string): Promise<void> {
    return window.api.invoke(IpcChannels.APPS_REMOVE, { id }) as Promise<void>;
  },

  openExternal(url: string): Promise<void> {
    return window.api.invoke(IpcChannels.SHELL_OPEN_EXTERNAL, {
      url,
    }) as Promise<void>;
  },

  downloadUpdate(appId: string): Promise<DownloadStartOutput> {
    return window.api.invoke(IpcChannels.DOWNLOAD_START, {
      appId,
    }) as Promise<DownloadStartOutput>;
  },

  // ---------------------------------------------------------------------------
  // Update checking
  // ---------------------------------------------------------------------------
  checkAllUpdates(): Promise<CheckForUpdatesOutput> {
    return window.api.invoke(
      IpcChannels.UPDATES_CHECK_ALL,
    ) as Promise<CheckForUpdatesOutput>;
  },

  checkOneUpdate(appId: string): Promise<CheckForUpdatesOutput> {
    return window.api.invoke(IpcChannels.UPDATES_CHECK_ONE, {
      appId,
    }) as Promise<CheckForUpdatesOutput>;
  },

  // ---------------------------------------------------------------------------
  // Push events
  // ---------------------------------------------------------------------------
  onUpdatesAvailable(
    callback: (
      updates: Array<{ id: string; name: string; latestVersion: string }>,
    ) => void,
  ): void {
    window.api.on(
      IpcChannels.UPDATES_AVAILABLE,
      callback as (...args: unknown[]) => void,
    );
  },

  offUpdatesAvailable(
    callback: (
      updates: Array<{ id: string; name: string; latestVersion: string }>,
    ) => void,
  ): void {
    window.api.off(
      IpcChannels.UPDATES_AVAILABLE,
      callback as (...args: unknown[]) => void,
    );
  },
};
