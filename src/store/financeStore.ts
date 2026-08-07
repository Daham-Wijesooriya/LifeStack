import { create } from 'zustand';

import { db } from '@/db/client';
import { createBudgetsRepository, createTransactionsRepository } from '@/db/repositories';
import type { Budget, Transaction } from '@/db/schema';
import { addMonthsISO, currentMonthISO, monthEndDateISO, monthStartDateISO, nowISO } from '@/lib/date';

const transactionsRepo = createTransactionsRepository(db);
const budgetsRepo = createBudgetsRepository(db);

// Covers the monthly trend chart; budget-vs-actual and the category pie
// chart only ever look at `currentMonth` within this window.
const TREND_MONTHS = 6;

export interface NewTransactionInput {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  note: string | null;
  date: string;
}

interface FinanceState {
  currentMonth: string;
  transactions: Transaction[];
  budgets: Budget[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
  loadMonth: (month?: string) => Promise<void>;
  createTransaction: (input: NewTransactionInput) => Promise<void>;
  updateTransaction: (id: number, input: NewTransactionInput) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
  setBudget: (category: string, monthlyLimit: number) => Promise<void>;
  deleteBudget: (id: number) => Promise<void>;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  currentMonth: currentMonthISO(),
  transactions: [],
  budgets: [],
  status: 'idle',
  error: null,

  // Mutations reload the whole window rather than patching local state —
  // unlike todos/sleep, a transaction can change *which* month it belongs
  // to (backdating), which would otherwise need to invalidate the trend
  // chart's per-month buckets by hand. Personal-scale data makes the
  // reload cheap enough that it's not worth that bookkeeping.
  async loadMonth(month) {
    const targetMonth = month ?? get().currentMonth;
    set({ status: 'loading', error: null, currentMonth: targetMonth });
    try {
      const rangeStartMonth = addMonthsISO(targetMonth, -(TREND_MONTHS - 1));
      const [transactions, budgets] = await Promise.all([
        transactionsRepo.getInRange(monthStartDateISO(rangeStartMonth), monthEndDateISO(targetMonth)),
        budgetsRepo.getForMonth(targetMonth),
      ]);
      set({ transactions, budgets, status: 'ready' });
    } catch (error) {
      set({ status: 'error', error: error instanceof Error ? error.message : String(error) });
    }
  },

  async createTransaction(input) {
    await transactionsRepo.create({ ...input, createdAt: nowISO() });
    await get().loadMonth();
  },

  async updateTransaction(id, input) {
    await transactionsRepo.update(id, input);
    await get().loadMonth();
  },

  async deleteTransaction(id) {
    await transactionsRepo.delete(id);
    await get().loadMonth();
  },

  async setBudget(category, monthlyLimit) {
    await budgetsRepo.upsertForMonth(category, get().currentMonth, monthlyLimit);
    await get().loadMonth();
  },

  async deleteBudget(id) {
    await budgetsRepo.delete(id);
    set((state) => ({ budgets: state.budgets.filter((budget) => budget.id !== id) }));
  },
}));
