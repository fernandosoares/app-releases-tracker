import { Version } from "../../domain/release/Version";
import type { ReleaseSourcePort } from "../../domain/ports/ReleaseSourcePort";

interface GitHubReleaseResponse {
  tag_name: string;
  draft: boolean;
  prerelease: boolean;
}

/**
 * Adapter — fetches the latest release from the GitHub Releases API.
 *
 * Supports URLs in the form:
 *   https://github.com/{owner}/{repo}
 *   https://github.com/{owner}/{repo}/releases
 *   https://github.com/{owner}/{repo}/releases/tag/{tag}
 *
 * Uses fetch (Node 18+ built-in). Only stable (non-draft, non-prerelease)
 * releases are considered by default. Set `includePrerelease: true` to
 * also surface pre-releases.
 *
 * Security: only HTTPS URLs are allowed. The owner/repo segments are
 * validated against a strict allow-list regex before being embedded in
 * the API path to prevent path traversal.
 */
export class GitHubReleaseSource implements ReleaseSourcePort {
  private static readonly OWNER_REPO_RE = /^[A-Za-z0-9_.-]+$/;
  private static readonly GITHUB_HOST = "github.com";
  private static readonly API_BASE = "https://api.github.com";

  constructor(
    private readonly options: {
      includePrerelease?: boolean;
      /** GitHub personal access token — optional, raises rate limit to 5000/hour */
      token?: string;
    } = {},
  ) {}

  supports(sourceUrl: string): boolean {
    try {
      const url = new URL(sourceUrl);
      return (
        url.hostname === GitHubReleaseSource.GITHUB_HOST &&
        url.protocol === "https:"
      );
    } catch {
      return false;
    }
  }

  async fetchLatestVersion(sourceUrl: string): Promise<Version> {
    const { owner, repo } = this.parseOwnerRepo(sourceUrl);
    const releases = await this.fetchReleases(owner, repo);

    const candidate = releases.find(
      (r) => !r.draft && (this.options.includePrerelease || !r.prerelease),
    );

    if (!candidate) {
      throw new Error(
        `No suitable release found for ${owner}/${repo} (includePrerelease=${this.options.includePrerelease ?? false})`,
      );
    }

    return Version.parse(candidate.tag_name);
  }

  private parseOwnerRepo(sourceUrl: string): { owner: string; repo: string } {
    const url = new URL(sourceUrl);

    if (url.protocol !== "https:") {
      throw new Error("Only HTTPS GitHub URLs are supported");
    }

    // Strip leading slash and trailing segments (/releases, /releases/tag/...)
    const segments = url.pathname.replace(/^\//, "").split("/");

    const owner = segments[0];
    const repo = segments[1]?.replace(/\.git$/, "");

    if (
      !owner ||
      !repo ||
      !GitHubReleaseSource.OWNER_REPO_RE.test(owner) ||
      !GitHubReleaseSource.OWNER_REPO_RE.test(repo)
    ) {
      throw new Error(
        `Cannot extract a valid owner/repo from URL: ${sourceUrl}`,
      );
    }

    return { owner, repo };
  }

  private async fetchReleases(
    owner: string,
    repo: string,
  ): Promise<GitHubReleaseResponse[]> {
    const url = `${GitHubReleaseSource.API_BASE}/repos/${owner}/${repo}/releases?per_page=10`;

    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "app-releases-tracker",
    };

    if (this.options.token) {
      headers["Authorization"] = `Bearer ${this.options.token}`;
    }

    const response = await fetch(url, { headers });

    if (response.status === 403 || response.status === 429) {
      const resetHeader = response.headers.get("X-RateLimit-Reset");
      const resetAt = resetHeader
        ? new Date(Number(resetHeader) * 1000).toISOString()
        : "unknown";
      throw new Error(`GitHub API rate limit exceeded. Resets at: ${resetAt}`);
    }

    if (response.status === 404) {
      throw new Error(`GitHub repository not found: ${owner}/${repo}`);
    }

    if (!response.ok) {
      throw new Error(
        `GitHub API error: ${response.status} ${response.statusText} for ${owner}/${repo}`,
      );
    }

    return response.json() as Promise<GitHubReleaseResponse[]>;
  }
}
