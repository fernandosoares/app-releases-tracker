import { TrackedApp } from "../app/TrackedApp";
import { TrackedAppId } from "../app/TrackedAppId";

export interface TrackedAppRepository {
  save(app: TrackedApp): Promise<void>;
  findById(id: TrackedAppId): Promise<TrackedApp | null>;
  listAll(): Promise<TrackedApp[]>;
  remove(id: TrackedAppId): Promise<void>;
}
