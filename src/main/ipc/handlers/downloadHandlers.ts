import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { BrowserWindow, dialog, ipcMain, shell } from "electron";
import { TrackedAppId } from "../../domain/app/TrackedAppId";
import type { TrackedAppRepository } from "../../domain/ports/TrackedAppRepository";
import { IpcChannels } from "../channels";
import { DownloadStartPayloadSchema } from "../schemas/ipcSchemas";

interface DownloadHandlerDeps {
  repository: TrackedAppRepository;
}

interface ReleaseAsset {
  name: string;
  url: string;
}

interface ReleaseOption {
  tag: string;
  title: string;
  assets: ReleaseAsset[];
}

export function registerDownloadHandlers(deps: DownloadHandlerDeps): void {
  ipcMain.handle(IpcChannels.DOWNLOAD_START, async (event, raw: unknown) => {
    const payload = DownloadStartPayloadSchema.safeParse(raw);

    if (!payload.success) {
      throw new Error(payload.error.issues.map((i) => i.message).join(", "));
    }

    const app = await deps.repository.findById(
      TrackedAppId.create(payload.data.appId),
    );

    if (!app) {
      throw new Error(`TrackedApp not found: ${payload.data.appId}`);
    }

    const parent = BrowserWindow.fromWebContents(event.sender) ?? undefined;
    const releases = await fetchReleaseOptions(app.sourceUrl);

    if (releases.length === 0) {
      throw new Error("No downloadable releases found for this app");
    }

    const release = await pickRelease(parent, app.name, releases);
    if (!release) {
      return { cancelled: true };
    }

    const asset = await pickAsset(parent, release);
    if (!asset) {
      return { cancelled: true };
    }

    const save = await dialog.showSaveDialog(parent, {
      title: `Save ${asset.name}`,
      defaultPath: asset.name,
      buttonLabel: "Download",
    });

    if (save.canceled || !save.filePath) {
      return { cancelled: true };
    }

    await downloadToFile(asset.url, save.filePath);

    const openChoice = await dialog.showMessageBox(parent, {
      type: "question",
      title: "Download complete",
      message: `${asset.name} was downloaded successfully.`,
      buttons: ["Open file", "Open folder", "Close"],
      defaultId: 0,
      cancelId: 2,
    });

    if (openChoice.response === 0) {
      await shell.openPath(save.filePath);
    } else if (openChoice.response === 1) {
      shell.showItemInFolder(save.filePath);
    }

    return {
      cancelled: false,
      filePath: save.filePath,
      assetName: asset.name,
      releaseTag: release.tag,
    };
  });
}

async function pickRelease(
  parent: BrowserWindow | undefined,
  appName: string,
  releases: ReleaseOption[],
): Promise<ReleaseOption | null> {
  const options = releases.slice(0, 8);
  const result = await dialog.showMessageBox(parent, {
    type: "question",
    title: "Choose release",
    message: `Select a release to download for ${appName}:`,
    buttons: [...options.map((r) => r.title), "Cancel"],
    cancelId: options.length,
    defaultId: 0,
  });

  if (result.response === options.length) {
    return null;
  }

  return options[result.response] ?? null;
}

async function pickAsset(
  parent: BrowserWindow | undefined,
  release: ReleaseOption,
): Promise<ReleaseAsset | null> {
  const assets = release.assets.slice(0, 10);
  const result = await dialog.showMessageBox(parent, {
    type: "question",
    title: "Choose asset",
    message: `Select an installer/package for ${release.tag}:`,
    buttons: [...assets.map((a) => a.name), "Cancel"],
    cancelId: assets.length,
    defaultId: 0,
  });

  if (result.response === assets.length) {
    return null;
  }

  return assets[result.response] ?? null;
}

async function downloadToFile(url: string, filePath: string): Promise<void> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "app-releases-tracker",
      Accept: "application/octet-stream",
    },
    redirect: "follow",
  });

  if (!response.ok || !response.body) {
    throw new Error(
      `Download failed: ${response.status} ${response.statusText}`,
    );
  }

  await pipeline(
    Readable.fromWeb(response.body as never),
    createWriteStream(filePath),
  );
}

