---
description: "Use when writing Electron main process config, BrowserWindow creation, preload scripts, IPC handlers, or any code that touches Electron security settings. Enforces context isolation, nodeIntegration rules, and safe IPC patterns."
applyTo: "**/*.ts"
---

# Electron Security Guidelines

## BrowserWindow — Required Settings

Every `BrowserWindow` MUST be created with these `webPreferences`:

```typescript
new BrowserWindow({
  webPreferences: {
    contextIsolation: true, // REQUIRED — never disable
    nodeIntegration: false, // REQUIRED — never enable
    sandbox: true, // REQUIRED — enables Chromium sandbox
    preload: path.join(__dirname, "preload.js"), // only safe bridge
  },
});
```

- DO NOT set `contextIsolation: false`
- DO NOT set `nodeIntegration: true`
- DO NOT use `enableRemoteModule: true` — the `remote` module is deprecated and dangerous
- DO NOT use `webSecurity: false`

## Preload Scripts

Preload scripts are the ONLY bridge between Main and Renderer.

- Expose ONLY named, typed functions via `contextBridge.exposeInMainWorld`
- NEVER expose the full `ipcRenderer` object
- NEVER expose `require`, `process`, or any Node.js global

```typescript
// preload.ts — correct pattern
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  checkForUpdates: (appId: string) =>
    ipcRenderer.invoke("updates:check", appId),
  onUpdateAvailable: (cb: (payload: UpdatePayload) => void) =>
    ipcRenderer.on("updates:available", (_e, payload) => cb(payload)),
});
```

## IPC Channels

- Use `ipcMain.handle` (async) and `ipcRenderer.invoke` for request/response
- Use `ipcMain.on` / `webContents.send` for events (one-way)
- ALWAYS validate incoming IPC arguments with `zod` before processing
- NEVER trust renderer-side data — treat it as untrusted user input
- Use a typed channel registry (enum or const map) — no raw string literals

```typescript
// channels.ts — channel registry
export const IpcChannels = {
  UPDATES_CHECK: "updates:check",
  UPDATES_AVAILABLE: "updates:available",
  DOWNLOAD_START: "download:start",
} as const;
```

## External Content

- DO NOT use `shell.openExternal` with untrusted URLs without validation
- Whitelist allowed protocols (`https:` only, no `file:` from renderer)
- Never load remote scripts inside `BrowserWindow` (`allowRunningInsecureContent: false`)

## Content Security Policy

Add a CSP meta tag or HTTP header for the renderer:

```
Content-Security-Policy: default-src 'self'; script-src 'self'; connect-src https:
```

## General Rules

- `any` type is forbidden — use strict TypeScript throughout
- All IPC payloads must have a corresponding `zod` schema
- Validate all file paths before file system operations (prevent path traversal)
- Never embed secrets or API tokens in renderer-accessible code
