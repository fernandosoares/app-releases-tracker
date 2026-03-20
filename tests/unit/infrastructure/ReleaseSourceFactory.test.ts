import { describe, expect, it } from "vitest";
import { ReleaseSourceFactory } from "@main/infrastructure/sources/ReleaseSourceFactory";
import { GitHubReleaseSource } from "@main/infrastructure/sources/GitHubReleaseSource";
import { GitLabReleaseSource } from "@main/infrastructure/sources/GitLabReleaseSource";

describe("ReleaseSourceFactory", () => {
  const factory = new ReleaseSourceFactory([
    new GitHubReleaseSource(),
    new GitLabReleaseSource(),
  ]);

  it("returns the GitHub adapter for github.com URLs", () => {
    const source = factory.getSource("https://github.com/owner/repo");
    expect(source).toBeInstanceOf(GitHubReleaseSource);
  });

  it("returns the GitLab adapter for gitlab.com URLs", () => {
    const source = factory.getSource("https://gitlab.com/owner/repo");
    expect(source).toBeInstanceOf(GitLabReleaseSource);
  });

  it("throws when no adapter supports the URL", () => {
    // No adapter registered for made-up host
    const emptyFactory = new ReleaseSourceFactory([]);

    expect(() => emptyFactory.getSource("https://example.com/app")).toThrow(
      "No release source adapter found",
    );
  });
});
