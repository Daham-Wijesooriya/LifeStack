import { eq } from 'drizzle-orm';

import type { Database } from '../client';
import { type Budget, budgets, type NewBudget } from '../schema';
import type { CrudRepository, ID } from './types';

export interface BudgetsRepository extends CrudRepository<Budget, NewBudget> {
  /** All budgets set for a given month (YYYY-MM), for budget-vs-actual. */
  getForMonth(month: string): Promise<Budget[]>;
  /** Create-or-replace the limit for (category, month), which is unique. */
  upsertForMonth(category: string, month: string, monthlyLimit: number): Promise<Budget>;
}

export function createBudgetsRepository(db: Database): BudgetsRepository {
  return {
    async getAll() {
      return db.select().from(budgets);
    },

    async getById(id: ID) {
      return db.query.budgets.findFirst({ where: eq(budgets.id, id) });
    },

    async getForMonth(month: string) {
      return db.select().from(budgets).where(eq(budgets.month, month));
    },

    async upsertForMonth(category, month, monthlyLimit) {
      const [row] = await db
        .insert(budgets)
        .values({ category, month, monthlyLimit })
        .onConflictDoUpdate({
          target: [budgets.category, budgets.month],
          set: { monthlyLimit },
        })
        .returning();
      if (!row) throw new Error('Failed to upsert budget');
      return row;
    },

    async create(input: NewBudget) {
      const [row] = await db.insert(budgets).values(input).returning();
      if (!row) throw new Error('Failed to create budget');
      return row;
    },

    async update(id, input) {
      const [row] = await db.update(budgets).set(input).where(eq(budgets.id, id)).returning();
      if (!row) throw new Error(`Budget ${id} not found`);
      return row;
    },

    async delete(id) {
      await db.delete(budgets).where(eq(budgets.id, id));
    },
  };
}
