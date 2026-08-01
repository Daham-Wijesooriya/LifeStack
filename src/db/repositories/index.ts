import type { Database } from '../client';
import { createBudgetsRepository } from './budgets';
import { createHabitsRepository } from './habits';
import { createSettingsRepository } from './settings';
import { createSleepRepository } from './sleep';
import { createTodosRepository } from './todos';
import { createTransactionsRepository } from './transactions';

export * from './types';
export * from './sleep';
export * from './habits';
export * from './todos';
export * from './transactions';
export * from './budgets';
export * from './settings';

export function createRepositories(db: Database) {
  return {
    sleep: createSleepRepository(db),
    habits: createHabitsRepository(db),
    todos: createTodosRepository(db),
    transactions: createTransactionsRepository(db),
    budgets: createBudgetsRepository(db),
    settings: createSettingsRepository(db),
  };
}

export type Repositories = ReturnType<typeof createRepositories>;
