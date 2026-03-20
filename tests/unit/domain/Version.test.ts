import { describe, expect, it } from "vitest";
import { Version } from "@main/domain/release/Version";

describe("Version", () => {
  it("parses valid versions including prefixed tags", () => {
    const version = Version.parse("v1.2.3");

    expect(version.toString()).toBe("1.2.3");
  });

  it("throws for invalid versions", () => {
    expect(() => Version.parse("1.2")).toThrowError(
      "Invalid semantic version: 1.2",
    );
    expect(() => Version.parse("abc")).toThrowError(
      "Invalid semantic version: abc",
    );
  });

  it("compares stable versions correctly", () => {
    const current = Version.parse("1.2.3");
    const latest = Version.parse("1.3.0");

    expect(latest.isGreaterThan(current)).toBe(true);
    expect(current.isGreaterThan(latest)).toBe(false);
  });

  it("treats prerelease as lower precedence than stable", () => {
    const prerelease = Version.parse("1.2.3-beta.1");
    const stable = Version.parse("1.2.3");

    expect(stable.isGreaterThan(prerelease)).toBe(true);
  });
});
