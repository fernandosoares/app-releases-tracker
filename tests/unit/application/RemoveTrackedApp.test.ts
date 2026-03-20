import { beforeEach, describe, expect, it } from "vitest";
import { AddTrackedApp } from "@main/application/AddTrackedApp";
import { RemoveTrackedApp } from "@main/application/RemoveTrackedApp";
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
}

describe("RemoveTrackedApp", () => {
  let repository: InMemoryRepository;
  let addUseCase: AddTrackedApp;
  let removeUseCase: RemoveTrackedApp;

  beforeEach(() => {
    repository = new InMemoryRepository();
    addUseCase = new AddTrackedApp(repository);
    removeUseCase = new RemoveTrackedApp(repository);
  });

  it("removes an existing app", async () => {
    const { id } = await addUseCase.execute({
      name: "Removable App",
      sourceUrl: "https://github.com/example/removable",
    });

    await removeUseCase.execute({ id });

    const fetched = await repository.findById(TrackedAppId.create(id));
    expect(fetched).toBeNull();
  });

  it("throws when the app does not exist", async () => {
    await expect(
      removeUseCase.execute({ id: "non-existent-id" }),
    ).rejects.toThrow("TrackedApp not found: non-existent-id");
  });
});
