import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GiteaReleaseSource } from "@main/infrastructure/sources/GiteaReleaseSource";

function mockFetch(status: number, body: unknown): void {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 200 ? "OK" : "Error",
      json: async () => body,
    }),
  );
}

describe("GiteaReleaseSource", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("supports codeberg and self-hosted gitea-like URLs", () => {
    const source = new GiteaReleaseSource();

    expect(source.supports("https://codeberg.org/owner/repo")).toBe(true);
    expect(source.supports("https://gitea.example.com/owner/repo")).toBe(true);
    expect(source.supports("https://github.com/owner/repo")).toBe(false);
    expect(source.supports("https://gitlab.com/owner/repo")).toBe(false);
    expect(source.supports("http://codeberg.org/owner/repo")).toBe(false);
  });

  it("fetches latest release tag and returns parsed version", async () => {
    mockFetch(200, { tag_name: "v1.5.2" });

    const source = new GiteaReleaseSource();
    const version = await source.fetchLatestVersion(
      "https://codeberg.org/owner/repo",
    );

    expect(version.toString()).toBe("1.5.2");
  });

  it("throws a clear not-found error for missing repos", async () => {
    mockFetch(404, { message: "not found" });

    const source = new GiteaReleaseSource();

    await expect(
      source.fetchLatestVersion("https://codeberg.org/owner/missing"),
    ).rejects.toThrow("Gitea repository not found or has no releases");
  });

  it("throws access denied for unauthorized repos", async () => {
    mockFetch(403, { message: "forbidden" });

    const source = new GiteaReleaseSource();

    await expect(
      source.fetchLatestVersion("https://codeberg.org/owner/private"),
    ).rejects.toThrow("Gitea access denied");
  });
});
