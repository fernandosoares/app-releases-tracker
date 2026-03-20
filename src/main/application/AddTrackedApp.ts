import { TrackedApp } from "../domain/app/TrackedApp";
import { TrackedAppId } from "../domain/app/TrackedAppId";
import { TrackedAppRepository } from "../domain/ports/TrackedAppRepository";

export interface AddTrackedAppInput {
  name: string;
  sourceUrl: string;
}

export interface AddTrackedAppOutput {
  id: string;
  name: string;
  sourceUrl: string;
}

/**
 * Use case: user adds a new application to track.
 *
 * Orchestrates domain construction and persistence only.
 * Source validation (i.e. "does this URL actually have releases?")
 * is deferred to the first CheckForUpdates run.
 */
export class AddTrackedApp {
  constructor(private readonly repository: TrackedAppRepository) {}

  async execute(input: AddTrackedAppInput): Promise<AddTrackedAppOutput> {
    const id = TrackedAppId.generate();

    const app = TrackedApp.create({
      id,
      name: input.name,
      sourceUrl: input.sourceUrl,
    });

    await this.repository.save(app);

    return {
      id: app.id.toString(),
      name: app.name,
      sourceUrl: app.sourceUrl,
    };
  }
}
