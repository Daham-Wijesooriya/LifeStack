import { router } from 'expo-router';
import { Pressable, Text as RNText, View } from 'react-native';

import { Text } from '@/components/ui';
import type { Habit, HabitLog } from '@/db/schema';
import { useHabitStats } from '@/hooks/useHabitStats';
import { todayISO } from '@/lib/date';
import { useHabitsStore } from '@/store/habitsStore';
import { HabitHeatmap } from './HabitHeatmap';

export interface HabitRowProps {
  habit: Habit;
  logs: HabitLog[];
  streak: number;
}

export function HabitRow({ habit, logs, streak }: HabitRowProps) {
  const toggleToday = useHabitsStore((state) => state.toggleToday);
  const completedToday = logs.some((log) => log.date === todayISO() && log.completed);
  const stats = useHabitStats(habit, logs);

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/habits/[id]', params: { id: String(habit.id) } })}
      className="flex-col gap-xs rounded-lg border border-border bg-surface px-md py-sm active:opacity-95"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-sm flex-1">
          <Text variant="lg">{habit.icon}</Text>
          <View className="flex-1">
            <Text weight="medium" variant="base">{habit.name}</Text>
            <Text variant="xs" color="secondary">
              {streak > 0 ? `🔥 ${streak} ${habit.frequencyType === 'weekly' ? 'w' : 'd'}` : 'No streak'}
            </Text>
          </View>
        </View>

        {/* Absorbs the tap so it toggles completion instead of navigating */}
        <Pressable
          onPress={() => toggleToday(habit.id)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: completedToday }}
          accessibilityLabel={`Mark ${habit.name} ${completedToday ? 'not done' : 'done'} today`}
          className="h-7 w-7 items-center justify-center rounded-full border-2"
          style={{ borderColor: habit.color, backgroundColor: completedToday ? habit.color : 'transparent' }}
        >
          {completedToday ? <RNText style={{ color: '#FFFFFF', fontSize: 12 }}>✓</RNText> : null}
        </Pressable>
      </View>

      <View className="pt-xs w-full">
        <HabitHeatmap days={stats.heatmapDays} color={habit.color} />
      </View>
    </Pressable>
  );
}
