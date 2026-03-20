import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAppsStore } from "@renderer/store/appsStore";

vi.mock("@renderer/api/bridge", () => ({
  bridge: {
    getAllApps: vi.fn(),
    addApp: vi.fn(),
    removeApp: vi.fn(),
    checkAllUpdates: vi.fn(),
    checkOneUpdate: vi.fn(),
  },
}));

import { bridge } from "@renderer/api/bridge";

const mockedBridge = vi.mocked(bridge);

describe("appsStore", () => {
  beforeEach(() => {
    useAppsStore.setState({
      apps: [],
      loading: false,
      checkingIds: new Set(),
      error: null,
    });
    vi.clearAllMocks();
  });

  it("loads apps and updates state", async () => {
    mockedBridge.getAllApps.mockResolvedValue([
      {
        id: "1",
        name: "App",
        sourceUrl: "https://github.com/org/repo",
        currentVersion: "1.0.0",
        latestVersion: "1.1.0",
        lastCheckedAt: null,
        hasUpdateAvailable: true,
      },
    ]);

    await useAppsStore.getState().loadApps();

    expect(useAppsStore.getState().apps).toHaveLength(1);
    expect(useAppsStore.getState().apps[0]?.name).toBe("App");
    expect(useAppsStore.getState().loading).toBe(false);
  });

  it("marks updates via applyUpdates", () => {
    useAppsStore.setState({
      apps: [
        {
          id: "1",
          name: "App",
          sourceUrl: "https://github.com/org/repo",
          currentVersion: "1.0.0",
          latestVersion: null,
          lastCheckedAt: null,
          hasUpdateAvailable: false,
        },
      ],
    });

    useAppsStore.getState().applyUpdates([
      { id: "1", latestVersion: "1.2.0" },
    ]);

    const app = useAppsStore.getState().apps[0];
    expect(app?.latestVersion).toBe("1.2.0");
    expect(app?.hasUpdateAvailable).toBe(true);
  });
});
