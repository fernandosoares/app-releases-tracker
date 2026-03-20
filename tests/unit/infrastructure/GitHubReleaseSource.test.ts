import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GitHubReleaseSource } from "@main/infrastructure/sources/GitHubReleaseSource";

// ---------------------------------------------------------------------------
// Mock global fetch
// ---------------------------------------------------------------------------

function mockFetch(status: number, body: unknown): void {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 200 ? "OK" : "Error",
      headers: {
        get: (_header: string) => null,
      },
      json: async () => body,
    }),
  );
}

describe("GitHubReleaseSource", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the first stable release version", async () => {
    mockFetch(200, [
      { tag_name: "v2.1.0", draft: false, prerelease: false },
      { tag_name: "v2.0.0", draft: false, prerelease: false },
    ]);

    const source = new GitHubReleaseSource();
    const version = await source.fetchLatestVersion(
      "https://github.com/owner/repo",
    );

    expect(version.toString()).toBe("2.1.0");
  });

  it("skips draft and prerelease entries by default", async () => {
    mockFetch(200, [
      { tag_name: "v3.0.0-beta.1", draft: false, prerelease: true },
      { tag_name: "v2.9.0", draft: false, prerelease: false },
    ]);

    const source = new GitHubReleaseSource();
    const version = await source.fetchLatestVersion(
      "https://github.com/owner/repo",
    );

    expect(version.toString()).toBe("2.9.0");
  });

  it("includes prereleases when option is set", async () => {
    mockFetch(200, [
      { tag_name: "v3.0.0-beta.1", draft: false, prerelease: true },
      { tag_name: "v2.9.0", draft: false, prerelease: false },
    ]);

    const source = new GitHubReleaseSource({ includePrerelease: true });
    const version = await source.fetchLatestVersion(
      "https://github.com/owner/repo",
    );

    expect(version.toString()).toBe("3.0.0-beta.1");
  });

  it("throws when rate-limited (403)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: "Forbidden",
        headers: {
          get: (h: string) => (h === "X-RateLimit-Reset" ? "1800000000" : null),
        },
        json: async () => ({}),
      }),
    );

    const source = new GitHubReleaseSource();

    await expect(
      source.fetchLatestVersion("https://github.com/owner/repo"),
    ).rejects.toThrow("GitHub API rate limit exceeded");
  });

  it("throws when repository is not found (404)", async () => {
    mockFetch(404, { message: "Not Found" });

    const source = new GitHubReleaseSource();

    await expect(
      source.fetchLatestVersion("https://github.com/owner/missing-repo"),
    ).rejects.toThrow("GitHub repository not found: owner/missing-repo");
  });

  it("rejects malformed URLs missing owner or repo", () => {
    const source = new GitHubReleaseSource();

    expect(() =>
      // calling private via cast to test guard — acceptable in unit tests
      (
        source as unknown as { parseOwnerRepo: (u: string) => void }
      ).parseOwnerRepo("https://github.com/only-owner"),
    ).toThrow("Cannot extract a valid owner/repo");
  });

  it("supports() returns true for github.com HTTPS URLs", () => {
    const source = new GitHubReleaseSource();

    expect(source.supports("https://github.com/owner/repo")).toBe(true);
    expect(source.supports("http://github.com/owner/repo")).toBe(false);
    expect(source.supports("https://gitlab.com/owner/repo")).toBe(false);
  });
});
