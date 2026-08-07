import { create } from 'zustand';

import { db } from '@/db/client';
import { createSleepRepository } from '@/db/repositories';
import type { SleepLog } from '@/db/schema';
import { addDaysISO, todayISO } from '@/lib/date';

const repo = createSleepRepository(db);

// Covers both the 7-day and 30-day chart views from a single load.
const LOAD_WINDOW_DAYS = 30;

export interface NewSleepLogInput {
  /** YYYY-MM-DD — the night's wake date, which the log is attributed to. */
  date: string;
  bedtime: string;
  wakeTime: string;
  durationMinutes: number;
  quality: number;
  notes: string | null;
}

interface SleepState {
  logs: SleepLog[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
  loadLogs: () => Promise<void>;
  createLog: (input: NewSleepLogInput) => Promise<void>;
  updateLog: (id: number, input: NewSleepLogInput) => Promise<void>;
  deleteLog: (id: number) => Promise<void>;
}

export const useSleepStore = create<SleepState>((set) => ({
  logs: [],
  status: 'idle',
  error: null,

  async loadLogs() {
    set({ status: 'loading', error: null });
    try {
      const logs = await repo.getInRange(addDaysISO(todayISO(), -(LOAD_WINDOW_DAYS - 1)), todayISO());
      set({ logs, status: 'ready' });
    } catch (error) {
      set({ status: 'error', error: error instanceof Error ? error.message : String(error) });
    }
  },

  async createLog(input) {
    const created = await repo.create(input);
    set((state) => ({ logs: [created, ...state.logs].sort((a, b) => b.date.localeCompare(a.date)) }));
  },

  async updateLog(id, input) {
    const updated = await repo.update(id, input);
    set((state) => ({ logs: state.logs.map((log) => (log.id === id ? updated : log)) }));
  },

  async deleteLog(id) {
    await repo.delete(id);
    set((state) => ({ logs: state.logs.filter((log) => log.id !== id) }));
  },
}));
