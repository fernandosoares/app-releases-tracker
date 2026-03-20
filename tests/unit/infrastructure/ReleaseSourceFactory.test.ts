import { describe, expect, it } from "vitest";
import { ReleaseSourceFactory } from "@main/infrastructure/sources/ReleaseSourceFactory";
import { GiteaReleaseSource } from "@main/infrastructure/sources/GiteaReleaseSource";
import { GitHubReleaseSource } from "@main/infrastructure/sources/GitHubReleaseSource";
import { GitLabReleaseSource } from "@main/infrastructure/sources/GitLabReleaseSource";

describe("ReleaseSourceFactory", () => {
  const factory = new ReleaseSourceFactory([
    new GitHubReleaseSource(),
    new GitLabReleaseSource(),
    new GiteaReleaseSource(),
  ]);

  it("returns the GitHub adapter for github.com URLs", () => {
    const source = factory.getSource("https://github.com/owner/repo");
    expect(source).toBeInstanceOf(GitHubReleaseSource);
  });

  it("returns the GitLab adapter for gitlab.com URLs", () => {
    const source = factory.getSource("https://gitlab.com/owner/repo");
    expect(source).toBeInstanceOf(GitLabReleaseSource);
  });

  it("returns the Gitea adapter for gitea-like URLs", () => {
    const source = factory.getSource("https://codeberg.org/owner/repo");
    expect(source).toBeInstanceOf(GiteaReleaseSource);
  });

  it("throws when no adapter supports the URL", () => {
    // No adapter registered for made-up host
    const emptyFactory = new ReleaseSourceFactory([]);

    expect(() => emptyFactory.getSource("https://example.com/app")).toThrow(
      "No release source adapter found",
    );
  });
});
