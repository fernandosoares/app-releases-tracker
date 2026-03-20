export class TrackedAppId {
  private constructor(private readonly value: string) {}

  static create(input: string): TrackedAppId {
    const candidate = input.trim();

    if (candidate.length === 0) {
      throw new Error("TrackedAppId cannot be empty");
    }

    return new TrackedAppId(candidate);
  }

  static generate(): TrackedAppId {
    return new TrackedAppId(crypto.randomUUID());
  }

  equals(other: TrackedAppId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
