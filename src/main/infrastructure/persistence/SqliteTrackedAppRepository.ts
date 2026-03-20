import Database from "better-sqlite3";
import { TrackedApp } from "../../domain/app/TrackedApp";
import { TrackedAppId } from "../../domain/app/TrackedAppId";
import { Version } from "../../domain/release/Version";
import type { TrackedAppRepository } from "../../domain/ports/TrackedAppRepository";

interface AppRow {
  id: string;
  name: string;
  source_url: string;
  current_version: string | null;
  latest_version: string | null;
  last_checked_at: string | null;
}

/**
 * SQLite-backed implementation of TrackedAppRepository.
 *
 * Uses better-sqlite3 (synchronous API) wrapped in async methods to honour
 * the port contract. All SQL is parameterised — no string interpolation of
 * user data — preventing SQL injection.
 */
export class SqliteTrackedAppRepository implements TrackedAppRepository {
  private readonly db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");
    this.migrate();
  }

  private migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tracked_apps (
        id               TEXT PRIMARY KEY NOT NULL,
        name             TEXT NOT NULL,
        source_url       TEXT NOT NULL,
        current_version  TEXT,
        latest_version   TEXT,
        last_checked_at  TEXT
      );
    `);
  }

  async save(app: TrackedApp): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO tracked_apps (id, name, source_url, current_version, latest_version, last_checked_at)
      VALUES (@id, @name, @source_url, @current_version, @latest_version, @last_checked_at)
      ON CONFLICT(id) DO UPDATE SET
        name             = excluded.name,
        source_url       = excluded.source_url,
        current_version  = excluded.current_version,
        latest_version   = excluded.latest_version,
        last_checked_at  = excluded.last_checked_at
    `);

    stmt.run({
      id: app.id.toString(),
      name: app.name,
      source_url: app.sourceUrl,
      current_version: app.current?.toString() ?? null,
      latest_version: app.latest?.toString() ?? null,
      last_checked_at: app.checkedAt?.toISOString() ?? null,
    });
  }

  async findById(id: TrackedAppId): Promise<TrackedApp | null> {
    const stmt = this.db.prepare<string, AppRow>(
      "SELECT * FROM tracked_apps WHERE id = ?",
    );
    const row = stmt.get(id.toString());

    return row ? this.toEntity(row) : null;
  }

  async listAll(): Promise<TrackedApp[]> {
    const stmt = this.db.prepare<[], AppRow>(
      "SELECT * FROM tracked_apps ORDER BY name ASC",
    );
    const rows = stmt.all();

    return rows.map((row) => this.toEntity(row));
  }

  async remove(id: TrackedAppId): Promise<void> {
    const stmt = this.db.prepare("DELETE FROM tracked_apps WHERE id = ?");
    stmt.run(id.toString());
  }

  close(): void {
    this.db.close();
  }

  private toEntity(row: AppRow): TrackedApp {
    const app = TrackedApp.create({
      id: TrackedAppId.create(row.id),
      name: row.name,
      sourceUrl: row.source_url,
      currentVersion: row.current_version
        ? Version.parse(row.current_version)
        : undefined,
    });

    if (row.latest_version) {
      app.markChecked(
        Version.parse(row.latest_version),
        row.last_checked_at ? new Date(row.last_checked_at) : new Date(),
      );
    }

    return app;
  }
}
