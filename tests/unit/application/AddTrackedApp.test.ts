import { beforeEach, describe, expect, it } from "vitest";
import { AddTrackedApp } from "@main/application/AddTrackedApp";
import { TrackedApp } from "@main/domain/app/TrackedApp";
import { TrackedAppId } from "@main/domain/app/TrackedAppId";
import type { TrackedAppRepository } from "@main/domain/ports/TrackedAppRepository";

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

  size(): number {
    return this.items.size;
  }
}

describe("AddTrackedApp", () => {
  let repository: InMemoryRepository;
  let useCase: AddTrackedApp;

  beforeEach(() => {
    repository = new InMemoryRepository();
    useCase = new AddTrackedApp(repository);
  });

  it("persists a new app and returns its ID and details", async () => {
    const output = await useCase.execute({
      name: "My App",
      sourceUrl: "https://github.com/example/my-app",
    });

    expect(output.id).toBeDefined();
    expect(output.name).toBe("My App");
    expect(output.sourceUrl).toBe("https://github.com/example/my-app");
    expect(repository.size()).toBe(1);
  });

  it("rejects apps with an empty name", async () => {
    await expect(
      useCase.execute({
        name: "  ",
        sourceUrl: "https://github.com/example/app",
      }),
    ).rejects.toThrow("Tracked app name cannot be empty");
  });

  it("rejects apps with a non-HTTP URL", async () => {
    await expect(
      useCase.execute({
        name: "Bad URL App",
        sourceUrl: "ftp://example.com/app",
      }),
    ).rejects.toThrow("sourceUrl must be an absolute HTTP(S) URL");
  });

  it("assigns a unique ID to each app", async () => {
    const a = await useCase.execute({
      name: "App A",
      sourceUrl: "https://github.com/a/a",
    });
    const b = await useCase.execute({
      name: "App B",
      sourceUrl: "https://github.com/b/b",
    });

    expect(a.id).not.toBe(b.id);
    expect(repository.size()).toBe(2);
  });
});
