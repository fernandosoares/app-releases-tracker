import type { ReleaseSourcePort } from "../../domain/ports/ReleaseSourcePort";
import { Version } from "../../domain/release/Version";
import type { ReleaseSourceFactory } from "./ReleaseSourceFactory";

/**
 * Infrastructure adapter that implements ReleaseSourcePort by delegating
 * per-URL routing to the ReleaseSourceFactory.
 *
 * This keeps the application layer (CheckForUpdates) free from any
 * infrastructure dependency — it only sees the port interface.
 */
export class RoutingReleaseSource implements ReleaseSourcePort {
  constructor(private readonly factory: ReleaseSourceFactory) {}

  supports(sourceUrl: string): boolean {
    try {
      this.factory.getSource(sourceUrl);
      return true;
    } catch {
      return false;
    }
  }

  fetchLatestVersion(sourceUrl: string): Promise<Version> {
    const source = this.factory.getSource(sourceUrl);
    return source.fetchLatestVersion(sourceUrl);
  }
}
