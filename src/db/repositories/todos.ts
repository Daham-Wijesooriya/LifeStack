import { count, desc, eq } from 'drizzle-orm';

import type { Database } from '../client';
import { type NewTodo, type Todo, todos } from '../schema';
import type { CrudRepository, ID } from './types';

export interface TodosRepository extends CrudRepository<Todo, NewTodo> {
  /** Pending vs completed, for the Todos screen filter. */
  getByStatus(completed: boolean): Promise<Todo[]>;
  /** For the dashboard's "todos pending" count. */
  getPendingCount(): Promise<number>;
}

export function createTodosRepository(db: Database): TodosRepository {
  return {
    async getAll() {
      return db.select().from(todos).orderBy(desc(todos.createdAt));
    },

    async getById(id: ID) {
      return db.query.todos.findFirst({ where: eq(todos.id, id) });
    },

    async getByStatus(completed: boolean) {
      return db
        .select()
        .from(todos)
        .where(eq(todos.completed, completed))
        .orderBy(desc(todos.createdAt));
    },

    async getPendingCount() {
      const [row] = await db
        .select({ value: count() })
        .from(todos)
        .where(eq(todos.completed, false));
      return row?.value ?? 0;
    },

    async create(input: NewTodo) {
      const [row] = await db.insert(todos).values(input).returning();
      if (!row) throw new Error('Failed to create todo');
      return row;
    },

    async update(id, input) {
      const [row] = await db.update(todos).set(input).where(eq(todos.id, id)).returning();
      if (!row) throw new Error(`Todo ${id} not found`);
      return row;
    },

    async delete(id) {
      await db.delete(todos).where(eq(todos.id, id));
    },
  };
}
