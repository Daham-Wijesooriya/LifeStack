import { and, desc, eq, gte, lte } from 'drizzle-orm';

import type { Database } from '../client';
import { type NewSleepLog, type SleepLog, sleepLogs } from '../schema';
import type { CrudRepository, ID } from './types';

export interface SleepRepository extends CrudRepository<SleepLog, NewSleepLog> {
  /** Inclusive date range, e.g. the last 7/30 days for the bar chart. */
  getInRange(startDate: string, endDate: string): Promise<SleepLog[]>;
}

export function createSleepRepository(db: Database): SleepRepository {
  return {
    async getAll() {
      return db.select().from(sleepLogs).orderBy(desc(sleepLogs.date));
    },

    async getById(id: ID) {
      return db.query.sleepLogs.findFirst({ where: eq(sleepLogs.id, id) });
    },

    async getInRange(startDate, endDate) {
      return db
        .select()
        .from(sleepLogs)
        .where(and(gte(sleepLogs.date, startDate), lte(sleepLogs.date, endDate)))
        .orderBy(desc(sleepLogs.date));
    },

    async create(input: NewSleepLog) {
      const [row] = await db.insert(sleepLogs).values(input).returning();
      if (!row) throw new Error('Failed to create sleep log');
      return row;
    },

    async update(id, input) {
      const [row] = await db
        .update(sleepLogs)
        .set(input)
        .where(eq(sleepLogs.id, id))
        .returning();
      if (!row) throw new Error(`Sleep log ${id} not found`);
      return row;
    },

    async delete(id) {
      await db.delete(sleepLogs).where(eq(sleepLogs.id, id));
    },
  };
}
