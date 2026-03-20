import { describe, expect, it } from "vitest";
import { TrackedApp } from "@main/domain/app/TrackedApp";
import { TrackedAppId } from "@main/domain/app/TrackedAppId";
import { Version } from "@main/domain/release/Version";

describe("TrackedApp", () => {
  it("creates a valid tracked app", () => {
    const app = TrackedApp.create({
      id: TrackedAppId.create("app-1"),
      name: "Example App",
      sourceUrl: "https://github.com/example/app",
    });

    expect(app.id.toString()).toBe("app-1");
    expect(app.name).toBe("Example App");
    expect(app.sourceUrl).toBe("https://github.com/example/app");
    expect(app.hasUpdateAvailable()).toBe(false);
  });

  it("detects update when latest version is newer", () => {
    const app = TrackedApp.create({
      id: TrackedAppId.create("app-2"),
      name: "Updater",
      sourceUrl: "https://gitlab.com/example/updater",
      currentVersion: Version.parse("1.0.0"),
    });

    app.markChecked(Version.parse("1.1.0"), new Date("2026-03-20T12:00:00Z"));

    expect(app.hasUpdateAvailable()).toBe(true);
  });

  it("does not report update when current and latest match", () => {
    const app = TrackedApp.create({
      id: TrackedAppId.create("app-3"),
      name: "No Update",
      sourceUrl: "https://github.com/example/no-update",
      currentVersion: Version.parse("2.0.0"),
    });

    app.markChecked(Version.parse("2.0.0"), new Date("2026-03-20T12:00:00Z"));

    expect(app.hasUpdateAvailable()).toBe(false);
  });

  it("advances current version and keeps latest coherent", () => {
    const app = TrackedApp.create({
      id: TrackedAppId.create("app-4"),
      name: "Coherent",
      sourceUrl: "https://github.com/example/coherent",
      currentVersion: Version.parse("1.0.0"),
    });

    app.markChecked(Version.parse("1.1.0"), new Date("2026-03-20T12:00:00Z"));
    app.setCurrentVersion(Version.parse("1.2.0"));

    expect(app.current?.toString()).toBe("1.2.0");
    expect(app.latest?.toString()).toBe("1.2.0");
    expect(app.hasUpdateAvailable()).toBe(false);
  });
});
