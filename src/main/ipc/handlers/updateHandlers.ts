import { ipcMain, BrowserWindow } from "electron";
import { IpcChannels } from "../channels";
import { CheckOnePayloadSchema } from "../schemas/ipcSchemas";
import type { CheckForUpdates } from "../../application/CheckForUpdates";

interface UpdateHandlerDeps {
  checkForUpdates: CheckForUpdates;
}

/**
 * Registers IPC handlers for release-checking operations.
 * Push events (updates:available) are broadcast to all renderer windows.
 */
export function registerUpdateHandlers(deps: UpdateHandlerDeps): void {
  // -------------------------------------------------------------------------
  // updates:checkAll — checks every tracked app
  // -------------------------------------------------------------------------
  ipcMain.handle(IpcChannels.UPDATES_CHECK_ALL, async () => {
    const output = await deps.checkForUpdates.execute({});
    broadcastUpdateResults(output.results);
    return output;
  });

  // -------------------------------------------------------------------------
  // updates:checkOne — checks a single app by ID
  // -------------------------------------------------------------------------
  ipcMain.handle(
    IpcChannels.UPDATES_CHECK_ONE,
    async (_event, raw: unknown) => {
      const result = CheckOnePayloadSchema.safeParse(raw);

      if (!result.success) {
        throw new Error(result.error.issues.map((i) => i.message).join(", "));
      }

      const output = await deps.checkForUpdates.execute({
        appId: result.data.appId,
      });
      broadcastUpdateResults(output.results);
      return output;
    },
  );
}

/**
 * Broadcasts results that have an update available to all open renderer windows.
 * The renderer subscribes via window.api.on(IpcChannels.UPDATES_AVAILABLE, ...).
 */
function broadcastUpdateResults(
  results: Array<{
    id: string;
    name: string;
    updateAvailable: boolean;
    latestVersion: string;
  }>,
): void {
  const updatesFound = results.filter((r) => r.updateAvailable);

  if (updatesFound.length === 0) {
    return;
  }

  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send(IpcChannels.UPDATES_AVAILABLE, updatesFound);
    }
  }
}
