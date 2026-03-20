import { contextBridge, ipcRenderer } from "electron";
import type { IpcChannel } from "../main/ipc/channels";

/**
 * Minimal, typed IPC bridge exposed to the renderer via window.api.
 *
 * Rules:
 * - Only expose named, typed functions — never the raw ipcRenderer object.
 * - All arguments are treated as untrusted; validation happens in Main handlers.
 */
const api = {
  invoke: (channel: IpcChannel, ...args: unknown[]): Promise<unknown> =>
    ipcRenderer.invoke(channel, ...args),

  on: (channel: IpcChannel, callback: (...args: unknown[]) => void): void => {
    ipcRenderer.on(channel, (_event, ...eventArgs) => callback(...eventArgs));
  },

  off: (channel: IpcChannel, callback: (...args: unknown[]) => void): void => {
    ipcRenderer.removeListener(channel, (_event, ...eventArgs) =>
      callback(...eventArgs),
    );
  },
};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error("[preload] contextBridge.exposeInMainWorld failed:", error);
  }
}

export type API = typeof api;
