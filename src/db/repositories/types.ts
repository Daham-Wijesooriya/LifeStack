export type ID = number;

/**
 * Shared shape for the simple id-keyed CRUD tables (everything except
 * `settings`, which is key/value and has its own repository shape).
 * Domain repositories extend this with whatever domain-specific queries
 * their module actually needs (see sleep.ts, habits.ts, etc.) — this only
 * captures what's common across all of them.
 */
export interface CrudRepository<TSelect, TInsert, TUpdate = Partial<Omit<TInsert, 'id'>>> {
  getAll(): Promise<TSelect[]>;
  getById(id: ID): Promise<TSelect | undefined>;
  create(input: TInsert): Promise<TSelect>;
  update(id: ID, input: TUpdate): Promise<TSelect>;
  delete(id: ID): Promise<void>;
}
