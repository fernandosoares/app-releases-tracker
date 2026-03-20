import { app, BrowserWindow, shell } from "electron";
import { join } from "path";
import { SqliteTrackedAppRepository } from "./infrastructure/persistence/SqliteTrackedAppRepository";
import { GitHubReleaseSource } from "./infrastructure/sources/GitHubReleaseSource";
import { GitLabReleaseSource } from "./infrastructure/sources/GitLabReleaseSource";
import { ReleaseSourceFactory } from "./infrastructure/sources/ReleaseSourceFactory";
import { RoutingReleaseSource } from "./infrastructure/sources/RoutingReleaseSource";
import { ElectronNotificationAdapter } from "./infrastructure/notification/ElectronNotificationAdapter";
import { AddTrackedApp } from "./application/AddTrackedApp";
import { RemoveTrackedApp } from "./application/RemoveTrackedApp";
import { CheckForUpdates } from "./application/CheckForUpdates";
import { registerAllHandlers } from "./ipc/handlers/registerAllHandlers";
import { PollingScheduler } from "./PollingScheduler";

// ---------------------------------------------------------------------------
// Composition root — wire infrastructure → application → IPC
// ---------------------------------------------------------------------------

let scheduler: PollingScheduler | null = null;

function bootstrap(): void {
  const dbPath = join(app.getPath("userData"), "tracker.db");

  // Infrastructure
  const repository = new SqliteTrackedAppRepository(dbPath);
  const factory = new ReleaseSourceFactory([
    new GitHubReleaseSource({ token: process.env["GITHUB_TOKEN"] }),
    new GitLabReleaseSource({ token: process.env["GITLAB_TOKEN"] }),
  ]);
  const routingSource = new RoutingReleaseSource(factory);
  const notifications = new ElectronNotificationAdapter();

  // Use cases
  const addTrackedApp = new AddTrackedApp(repository);
  const removeTrackedApp = new RemoveTrackedApp(repository);
  const checkForUpdates = new CheckForUpdates(
    repository,
    routingSource,
    notifications,
  );

  // IPC
  registerAllHandlers({
    repository,
    addTrackedApp,
    removeTrackedApp,
    checkForUpdates,
  });

  // Background polling (initial check + scheduled interval)
  scheduler = new PollingScheduler(checkForUpdates);
  scheduler.pollNow().catch((err: unknown) => {
    console.error("[bootstrap] initial poll error:", err);
  });
  scheduler.start();
}

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true, // Security: renderer cannot access Node.js
      nodeIntegration: false, // Security: no Node.js in renderer
      sandbox: false, // TODO ADR-001: enable once preload verified ESM-compatible
    },
  });

  // Only show window when fully loaded to avoid white flash
  win.on("ready-to-show", () => {
    win.show();
  });

  // Block new windows from renderer; open external links in OS browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  // Dev: load Vite dev server; Prod: load built static file
  if (process.env["ELECTRON_RENDERER_URL"]) {
    win.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    win.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(() => {
  bootstrap();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  scheduler?.stop();
  if (process.platform !== "darwin") {
    app.quit();
  }
});
