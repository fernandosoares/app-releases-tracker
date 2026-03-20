import { Version } from "../../domain/release/Version";
import type { ReleaseSourcePort } from "../../domain/ports/ReleaseSourcePort";

interface GiteaReleaseResponse {
  tag_name: string;
}

/**
 * Adapter — fetches latest release from Gitea-compatible APIs.
 *
 * Supported source URLs:
 *   https://codeberg.org/{owner}/{repo}
 *   https://gitea.example.com/{owner}/{repo}
 */
export class GiteaReleaseSource implements ReleaseSourcePort {
  private static readonly OWNER_REPO_RE = /^[A-Za-z0-9_.-]+$/;

  constructor(
    private readonly options: {
      /** Gitea token for private repositories. */
      token?: string;
    } = {},
  ) {}

  supports(sourceUrl: string): boolean {
    try {
      const url = new URL(sourceUrl);
      if (url.protocol !== "https:") return false;
      if (url.hostname === "github.com" || url.hostname.includes("gitlab")) {
        return false;
      }

      const segments = url.pathname.replace(/^\//, "").split("/");
      return segments.length >= 2 && !!segments[0] && !!segments[1];
    } catch {
      return false;
    }
  }

  async fetchLatestVersion(sourceUrl: string): Promise<Version> {
    const { origin, owner, repo } = this.parseOwnerRepo(sourceUrl);
    const release = await this.fetchLatestRelease(origin, owner, repo);
    return Version.parse(release.tag_name);
  }

  private parseOwnerRepo(sourceUrl: string): {
    origin: string;
    owner: string;
    repo: string;
  } {
    const url = new URL(sourceUrl);

    if (url.protocol !== "https:") {
      throw new Error("Only HTTPS Gitea URLs are supported");
    }

    const segments = url.pathname.replace(/^\//, "").split("/");
    const owner = segments[0];
    const repo = segments[1]?.replace(/\.git$/, "");

    if (
      !owner ||
      !repo ||
      !GiteaReleaseSource.OWNER_REPO_RE.test(owner) ||
      !GiteaReleaseSource.OWNER_REPO_RE.test(repo)
    ) {
      throw new Error(
        `Cannot extract a valid owner/repo from URL: ${sourceUrl}`,
      );
    }

    return { origin: url.origin, owner, repo };
  }

  private async fetchLatestRelease(
    origin: string,
    owner: string,
    repo: string,
  ): Promise<GiteaReleaseResponse> {
    const url = `${origin}/api/v1/repos/${owner}/${repo}/releases/latest`;

    const headers: Record<string, string> = {
      Accept: "application/json",
      "User-Agent": "app-releases-tracker",
    };

    if (this.options.token) {
      headers["Authorization"] = `token ${this.options.token}`;
    }

    const response = await fetch(url, { headers });

    if (response.status === 404) {
      throw new Error(
        `Gitea repository not found or has no releases: ${owner}/${repo}`,
      );
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error(
        `Gitea access denied for repository: ${owner}/${repo}. Provide a token for private repositories.`,
      );
    }

    if (!response.ok) {
      throw new Error(
        `Gitea API error: ${response.status} ${response.statusText}`,
      );
    }

    return response.json() as Promise<GiteaReleaseResponse>;
  }
}
