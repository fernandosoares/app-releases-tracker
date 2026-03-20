import type { ReleaseSourcePort } from "../../domain/ports/ReleaseSourcePort";

/**
 * Factory — selects the correct ReleaseSourcePort adapter for a given URL.
 *
 * Pattern: Strategy selection via factory.
 * Add new adapters by registering them in the constructor array.
 */
export class ReleaseSourceFactory {
  constructor(private readonly sources: ReleaseSourcePort[]) {}

  /**
   * Returns the first adapter that claims to support the given URL.
   * Throws if no adapter matches — callers should validate URLs before
   * adding them to the registry.
   */
  getSource(sourceUrl: string): ReleaseSourcePort {
    const source = this.sources.find((s) => s.supports(sourceUrl));

    if (!source) {
      throw new Error(
        `No release source adapter found for URL: ${sourceUrl}. ` +
          "Supported sources: GitHub, GitLab.",
      );
    }

    return source;
  }
}
