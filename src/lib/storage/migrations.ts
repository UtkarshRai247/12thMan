/**
 * Storage Migrations
 * Versioned schema for local storage
 */

export const STORAGE_VERSION = 2;
export const STORAGE_VERSION_KEY = '@12thman:storage_version';

export interface Migration {
  version: number;
  up: () => Promise<void>;
  down: () => Promise<void>;
}

export const migrations: Migration[] = [
  {
    version: 1,
    up: async () => {
      // Initial migration - no-op as we're starting fresh
    },
    down: async () => {
      // Rollback logic if needed
    },
  },
  {
    version: 2,
    up: async () => {
      // Migration 2: Add user profile support
      // No data migration needed, just schema version bump
    },
    down: async () => {
      // Rollback logic if needed
    },
  },
];

export async function runMigrations(
  getVersion: () => Promise<number>,
  setVersion: (version: number) => Promise<void>
): Promise<void> {
  const currentVersion = (await getVersion()) || 0;
  const targetVersion = STORAGE_VERSION;

  if (currentVersion === targetVersion) {
    return;
  }

  // Run migrations in order
  for (const migration of migrations) {
    if (migration.version > currentVersion && migration.version <= targetVersion) {
      await migration.up();
      await setVersion(migration.version);
    }
  }
}
