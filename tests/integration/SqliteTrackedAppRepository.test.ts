import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { existsSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { SqliteTrackedAppRepository } from "@main/infrastructure/persistence/SqliteTrackedAppRepository";
import { TrackedApp } from "@main/domain/app/TrackedApp";
import { TrackedAppId } from "@main/domain/app/TrackedAppId";
import { Version } from "@main/domain/release/Version";

describe("SqliteTrackedAppRepository", () => {
  const dbPath = join(tmpdir(), `test-tracker-${Date.now()}.db`);
  let repository: SqliteTrackedAppRepository;

  beforeEach(() => {
    repository = new SqliteTrackedAppRepository(dbPath);
  });

  afterEach(() => {
    repository.close();
    if (existsSync(dbPath)) rmSync(dbPath);
  });

  it("saves and retrieves an app by ID", async () => {
    const id = TrackedAppId.create("sqlite-test-1");
    const app = TrackedApp.create({
      id,
      name: "SQLite Test App",
      sourceUrl: "https://github.com/example/sqlite-test",
    });

    await repository.save(app);
    const fetched = await repository.findById(id);

    expect(fetched).not.toBeNull();
    expect(fetched!.id.toString()).toBe("sqlite-test-1");
    expect(fetched!.name).toBe("SQLite Test App");
    expect(fetched!.current).toBeUndefined();
  });

  it("persists current and latest versions across save/load cycles", async () => {
    const id = TrackedAppId.create("sqlite-test-2");
    const app = TrackedApp.create({
      id,
      name: "Versioned App",
      sourceUrl: "https://github.com/example/versioned",
      currentVersion: Version.parse("1.0.0"),
    });
    app.markChecked(Version.parse("1.2.0"), new Date("2026-03-20T10:00:00Z"));

    await repository.save(app);
    const fetched = await repository.findById(id);

    expect(fetched!.current?.toString()).toBe("1.0.0");
    expect(fetched!.latest?.toString()).toBe("1.2.0");
    expect(fetched!.hasUpdateAvailable()).toBe(true);
  });

  it("updates an existing record on second save (upsert)", async () => {
    const id = TrackedAppId.create("sqlite-test-3");
    const app = TrackedApp.create({
      id,
      name: "Upsert App",
      sourceUrl: "https://github.com/example/upsert",
      currentVersion: Version.parse("1.0.0"),
    });

    await repository.save(app);
    app.markChecked(Version.parse("2.0.0"), new Date());
    await repository.save(app);

    const fetched = await repository.findById(id);
    expect(fetched!.latest?.toString()).toBe("2.0.0");
  });

  it("lists all apps ordered by name", async () => {
    await repository.save(
      TrackedApp.create({
        id: TrackedAppId.create("z-app"),
        name: "Zebra App",
        sourceUrl: "https://github.com/example/zebra",
      }),
    );
    await repository.save(
      TrackedApp.create({
        id: TrackedAppId.create("a-app"),
        name: "Alpha App",
        sourceUrl: "https://github.com/example/alpha",
      }),
    );

    const all = await repository.listAll();

    expect(all).toHaveLength(2);
    expect(all[0].name).toBe("Alpha App");
    expect(all[1].name).toBe("Zebra App");
  });

  it("removes an app and returns null on subsequent lookup", async () => {
    const id = TrackedAppId.create("sqlite-test-rm");
    await repository.save(
      TrackedApp.create({
        id,
        name: "Removable",
        sourceUrl: "https://github.com/example/removable",
      }),
    );

    await repository.remove(id);

    expect(await repository.findById(id)).toBeNull();
  });

  it("returns null for a non-existent ID", async () => {
    const result = await repository.findById(TrackedAppId.create("ghost"));
    expect(result).toBeNull();
  });
});
