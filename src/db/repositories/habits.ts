import { and, asc, eq } from 'drizzle-orm';

import type { Database } from '../client';
import { type Habit, habitLogs, type HabitLog, habits, type NewHabit, type NewHabitLog } from '../schema';
import type { CrudRepository, ID } from './types';

export interface HabitsRepository extends CrudRepository<Habit, NewHabit> {
  /** Active habits by default; pass `true` to include archived ones. */
  getAll(includeArchived?: boolean): Promise<Habit[]>;
  /** Raw log rows for one habit, oldest first — streak/heatmap math lives in src/lib/date.ts. */
  getLogsForHabit(habitId: ID): Promise<HabitLog[]>;
  /** All habit_log rows for a single day, e.g. the dashboard's "done/total". */
  getLogsForDate(date: string): Promise<HabitLog[]>;
  /** Tap-to-complete: upserts the (habitId, date) log row. */
  setLogCompleted(habitId: ID, date: string, completed: boolean): Promise<HabitLog>;
}

export function createHabitsRepository(db: Database): HabitsRepository {
  return {
    async getAll(includeArchived = false) {
      return db
        .select()
        .from(habits)
        .where(includeArchived ? undefined : eq(habits.archived, false))
        .orderBy(asc(habits.createdAt));
    },

    async getById(id: ID) {
      return db.query.habits.findFirst({ where: eq(habits.id, id) });
    },

    async getLogsForHabit(habitId: ID) {
      return db
        .select()
        .from(habitLogs)
        .where(eq(habitLogs.habitId, habitId))
        .orderBy(asc(habitLogs.date));
    },

    async getLogsForDate(date: string) {
      return db.select().from(habitLogs).where(eq(habitLogs.date, date));
    },

    async setLogCompleted(habitId: ID, date: string, completed: boolean) {
      const input: NewHabitLog = { habitId, date, completed };
      const [row] = await db
        .insert(habitLogs)
        .values(input)
        .onConflictDoUpdate({
          target: [habitLogs.habitId, habitLogs.date],
          set: { completed },
        })
        .returning();
      if (!row) throw new Error('Failed to set habit log');
      return row;
    },

    async create(input: NewHabit) {
      const [row] = await db.insert(habits).values(input).returning();
      if (!row) throw new Error('Failed to create habit');
      return row;
    },

    async update(id, input) {
      const [row] = await db.update(habits).set(input).where(eq(habits.id, id)).returning();
      if (!row) throw new Error(`Habit ${id} not found`);
      return row;
    },

    async delete(id) {
      await db.delete(habits).where(eq(habits.id, id));
    },
  };
}
