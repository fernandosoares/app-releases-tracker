import { IpcChannels } from "../../main/ipc/channels";
import type { TrackedAppDto } from "../../main/ipc/dto/TrackedAppDto";
import type { AddAppPayload } from "../../main/ipc/schemas/ipcSchemas";
import type { CheckForUpdatesOutput } from "../../main/application/CheckForUpdates";

/**
 * Typed bridge wrapping window.api for use in React components.
 *
 * All IPC calls go through here — no component ever calls window.api directly.
 * This is the only file in renderer/ that is allowed to reference IPC channel
 * names or Main-side DTO types.
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
