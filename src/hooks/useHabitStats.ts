import { useMemo } from 'react';

import type { Habit, HabitLog } from '@/db/schema';
import { computeCompletionRate, computeHabitStreak, lastNDaysISO } from '@/lib/date';

// 52 weeks (1 year) — matches the heatmap grid (7 columns × 52 weeks) so the
// completion percentage shown alongside it describes the exact same window.
const STATS_WINDOW_DAYS = 364;

export interface HabitHeatmapDay {
  date: string;
  completed: boolean;
  isPlaceholder?: boolean;
}

export interface HabitStats {
  streak: number;
  completionRate: number;
  heatmapDays: HabitHeatmapDay[];
}

/**
 * Derives streak/completion/heatmap data from already-loaded logs — no
 * fetching here, see useHabitsStore. `habit` may be undefined for a beat
 * while a detail screen's route param hasn't resolved yet; callers don't
 * need to special-case that themselves.
 */
export function useHabitStats(habit: Habit | undefined, logs: HabitLog[]): HabitStats {
  return useMemo(() => {
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - (STATS_WINDOW_DAYS - 1));

    // Find the Sunday of the week of startDate
    const startDayOfWeek = startDate.getDay();
    const calendarStart = new Date(startDate);
    calendarStart.setDate(startDate.getDate() - startDayOfWeek);

    // Find the Saturday of the week of today
    const endDayOfWeek = today.getDay();
    const calendarEnd = new Date(today);
    calendarEnd.setDate(today.getDate() + (6 - endDayOfWeek));

    const getHeatmapDays = (completedSet: Set<string>) => {
      const days: HabitHeatmapDay[] = [];
      const cursor = new Date(calendarStart);
      
      const startISO = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
      const todayISOStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      while (cursor <= calendarEnd) {
        const yyyy = cursor.getFullYear();
        const mm = String(cursor.getMonth() + 1).padStart(2, '0');
        const dd = String(cursor.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;

        const isPlaceholder = dateStr < startISO || dateStr > todayISOStr;

        days.push({
          date: dateStr,
          completed: !isPlaceholder && completedSet.has(dateStr),
          isPlaceholder,
        });

        cursor.setDate(cursor.getDate() + 1);
      }
      return days;
    };

    if (!habit) {
      return { streak: 0, completionRate: 0, heatmapDays: getHeatmapDays(new Set()) };
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
      heatmapDays: getHeatmapDays(completedSet),
    };
  }, [habit, logs]);
}
