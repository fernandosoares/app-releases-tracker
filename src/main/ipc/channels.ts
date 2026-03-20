/**
 * Typed IPC channel registry.
 * All IPC communication MUST use these constants — no raw string literals.
 */
export const IpcChannels = {
  // App management
  APPS_GET_ALL: "apps:getAll",
  APPS_ADD: "apps:add",
  APPS_REMOVE: "apps:remove",

  // Shell
  SHELL_OPEN_EXTERNAL: "shell:openExternal",

  // Update checking
  UPDATES_CHECK_ALL: "updates:checkAll",
  UPDATES_CHECK_ONE: "updates:checkOne",
  UPDATES_AVAILABLE: "updates:available",

  // Downloads
  DOWNLOAD_START: "download:start",
  DOWNLOAD_PROGRESS: "download:progress",
  DOWNLOAD_COMPLETE: "download:complete",
} as const;

export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels];