async function fetchReleaseOptions(
  sourceUrl: string,
): Promise<ReleaseOption[]> {
  const url = new URL(sourceUrl);

  if (url.hostname === "github.com") {
    return fetchGitHubReleases(url);
  }

  if (url.hostname.includes("gitlab") || sourceUrl.includes("/-/")) {
    return fetchGitLabReleases(url);
  }

  return fetchGiteaReleases(url);
}

async function fetchGitHubReleases(url: URL): Promise<ReleaseOption[]> {
  const [owner, repoRaw] = url.pathname.replace(/^\//, "").split("/");
  const repo = (repoRaw ?? "").replace(/\.git$/, "");

  if (!owner || !repo) {
    throw new Error("Invalid GitHub repository URL");
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/releases?per_page=20`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "app-releases-tracker",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`GitHub releases API error: ${response.status}`);
  }

  const releases = (await response.json()) as Array<{
    tag_name: string;
    name?: string;
    draft: boolean;
    assets: Array<{ name: string; browser_download_url: string }>;
  }>;

  return releases
    .filter((r) => !r.draft && r.assets.length > 0)
    .map((r) => ({
      tag: r.tag_name,
      title: r.name?.trim() ? `${r.tag_name} - ${r.name}` : r.tag_name,
      assets: r.assets.map((a) => ({
        name: a.name,
        url: a.browser_download_url,
      })),
    }));
}

async function fetchGitLabReleases(url: URL): Promise<ReleaseOption[]> {
  const projectPath = encodeURIComponent(
    url.pathname.replace(/^\//, "").split("/-/")[0] ?? "",
  );

  if (!projectPath) {
    throw new Error("Invalid GitLab project URL");
  }

  const response = await fetch(
    `${url.origin}/api/v4/projects/${projectPath}/releases?per_page=20`,
    {
      headers: {
        Accept: "application/json",
        "User-Agent": "app-releases-tracker",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`GitLab releases API error: ${response.status}`);
  }

  const releases = (await response.json()) as Array<{
    tag_name: string;
    name?: string;
    assets?: {
      links?: Array<{ name: string; url: string }>;
      sources?: Array<{ format: string; url: string }>;
    };
  }>;

  return releases
    .map((r) => {
      const linkAssets = (r.assets?.links ?? []).map((a) => ({
        name: a.name,
        url: a.url,
      }));
      const sourceAssets = (r.assets?.sources ?? []).map((s) => ({
        name: `${r.tag_name}.${s.format}`,
        url: s.url,
      }));
      const assets = [...linkAssets, ...sourceAssets];

      return {
        tag: r.tag_name,
        title: r.name?.trim() ? `${r.tag_name} - ${r.name}` : r.tag_name,
        assets,
      };
    })
    .filter((r) => r.assets.length > 0);
}

async function fetchGiteaReleases(url: URL): Promise<ReleaseOption[]> {
  const [owner, repoRaw] = url.pathname.replace(/^\//, "").split("/");
  const repo = (repoRaw ?? "").replace(/\.git$/, "");

  if (!owner || !repo) {
    throw new Error("Invalid Gitea repository URL");
  }

  const response = await fetch(
    `${url.origin}/api/v1/repos/${owner}/${repo}/releases?limit=20`,
    {
      headers: {
        Accept: "application/json",
        "User-Agent": "app-releases-tracker",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Gitea releases API error: ${response.status}`);
  }

  const releases = (await response.json()) as Array<{
    tag_name: string;
    name?: string;
    assets: Array<{ name: string; browser_download_url: string }>;
  }>;

  return releases
    .filter((r) => r.assets.length > 0)
    .map((r) => ({
      tag: r.tag_name,
      title: r.name?.trim() ? `${r.tag_name} - ${r.name}` : r.tag_name,
      assets: r.assets.map((a) => ({
        name: a.name,
        url: a.browser_download_url,
      })),
    }));
}
