import { eq } from 'drizzle-orm';

import type { Database } from '../client';
import { settings } from '../schema';

/** Key/value store (currency, theme preference, notification toggles, ...). */
export interface SettingsRepository {
  get(key: string): Promise<string | undefined>;
  getAll(): Promise<Record<string, string>>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

export function createSettingsRepository(db: Database): SettingsRepository {
  return {
    async get(key: string) {
      const row = await db.query.settings.findFirst({ where: eq(settings.key, key) });
      return row?.value;
    },

    async getAll() {
      const rows = await db.select().from(settings);
      return Object.fromEntries(rows.map((row) => [row.key, row.value]));
    },

    async set(key: string, value: string) {
      await db
        .insert(settings)
        .values({ key, value })
        .onConflictDoUpdate({ target: settings.key, set: { value } });
    },

    async delete(key: string) {
      await db.delete(settings).where(eq(settings.key, key));
    },
  };
}
