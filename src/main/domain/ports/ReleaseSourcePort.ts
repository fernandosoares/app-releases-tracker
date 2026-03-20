import { Version } from "../release/Version";

/**
 * Outbound port — the application layer calls this to fetch the latest release
 * from an external source (GitHub, GitLab, etc.).
 *
 * Each source adapter implements this interface. The factory/registry selects
 * the right adapter based on the URL (Strategy pattern).
 */
export interface ReleaseSourcePort {
  /**
   * Returns the latest published version string for the given source URL.
   * Throws if the source is unreachable or the URL is not supported.
   */
  fetchLatestVersion(sourceUrl: string): Promise<Version>;

  /**
   * Returns true when this adapter can handle the given URL.
   * Used by the SourceFactory to select the correct implementation.
   */
  supports(sourceUrl: string): boolean;
}
