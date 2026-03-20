import { beforeEach, describe, expect, it, vi } from "vitest";
import { CheckForUpdates } from "@main/application/CheckForUpdates";
import { AddTrackedApp } from "@main/application/AddTrackedApp";
import { TrackedApp } from "@main/domain/app/TrackedApp";
import { TrackedAppId } from "@main/domain/app/TrackedAppId";
import { Version } from "@main/domain/release/Version";
import type { TrackedAppRepository } from "@main/domain/ports/TrackedAppRepository";
import type { ReleaseSourcePort } from "@main/domain/ports/ReleaseSourcePort";
import type { NotificationPort } from "@main/domain/ports/NotificationPort";

// ---------------------------------------------------------------------------
// Test doubles
// ---------------------------------------------------------------------------

class InMemoryRepository implements TrackedAppRepository {
  private readonly items = new Map<string, TrackedApp>();

  async save(app: TrackedApp): Promise<void> {
    this.items.set(app.id.toString(), app);
  }

  async findById(id: TrackedAppId): Promise<TrackedApp | null> {
    return this.items.get(id.toString()) ?? null;
  }

  async listAll(): Promise<TrackedApp[]> {
    return [...this.items.values()];
  }

  async remove(id: TrackedAppId): Promise<void> {
    this.items.delete(id.toString());
  }
}

function makeSource(latestVersion: string): ReleaseSourcePort {
  return {
    supports: () => true,
    fetchLatestVersion: async () => Version.parse(latestVersion),
  };
}

function makeNotifications(): NotificationPort & {
  calls: Array<{ appName: string; version: string }>;
} {
  const calls: Array<{ appName: string; version: string }> = [];
  return {
    calls,
    notifyUpdateAvailable: vi.fn(async (_id, appName, version) => {
      calls.push({ appName, version });
    }),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CheckForUpdates", () => {
  let repository: InMemoryRepository;
  let addUseCase: AddTrackedApp;
  let notifications: ReturnType<typeof makeNotifications>;

  beforeEach(() => {
    repository = new InMemoryRepository();
    addUseCase = new AddTrackedApp(repository);
    notifications = makeNotifications();
  });

  it("reports no update when current equals latest", async () => {
    const { id } = await addUseCase.execute({
      name: "Stable App",
      sourceUrl: "https://github.com/example/stable",
    });

    // Set current version via repository after add
    const app = await repository.findById(TrackedAppId.create(id));
    app!.setCurrentVersion(Version.parse("2.0.0"));
    await repository.save(app!);

    const useCase = new CheckForUpdates(
      repository,
      makeSource("2.0.0"),
      notifications,
    );
    const { results } = await useCase.execute({});

    expect(results[0].updateAvailable).toBe(false);
    expect(notifications.calls).toHaveLength(0);
  });

  it("detects update and fires notification when newer version found", async () => {
    const { id } = await addUseCase.execute({
      name: "Outdated App",
      sourceUrl: "https://github.com/example/outdated",
    });

    const app = await repository.findById(TrackedAppId.create(id));
    app!.setCurrentVersion(Version.parse("1.0.0"));
    await repository.save(app!);

    const useCase = new CheckForUpdates(
      repository,
      makeSource("1.1.0"),
      notifications,
    );
    const { results } = await useCase.execute({});

    expect(results[0].updateAvailable).toBe(true);
    expect(results[0].latestVersion).toBe("1.1.0");
    expect(notifications.calls).toHaveLength(1);
    expect(notifications.calls[0]).toEqual({
      appName: "Outdated App",
      version: "1.1.0",
    });
  });

  it("checks only the specified app when appId is provided", async () => {
    const { id: idA } = await addUseCase.execute({
      name: "App A",
      sourceUrl: "https://github.com/example/a",
    });
    await addUseCase.execute({
      name: "App B",
      sourceUrl: "https://github.com/example/b",
    });

    const useCase = new CheckForUpdates(
      repository,
      makeSource("1.0.0"),
      notifications,
    );
    const { results } = await useCase.execute({ appId: idA });

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(idA);
  });

  it("isolates per-app failures and continues checking remaining apps", async () => {
    await addUseCase.execute({
      name: "Breaking App",
      sourceUrl: "https://github.com/example/breaking",
    });
    await addUseCase.execute({
      name: "Healthy App",
      sourceUrl: "https://github.com/example/healthy",
    });

    // First call raises, second returns a valid version
    let call = 0;
    const mixedSource: ReleaseSourcePort = {
      supports: () => true,
      fetchLatestVersion: async () => {
        call += 1;
        if (call === 1) throw new Error("Rate limited");
        return Version.parse("2.5.0");
      },
    };

    const useCase = new CheckForUpdates(repository, mixedSource, notifications);
    const { results } = await useCase.execute({});

    expect(results).toHaveLength(2);
    const failing = results.find((r) => r.error !== undefined);
    const passing = results.find((r) => r.error === undefined);

    expect(failing?.error).toBe("Rate limited");
    expect(passing?.latestVersion).toBe("2.5.0");
  });

  it("throws when checking a non-existent app by ID", async () => {
    const useCase = new CheckForUpdates(
      repository,
      makeSource("1.0.0"),
      notifications,
    );

    await expect(useCase.execute({ appId: "ghost-id" })).rejects.toThrow(
      "TrackedApp not found: ghost-id",
    );
  });
});
