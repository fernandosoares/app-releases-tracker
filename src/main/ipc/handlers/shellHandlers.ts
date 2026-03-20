import { ipcMain, shell } from "electron";
import { IpcChannels } from "../channels";
import { OpenExternalPayloadSchema } from "../schemas/ipcSchemas";

/**
 * Registers shell-related IPC handlers.
 * Renderer requests are validated and limited to HTTPS URLs.
 */
export function registerShellHandlers(): void {
  ipcMain.handle(
    IpcChannels.SHELL_OPEN_EXTERNAL,
    async (_event, raw: unknown) => {
      const result = OpenExternalPayloadSchema.safeParse(raw);

      if (!result.success) {
        throw new Error(result.error.issues.map((i) => i.message).join(", "));
      }

      await shell.openExternal(result.data.url);
    },
  );
}
