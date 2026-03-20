import type { AddTrackedApp } from "../../application/AddTrackedApp";
import type { RemoveTrackedApp } from "../../application/RemoveTrackedApp";
import type { CheckForUpdates } from "../../application/CheckForUpdates";
import type { TrackedAppRepository } from "../../domain/ports/TrackedAppRepository";
import { registerAppHandlers } from "./appHandlers";
import { registerDownloadHandlers } from "./downloadHandlers";
import { registerShellHandlers } from "./shellHandlers";
import { registerUpdateHandlers } from "./updateHandlers";

export interface HandlerDeps {
  repository: TrackedAppRepository;
  addTrackedApp: AddTrackedApp;
  removeTrackedApp: RemoveTrackedApp;
  checkForUpdates: CheckForUpdates;
}

export function registerAllHandlers(deps: HandlerDeps): void {
  registerAppHandlers({
    repository: deps.repository,
    addTrackedApp: deps.addTrackedApp,
    removeTrackedApp: deps.removeTrackedApp,
  });

  registerShellHandlers();

  registerDownloadHandlers({
    repository: deps.repository,
  });

  registerUpdateHandlers({
    checkForUpdates: deps.checkForUpdates,
  });
}
