import { TrackedAppId } from "../domain/app/TrackedAppId";
import { TrackedAppRepository } from "../domain/ports/TrackedAppRepository";

export interface RemoveTrackedAppInput {
  id: string;
}

/**
 * Use case: user removes a tracked application.
 * Throws if the app does not exist to surface accidental double-removes.
 */
export class RemoveTrackedApp {
  constructor(private readonly repository: TrackedAppRepository) {}

  async execute(input: RemoveTrackedAppInput): Promise<void> {
    const id = TrackedAppId.create(input.id);
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new Error(`TrackedApp not found: ${input.id}`);
    }

    await this.repository.remove(id);
  }
}
