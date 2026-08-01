import { and, desc, eq, gte, lte, sum } from 'drizzle-orm';

import type { Database } from '../client';
import { type NewTransaction, type Transaction, transactions } from '../schema';
import type { CrudRepository, ID } from './types';

export interface TransactionsRepository extends CrudRepository<Transaction, NewTransaction> {
  /** Inclusive date range, e.g. a month for the trend line / pie chart. */
  getInRange(startDate: string, endDate: string): Promise<Transaction[]>;
  /** Sum of amounts in range, optionally narrowed to income or expense. */
  getTotalForRange(
    startDate: string,
    endDate: string,
    type?: Transaction['type'],
  ): Promise<number>;
}

export function createTransactionsRepository(db: Database): TransactionsRepository {
  return {
    async getAll() {
      return db.select().from(transactions).orderBy(desc(transactions.date));
    },

    async getById(id: ID) {
      return db.query.transactions.findFirst({ where: eq(transactions.id, id) });
    },

    async getInRange(startDate, endDate) {
      return db
        .select()
        .from(transactions)
        .where(and(gte(transactions.date, startDate), lte(transactions.date, endDate)))
        .orderBy(desc(transactions.date));
    },

    async getTotalForRange(startDate, endDate, type) {
      const [row] = await db
        .select({ total: sum(transactions.amount) })
        .from(transactions)
        .where(
          and(
            gte(transactions.date, startDate),
            lte(transactions.date, endDate),
            type ? eq(transactions.type, type) : undefined,
          ),
        );
      return Number(row?.total ?? 0);
    },

    async create(input: NewTransaction) {
      const [row] = await db.insert(transactions).values(input).returning();
      if (!row) throw new Error('Failed to create transaction');
      return row;
    },

    async update(id, input) {
      const [row] = await db
        .update(transactions)
        .set(input)
        .where(eq(transactions.id, id))
        .returning();
      if (!row) throw new Error(`Transaction ${id} not found`);
      return row;
    },

    async delete(id) {
      await db.delete(transactions).where(eq(transactions.id, id));
    },
  };
}
