import { relations } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

/**
 * Date/time column convention (enforced by callers, not the DB):
 * - "Calendar day" columns (date, due_date, month) are plain `YYYY-MM-DD`
 *   strings in the device's local timezone — never UTC-derived, so a day
 *   boundary near midnight doesn't shift to the wrong local day.
 * - Full-instant columns (created_at, completed_at, bedtime, wake_time) are
 *   ISO 8601 datetime strings, needed for sleep duration math across a
 *   midnight rollover and for stable created-order sorting.
 * Repositories never call `new Date()`/`Date.now()` themselves — every
 * timestamp is supplied by the caller (via src/lib/date.ts helpers, added in
 * a later step) so repositories stay pure and easy to test.
 */

export const sleepLogs = sqliteTable(
  'sleep_logs',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    date: text('date').notNull(),
    bedtime: text('bedtime').notNull(),
    wakeTime: text('wake_time').notNull(),
    durationMinutes: integer('duration_minutes').notNull(),
    quality: integer('quality').notNull(),
    notes: text('notes'),
  },
  (table) => [index('sleep_logs_date_idx').on(table.date)],
);

export const habits = sqliteTable('habits', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  icon: text('icon').notNull(),
  frequencyType: text('frequency_type').notNull().$type<'daily' | 'weekly'>(),
  targetPerWeek: integer('target_per_week'),
  color: text('color').notNull(),
  createdAt: text('created_at').notNull(),
  archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
});

export const habitLogs = sqliteTable(
  'habit_logs',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    habitId: integer('habit_id')
      .notNull()
      .references(() => habits.id, { onDelete: 'cascade' }),
    date: text('date').notNull(),
    completed: integer('completed', { mode: 'boolean' }).notNull().default(true),
  },
  (table) => [uniqueIndex('habit_logs_habit_date_idx').on(table.habitId, table.date)],
);

export const habitsRelations = relations(habits, ({ many }) => ({
  logs: many(habitLogs),
}));

export const habitLogsRelations = relations(habitLogs, ({ one }) => ({
  habit: one(habits, { fields: [habitLogs.habitId], references: [habits.id] }),
}));

export const todos = sqliteTable(
  'todos',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('title').notNull(),
    notes: text('notes'),
    dueDate: text('due_date'),
    priority: text('priority').notNull().$type<'low' | 'medium' | 'high'>(),
    tag: text('tag'),
    completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
    createdAt: text('created_at').notNull(),
    completedAt: text('completed_at'),
  },
  (table) => [
    index('todos_due_date_idx').on(table.dueDate),
    index('todos_completed_idx').on(table.completed),
  ],
);

// Amounts are stored as plain decimal currency values (e.g. 12.50), matching
// the selected currency's display unit — not integer minor units (cents).
// This app has no multi-currency arithmetic or ledger-grade reconciliation,
// so the added complexity of an integer-cents convention isn't justified.
export const transactions = sqliteTable(
  'transactions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    type: text('type').notNull().$type<'income' | 'expense'>(),
    amount: real('amount').notNull(),
    category: text('category').notNull(),
    note: text('note'),
    date: text('date').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('transactions_date_idx').on(table.date),
    index('transactions_category_idx').on(table.category),
  ],
);

export const budgets = sqliteTable(
  'budgets',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    category: text('category').notNull(),
    monthlyLimit: real('monthly_limit').notNull(),
    month: text('month').notNull(),
  },
  (table) => [uniqueIndex('budgets_category_month_idx').on(table.category, table.month)],
);

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export type SleepLog = typeof sleepLogs.$inferSelect;
export type NewSleepLog = typeof sleepLogs.$inferInsert;

export type Habit = typeof habits.$inferSelect;
export type NewHabit = typeof habits.$inferInsert;

export type HabitLog = typeof habitLogs.$inferSelect;
export type NewHabitLog = typeof habitLogs.$inferInsert;

export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export type Budget = typeof budgets.$inferSelect;
export type NewBudget = typeof budgets.$inferInsert;

export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;
