import { describe, expect, it } from "vitest";
import { TrackedApp } from "@main/domain/app/TrackedApp";
import { TrackedAppId } from "@main/domain/app/TrackedAppId";
import type { TrackedAppRepository } from "@main/domain/ports/TrackedAppRepository";

class InMemoryTrackedAppRepository implements TrackedAppRepository {
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

describe("TrackedAppRepository port contract", () => {
  it("supports save, lookup, list, and remove semantics", async () => {
    const repository: TrackedAppRepository = new InMemoryTrackedAppRepository();
    const id = TrackedAppId.create("repo-app-1");
    const app = TrackedApp.create({
      id,
      name: "Repo App",
      sourceUrl: "https://github.com/example/repo-app",
    });

    await repository.save(app);

    const fetched = await repository.findById(id);
    const listed = await repository.listAll();

    expect(fetched?.id.toString()).toBe("repo-app-1");
    expect(listed).toHaveLength(1);

    await repository.remove(id);

    expect(await repository.findById(id)).toBeNull();
  });
});
