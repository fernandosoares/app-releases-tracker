export class Version {
  private static readonly SEMVER_REGEX =
    /^(?:v)?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?(?:\+([0-9A-Za-z.-]+))?$/;

  private constructor(
    private readonly major: number,
    private readonly minor: number,
    private readonly patch: number,
    private readonly prerelease?: string,
    private readonly build?: string,
  ) {}

  static parse(input: string): Version {
    const value = input.trim();
    const match = Version.SEMVER_REGEX.exec(value);

    if (!match) {
      throw new Error(`Invalid semantic version: ${input}`);
    }

    const major = Number(match[1]);
    const minor = Number(match[2]);
    const patch = Number(match[3]);

    return new Version(major, minor, patch, match[4], match[5]);
  }

  compareTo(other: Version): number {
    if (this.major !== other.major) {
      return this.major - other.major;
    }

    if (this.minor !== other.minor) {
      return this.minor - other.minor;
    }

    if (this.patch !== other.patch) {
      return this.patch - other.patch;
    }

    return Version.comparePrerelease(this.prerelease, other.prerelease);
  }

  isGreaterThan(other: Version): boolean {
    return this.compareTo(other) > 0;
  }

  equals(other: Version): boolean {
    return this.compareTo(other) === 0;
  }

  toString(): string {
    const base = `${this.major}.${this.minor}.${this.patch}`;
    const pre = this.prerelease ? `-${this.prerelease}` : "";
    const build = this.build ? `+${this.build}` : "";

    return `${base}${pre}${build}`;
  }

  private static comparePrerelease(left?: string, right?: string): number {
    if (!left && !right) {
      return 0;
    }

    if (!left) {
      return 1;
    }

    if (!right) {
      return -1;
    }

    const leftParts = left.split(".");
    const rightParts = right.split(".");
    const max = Math.max(leftParts.length, rightParts.length);

    for (let i = 0; i < max; i += 1) {
      const l = leftParts[i];
      const r = rightParts[i];

      if (l === undefined) {
        return -1;
      }

      if (r === undefined) {
        return 1;
      }

      const numericLeft = /^\d+$/.test(l);
      const numericRight = /^\d+$/.test(r);

      if (numericLeft && numericRight) {
        const diff = Number(l) - Number(r);
        if (diff !== 0) {
          return diff;
        }
        continue;
      }

      if (numericLeft && !numericRight) {
        return -1;
      }

      if (!numericLeft && numericRight) {
        return 1;
      }

      if (l < r) {
        return -1;
      }

      if (l > r) {
        return 1;
      }
    }

    return 0;
  }
}
