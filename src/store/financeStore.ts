import { create } from 'zustand';

import { db } from '@/db/client';
import { createTransactionsRepository } from '@/db/repositories';
import type { Transaction } from '@/db/schema';
import { currentMonthISO, monthEndDateISO, monthStartDateISO, nowISO } from '@/lib/date';

const transactionsRepo = createTransactionsRepository(db);

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
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
  loadMonth: (month?: string) => Promise<void>;
  createTransaction: (input: NewTransactionInput) => Promise<void>;
  updateTransaction: (id: number, input: NewTransactionInput) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  currentMonth: currentMonthISO(),
  transactions: [],
  status: 'idle',
  error: null,

  async loadMonth(month) {
    const targetMonth = month ?? get().currentMonth;
    set({ status: 'loading', error: null, currentMonth: targetMonth });
    try {
      const transactions = await transactionsRepo.getInRange(
        monthStartDateISO(targetMonth),
        monthEndDateISO(targetMonth),
      );
      set({ transactions, status: 'ready' });
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
}));
