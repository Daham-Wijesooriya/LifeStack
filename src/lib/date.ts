import { addDays, format, parseISO, startOfWeek } from 'date-fns';

/**
 * Local calendar day as YYYY-MM-DD. Never derive this from
 * `Date#toISOString()` — that's UTC, and can land on the wrong day near
 * midnight depending on the device's timezone.
 */
export function formatISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function todayISO(): string {
  return formatISODate(new Date());
}

/** Full-instant timestamp (created_at, bedtime, wake_time, ...) — a real instant, so UTC is correct and simplest. */
export function nowISO(): string {
  return new Date().toISOString();
}

export function addDaysISO(dateISO: string, days: number): string {
  return formatISODate(addDays(parseISO(dateISO), days));
}

/** The last `count` days as YYYY-MM-DD, oldest first, ending at `endDateISO` (defaults to today). */
export function lastNDaysISO(count: number, endDateISO: string = todayISO()): string[] {
  const end = parseISO(endDateISO);
  return Array.from({ length: count }, (_, i) => formatISODate(addDays(end, i - (count - 1))));
}

/** Monday-start week, matching target_per_week's "N times a week" framing. */
export function startOfWeekISO(dateISO: string): string {
  return formatISODate(startOfWeek(parseISO(dateISO), { weekStartsOn: 1 }));
}

/**
 * Current streak of consecutive completed days. If today isn't completed
 * yet, counting starts from yesterday instead — so the streak doesn't drop
 * to zero mid-day before you've had a chance to check in.
 */
export function computeDailyStreak(completedDates: readonly string[], today: string = todayISO()): number {
  const completed = new Set(completedDates);
  let streak = 0;
  let cursor = completed.has(today) ? today : addDaysISO(today, -1);
  while (completed.has(cursor)) {
    streak += 1;
    cursor = addDaysISO(cursor, -1);
  }
  return streak;
}

/**
 * Current streak in consecutive weeks that met `targetPerWeek` completions.
 * The in-progress week only counts once it has already hit target;
 * otherwise counting starts from the most recently *completed* week.
 */
export function computeWeeklyStreak(
  completedDates: readonly string[],
  targetPerWeek: number,
  today: string = todayISO(),
): number {
  const countsByWeek = new Map<string, number>();
  for (const date of completedDates) {
    const week = startOfWeekISO(date);
    countsByWeek.set(week, (countsByWeek.get(week) ?? 0) + 1);
  }

  let streak = 0;
  let weekCursor = startOfWeekISO(today);
  if ((countsByWeek.get(weekCursor) ?? 0) < targetPerWeek) {
    weekCursor = addDaysISO(weekCursor, -7);
  }
  while ((countsByWeek.get(weekCursor) ?? 0) >= targetPerWeek) {
    streak += 1;
    weekCursor = addDaysISO(weekCursor, -7);
  }
  return streak;
}

/** Picks daily vs. weekly streak math based on the habit's frequency type. */
export function computeHabitStreak(
  frequencyType: 'daily' | 'weekly',
  targetPerWeek: number | null,
  completedDates: readonly string[],
  today: string = todayISO(),
): number {
  return frequencyType === 'weekly'
    ? computeWeeklyStreak(completedDates, targetPerWeek ?? 1, today)
    : computeDailyStreak(completedDates, today);
}

/**
 * Percentage (0-100) of the trailing `windowDays` completed: for daily
 * habits, the fraction of days done; for weekly habits, the average of each
 * week's (completions / target), capped at 100% per week.
 */
export function computeCompletionRate(
  completedDates: readonly string[],
  frequencyType: 'daily' | 'weekly',
  windowDays: number,
  targetPerWeek: number | null,
  today: string = todayISO(),
): number {
  const completed = new Set(completedDates);
  const days = lastNDaysISO(windowDays, today);

  if (frequencyType === 'daily') {
    const done = days.filter((day) => completed.has(day)).length;
    return Math.round((done / days.length) * 100);
  }

  const target = targetPerWeek ?? 1;
  const countsByWeek = new Map<string, number>();
  for (const day of days) {
    const week = startOfWeekISO(day);
    countsByWeek.set(week, (countsByWeek.get(week) ?? 0) + (completed.has(day) ? 1 : 0));
  }
  const rates = Array.from(countsByWeek.values(), (count) => Math.min(count / target, 1));
  const average = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
  return Math.round(average * 100);
}
