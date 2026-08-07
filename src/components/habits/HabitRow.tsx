import { router } from 'expo-router';
import { Pressable, Text as RNText, View } from 'react-native';

import { Text } from '@/components/ui';
import type { Habit, HabitLog } from '@/db/schema';
import { todayISO } from '@/lib/date';
import { useHabitsStore } from '@/store/habitsStore';

export interface HabitRowProps {
  habit: Habit;
  logs: HabitLog[];
  streak: number;
}

export function HabitRow({ habit, logs, streak }: HabitRowProps) {
  const toggleToday = useHabitsStore((state) => state.toggleToday);
  const completedToday = logs.some((log) => log.date === todayISO() && log.completed);

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/habits/[id]', params: { id: String(habit.id) } })}
      className="flex-row items-center gap-md rounded-lg border border-border bg-surface p-md active:opacity-80"
    >
      <Text variant="xl">{habit.icon}</Text>
      <View className="flex-1 gap-xs">
        <Text weight="medium">{habit.name}</Text>
        <Text variant="sm" color="secondary">
          {streak > 0 ? `🔥 ${streak} ${habit.frequencyType === 'weekly' ? 'week' : 'day'} streak` : 'No streak yet'}
        </Text>
      </View>
      {/* Absorbs the tap so it toggles completion instead of navigating (inner Pressable claims the touch responder). */}
      <Pressable
        onPress={() => toggleToday(habit.id)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: completedToday }}
        accessibilityLabel={`Mark ${habit.name} ${completedToday ? 'not done' : 'done'} today`}
        className="h-8 w-8 items-center justify-center rounded-full border-2"
        style={{ borderColor: habit.color, backgroundColor: completedToday ? habit.color : 'transparent' }}
      >
        {completedToday ? <RNText style={{ color: '#FFFFFF' }}>✓</RNText> : null}
      </Pressable>
    </Pressable>
  );
}
