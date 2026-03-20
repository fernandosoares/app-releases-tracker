import { Version } from "../release/Version";
import { TrackedAppId } from "./TrackedAppId";

export interface TrackedAppProps {
  id: TrackedAppId;
  name: string;
  sourceUrl: string;
  currentVersion?: Version;
  latestVersion?: Version;
  lastCheckedAt?: Date;
}

export class TrackedApp {
  private latestVersion?: Version;
  private lastCheckedAt?: Date;
  private currentVersion?: Version;

  private constructor(private readonly props: TrackedAppProps) {
    this.currentVersion = props.currentVersion;
    this.latestVersion = props.latestVersion;
    this.lastCheckedAt = props.lastCheckedAt;
  }

  static create(input: {
    id: TrackedAppId;
    name: string;
    sourceUrl: string;
    currentVersion?: Version;
  }): TrackedApp {
    const name = input.name.trim();
    const sourceUrl = input.sourceUrl.trim();

    if (name.length === 0) {
      throw new Error("Tracked app name cannot be empty");
    }

    if (!/^https?:\/\//.test(sourceUrl)) {
      throw new Error("Tracked app sourceUrl must be an absolute HTTP(S) URL");
    }

    return new TrackedApp({
      id: input.id,
      name,
      sourceUrl,
      currentVersion: input.currentVersion,
    });
  }

  get id(): TrackedAppId {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get sourceUrl(): string {
    return this.props.sourceUrl;
  }

  get current(): Version | undefined {
    return this.currentVersion;
  }

  get latest(): Version | undefined {
    return this.latestVersion;
  }

  get checkedAt(): Date | undefined {
    return this.lastCheckedAt;
  }

  markChecked(latestVersion: Version, checkedAt: Date): void {
    this.latestVersion = latestVersion;
    this.lastCheckedAt = checkedAt;
  }

  hasUpdateAvailable(): boolean {
    if (!this.latestVersion) {
      return false;
    }

    if (!this.currentVersion) {
      return true;
    }

    return this.latestVersion.isGreaterThan(this.currentVersion);
  }

  setCurrentVersion(version: Version): void {
    this.currentVersion = version;

    if (this.latestVersion && version.isGreaterThan(this.latestVersion)) {
      this.latestVersion = version;
    }
  }
}
