import {
  app,
  BrowserWindow,
  Menu,
  type MenuItemConstructorOptions,
  dialog,
  shell,
} from "electron";
import { join } from "path";
import { Version } from "./domain/release/Version";
import { SqliteTrackedAppRepository } from "./infrastructure/persistence/SqliteTrackedAppRepository";
import { GiteaReleaseSource } from "./infrastructure/sources/GiteaReleaseSource";
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
let mainWindow: BrowserWindow | null = null;

function isSelfTrackerSourceUrl(sourceUrl: string): boolean {
  try {
    const url = new URL(sourceUrl);
    if (url.hostname !== "github.com") return false;

    const [owner, repoRaw] = url.pathname.replace(/^\//, "").split("/");
    const repo = (repoRaw ?? "").replace(/\.git$/, "").toLowerCase();

    return (
      owner?.toLowerCase() === "fernandosoares" &&
      repo === "app-releases-tracker"
    );
  } catch {
    return false;
  }
}

async function syncSelfTrackedCurrentVersion(
  repository: SqliteTrackedAppRepository,
): Promise<void> {
  const runningVersion = Version.parse(app.getVersion());
  const apps = await repository.listAll();

  for (const tracked of apps) {
    if (!isSelfTrackerSourceUrl(tracked.sourceUrl)) {
      continue;
    }

    if (
      !tracked.current ||
      tracked.current.toString() !== runningVersion.toString()
    ) {
      tracked.setCurrentVersion(runningVersion);
      await repository.save(tracked);
    }
  }
}

async function bootstrap(): Promise<void> {
  const dbPath = join(app.getPath("userData"), "tracker.db");

  // Infrastructure
  const repository = new SqliteTrackedAppRepository(dbPath);
  const factory = new ReleaseSourceFactory([
    new GitHubReleaseSource({ token: process.env["GITHUB_TOKEN"] }),
    new GitLabReleaseSource({ token: process.env["GITLAB_TOKEN"] }),
    new GiteaReleaseSource({ token: process.env["GITEA_TOKEN"] }),
  ]);
  const routingSource = new RoutingReleaseSource(factory);
  const notifications = new ElectronNotificationAdapter();

  // Use cases
  const addTrackedApp = new AddTrackedApp(
    repository,
    (sourceUrl: string): string | undefined => {
      return isSelfTrackerSourceUrl(sourceUrl) ? app.getVersion() : undefined;
    },
  );
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

  await syncSelfTrackedCurrentVersion(repository);

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

  mainWindow = win;
}

function createAppMenu(): void {
  const template: MenuItemConstructorOptions[] = [
    {
      label: "File",
      submenu: [{ role: "quit" }],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "Show Version",
          click: () => {
            void (mainWindow
              ? dialog.showMessageBox(mainWindow, {
                  type: "info",
                  title: "App Version",
                  message: `App Releases Tracker v${app.getVersion()}`,
                  detail: `Platform: ${process.platform}`,
                })
              : dialog.showMessageBox({
                  type: "info",
                  title: "App Version",
                  message: `App Releases Tracker v${app.getVersion()}`,
                  detail: `Platform: ${process.platform}`,
                }));
          },
        },
        {
          label: "Check for Updates",
          click: () => {
            void checkSelfUpdate();
          },
        },
        {
          label: "Open Releases Page",
          click: () => {
            void shell.openExternal(
              "https://github.com/fernandosoares/app-releases-tracker/releases/latest",
            );
          },
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function checkSelfUpdate(): Promise<void> {
  try {
    const response = await fetch(
      "https://api.github.com/repos/fernandosoares/app-releases-tracker/releases/latest",
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "app-releases-tracker",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Update check failed: ${response.status}`);
    }

    const data = (await response.json()) as {
      tag_name: string;
      html_url?: string;
    };

    const current = Version.parse(app.getVersion());
    const latest = Version.parse(data.tag_name);

    if (latest.isGreaterThan(current)) {
      const result = await (mainWindow
        ? dialog.showMessageBox(mainWindow, {
            type: "info",
            title: "Update available",
            message: `A newer version is available: v${latest.toString()}`,
            detail: `You are running v${current.toString()}.`,
            buttons: ["Open Releases", "Close"],
            defaultId: 0,
            cancelId: 1,
          })
        : dialog.showMessageBox({
            type: "info",
            title: "Update available",
            message: `A newer version is available: v${latest.toString()}`,
            detail: `You are running v${current.toString()}.`,
            buttons: ["Open Releases", "Close"],
            defaultId: 0,
            cancelId: 1,
          }));

      if (result.response === 0) {
        await shell.openExternal(
          data.html_url ??
            "https://github.com/fernandosoares/app-releases-tracker/releases/latest",
        );
      }

      return;
    }

    await (mainWindow
      ? dialog.showMessageBox(mainWindow, {
          type: "info",
          title: "Up to date",
          message: `You are on the latest version (v${current.toString()}).`,
        })
      : dialog.showMessageBox({
          type: "info",
          title: "Up to date",
          message: `You are on the latest version (v${current.toString()}).`,
        }));
  } catch (error) {
    await (mainWindow
      ? dialog.showMessageBox(mainWindow, {
          type: "error",
          title: "Update check failed",
          message: error instanceof Error ? error.message : String(error),
        })
      : dialog.showMessageBox({
          type: "error",
          title: "Update check failed",
          message: error instanceof Error ? error.message : String(error),
        }));
  }
}

app.whenReady().then(async () => {
  await bootstrap();
  createAppMenu();
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
