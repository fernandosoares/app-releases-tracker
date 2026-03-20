import type { TrackedApp } from "../../domain/app/TrackedApp";

/**
 * Plain serialisable representation of a TrackedApp for IPC transport.
 * No class instances cross the IPC boundary — only JSON-safe primitives.
 */
export interface TrackedAppDto {
  id: string;
  name: string;
  sourceUrl: string;
  currentVersion: string | null;
  latestVersion: string | null;
  lastCheckedAt: string | null;
  hasUpdateAvailable: boolean;
}

export function toTrackedAppDto(app: TrackedApp): TrackedAppDto {
  return {
    id: app.id.toString(),
    name: app.name,
    sourceUrl: app.sourceUrl,
    currentVersion: app.current?.toString() ?? null,
    latestVersion: app.latest?.toString() ?? null,
    lastCheckedAt: app.checkedAt?.toISOString() ?? null,
    hasUpdateAvailable: app.hasUpdateAvailable(),
  };
}
