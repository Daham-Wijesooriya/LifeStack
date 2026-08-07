import { View } from 'react-native';

import type { HabitHeatmapDay } from '@/hooks/useHabitStats';

export interface HabitHeatmapProps {
  days: HabitHeatmapDay[];
  color: string;
}

const COLUMNS = 7;

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/**
 * A simple wrapped grid, not a GitHub-style week-aligned calendar (that
 * needs padding cells to align each column to a real Monday, which isn't
 * worth the complexity here) — oldest day top-left, newest bottom-right.
 */
export function HabitHeatmap({ days, color }: HabitHeatmapProps) {
  const rows = chunk(days, COLUMNS);
  return (
    <View className="gap-1">
      {rows.map((row) => (
        <View key={row[0]?.date} className="flex-row gap-1">
          {row.map((day) => (
            <View
              key={day.date}
              className="h-4 w-4 rounded-sm border border-border"
              style={{ backgroundColor: day.completed ? color : undefined }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}
