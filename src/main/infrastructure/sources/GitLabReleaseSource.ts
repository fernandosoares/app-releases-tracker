import { Version } from "../../domain/release/Version";
import type { ReleaseSourcePort } from "../../domain/ports/ReleaseSourcePort";

interface GitLabReleaseResponse {
  tag_name: string;
  upcoming_release: boolean;
}

/**
 * Adapter — fetches the latest release from the GitLab Releases API.
 *
 * Supports both gitlab.com and self-hosted instances:
 *   https://gitlab.com/{owner}/{repo}
 *   https://gitlab.example.com/{owner}/{repo}
 *
 * Security: only HTTPS URLs are allowed. Path segments are validated
 * before being embedded in the API path.
 */
export class GitLabReleaseSource implements ReleaseSourcePort {
  private static readonly OWNER_REPO_RE = /^[A-Za-z0-9_.\-/]+$/;

  constructor(
    private readonly options: {
      /** Personal access token or project token — required for private repos */
      token?: string;
    } = {},
  ) {}

  supports(sourceUrl: string): boolean {
    try {
      const url = new URL(sourceUrl);
      if (url.protocol !== "https:") return false;
      if (url.hostname === "github.com") return false;
      // gitlab.com and most self-hosted GitLab instances use either a
      // gitlab-like hostname or the '/-/' path segment in project pages.
      return (
        url.hostname.includes("gitlab") ||
        url.pathname.includes("/-/") ||
        sourceUrl.includes("/api/v4/")
      );
    } catch {
      return false;
    }
  }

  async fetchLatestVersion(sourceUrl: string): Promise<Version> {
    const { apiBase, projectPath } = this.parseProject(sourceUrl);
    const release = await this.fetchLatestRelease(apiBase, projectPath);
    return Version.parse(release.tag_name);
  }

  private parseProject(sourceUrl: string): {
    apiBase: string;
    projectPath: string;
  } {
    const url = new URL(sourceUrl);

    if (url.protocol !== "https:") {
      throw new Error("Only HTTPS GitLab URLs are supported");
    }

    const apiBase = `${url.protocol}//${url.hostname}/api/v4`;
    // Strip leading slash; strip trailing /releases etc.
    const rawPath = url.pathname.replace(/^\//, "").split("/-/")[0];

    if (!rawPath || !GitLabReleaseSource.OWNER_REPO_RE.test(rawPath)) {
      throw new Error(
        `Cannot extract a valid project path from URL: ${sourceUrl}`,
      );
    }

    return { apiBase, projectPath: encodeURIComponent(rawPath) };
  }

  private async fetchLatestRelease(
    apiBase: string,
    projectPath: string,
  ): Promise<GitLabReleaseResponse> {
    const url = `${apiBase}/projects/${projectPath}/releases/permalink/latest`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "app-releases-tracker",
    };

    if (this.options.token) {
      headers["PRIVATE-TOKEN"] = this.options.token;
    }

    const response = await fetch(url, { headers });

    if (response.status === 404) {
      throw new Error(
        `GitLab project not found or has no releases: ${decodeURIComponent(projectPath)}`,
      );
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error(
        `GitLab access denied for project: ${decodeURIComponent(projectPath)}. ` +
          "Provide a token for private repositories.",
      );
    }

    if (!response.ok) {
      throw new Error(
        `GitLab API error: ${response.status} ${response.statusText}`,
      );
    }

    return response.json() as Promise<GitLabReleaseResponse>;
  }
}
