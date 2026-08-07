import { useMemo } from 'react';

import type { Habit, HabitLog } from '@/db/schema';
import { computeCompletionRate, computeHabitStreak, lastNDaysISO } from '@/lib/date';

// 12 weeks — matches the heatmap grid (7 columns × 12 rows) so the
// completion percentage shown alongside it describes the exact same window.
const STATS_WINDOW_DAYS = 84;

export interface HabitHeatmapDay {
  date: string;
  completed: boolean;
}

export interface HabitStats {
  streak: number;
  completionRate: number;
  heatmapDays: HabitHeatmapDay[];
}

const EMPTY_HEATMAP: HabitHeatmapDay[] = lastNDaysISO(STATS_WINDOW_DAYS).map((date) => ({
  date,
  completed: false,
}));

/**
 * Derives streak/completion/heatmap data from already-loaded logs — no
 * fetching here, see useHabitsStore. `habit` may be undefined for a beat
 * while a detail screen's route param hasn't resolved yet; callers don't
 * need to special-case that themselves.
 */
export function useHabitStats(habit: Habit | undefined, logs: HabitLog[]): HabitStats {
  return useMemo(() => {
    if (!habit) {
      return { streak: 0, completionRate: 0, heatmapDays: EMPTY_HEATMAP };
    }

    const completedDates = logs.filter((log) => log.completed).map((log) => log.date);
    const completedSet = new Set(completedDates);

    return {
      streak: computeHabitStreak(habit.frequencyType, habit.targetPerWeek, completedDates),
      completionRate: computeCompletionRate(
        completedDates,
        habit.frequencyType,
        STATS_WINDOW_DAYS,
        habit.targetPerWeek,
      ),
      heatmapDays: lastNDaysISO(STATS_WINDOW_DAYS).map((date) => ({
        date,
        completed: completedSet.has(date),
      })),
    };
  }, [habit, logs]);
}
