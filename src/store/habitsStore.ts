import { create } from 'zustand';

import { db } from '@/db/client';
import { createHabitsRepository } from '@/db/repositories';
import type { Habit, HabitLog } from '@/db/schema';
import { nowISO, todayISO } from '@/lib/date';

const repo = createHabitsRepository(db);

export interface NewHabitInput {
  name: string;
  icon: string;
  color: string;
  frequencyType: 'daily' | 'weekly';
  targetPerWeek: number | null;
}

interface HabitsState {
  habits: Habit[];
  logsByHabitId: Record<number, HabitLog[]>;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
  loadHabits: () => Promise<void>;
  createHabit: (input: NewHabitInput) => Promise<void>;
  updateHabit: (id: number, input: NewHabitInput) => Promise<void>;
  archiveHabit: (id: number) => Promise<void>;
  deleteHabit: (id: number) => Promise<void>;
  toggleToday: (habitId: number) => Promise<void>;
}

export const useHabitsStore = create<HabitsState>((set, get) => ({
  habits: [],
  logsByHabitId: {},
  status: 'idle',
  error: null,

  // Habit counts are personal-scale (dozens, not thousands), so reloading
  // everything after a mutation trades a little extra work for not having
  // to hand-maintain derived state in three different places.
  async loadHabits() {
    set({ status: 'loading', error: null });
    try {
      const habits = await repo.getAll();
      const logEntries = await Promise.all(
        habits.map(async (habit) => [habit.id, await repo.getLogsForHabit(habit.id)] as const),
      );
      set({ habits, logsByHabitId: Object.fromEntries(logEntries), status: 'ready' });
    } catch (error) {
      set({ status: 'error', error: error instanceof Error ? error.message : String(error) });
    }
  },

  async createHabit(input) {
    await repo.create({ ...input, createdAt: nowISO(), archived: false });
    await get().loadHabits();
  },

  async updateHabit(id, input) {
    await repo.update(id, input);
    await get().loadHabits();
  },

  async archiveHabit(id) {
    await repo.update(id, { archived: true });
    await get().loadHabits();
  },

  async deleteHabit(id) {
    await repo.delete(id);
    set((state) => {
      const nextLogs = { ...state.logsByHabitId };
      delete nextLogs[id];
      return { habits: state.habits.filter((habit) => habit.id !== id), logsByHabitId: nextLogs };
    });
  },

  async toggleToday(habitId) {
    const today = todayISO();
    const logs = get().logsByHabitId[habitId] ?? [];
    const existing = logs.find((log) => log.date === today);
    const nextCompleted = !(existing?.completed ?? false);
    const updatedLog = await repo.setLogCompleted(habitId, today, nextCompleted);
    set((state) => {
      const currentLogs = state.logsByHabitId[habitId] ?? [];
      const withoutToday = currentLogs.filter((log) => log.date !== today);
      return {
        logsByHabitId: {
          ...state.logsByHabitId,
          [habitId]: [...withoutToday, updatedLog].sort((a, b) => a.date.localeCompare(b.date)),
        },
      };
    });
  },
}));
