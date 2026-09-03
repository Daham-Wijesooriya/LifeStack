import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';
import type { Habit, HabitLog } from '@/db/schema';
import { useHabitStats } from '@/hooks/useHabitStats';
import { todayISO } from '@/lib/date';
import { useHabitsStore } from '@/store/habitsStore';
import { useTheme } from '@/theme/ThemeProvider';
import { HabitHeatmap } from './HabitHeatmap';

export interface HabitRowProps {
  habit: Habit;
  logs: HabitLog[];
  streak: number;
}

export function HabitRow({ habit, logs, streak }: HabitRowProps) {
  const { colors } = useTheme();
  const toggleToday = useHabitsStore((state) => state.toggleToday);
  const completedToday = logs.some((log) => log.date === todayISO() && log.completed);
  const stats = useHabitStats(habit, logs);

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/habits/[id]', params: { id: String(habit.id) } })}
      className="flex-col gap-sm rounded-lg border border-border bg-surface p-md active:opacity-90"
    >
      <View className="flex-row items-center gap-sm">
        {/* Tinted badge (15% of the habit's own color) groups the icon visually instead of it floating loose next to the name. */}
        <View
          className="h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: `${habit.color}26` }}
        >
          <Text variant="lg">{habit.icon}</Text>
        </View>

        <View className="flex-1 gap-[3px]">
          <Text weight="semibold" variant="base">
            {habit.name}
          </Text>
          {streak > 0 ? (
            <View
              className="flex-row items-center gap-[3px] self-start rounded-full px-xs py-[1px]"
              style={{ backgroundColor: `${colors.warning}22` }}
            >
              <Ionicons name="flame" size={11} color={colors.warning} />
              <Text variant="xs" weight="medium" style={{ color: colors.warning }}>
                {streak} {habit.frequencyType === 'weekly' ? 'wk' : 'day'} streak
              </Text>
            </View>
          ) : (
            <Text variant="xs" color="muted">
              No streak yet
            </Text>
          )}
        </View>

        {/* Absorbs the tap so it toggles completion instead of navigating */}
        <Pressable
          onPress={() => toggleToday(habit.id)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: completedToday }}
          accessibilityLabel={`Mark ${habit.name} ${completedToday ? 'not done' : 'done'} today`}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full border-2"
          style={{ borderColor: habit.color, backgroundColor: completedToday ? habit.color : 'transparent' }}
        >
          {completedToday ? <Ionicons name="checkmark" size={18} color="#FFFFFF" /> : null}
        </Pressable>
      </View>

      <HabitHeatmap days={stats.heatmapDays} color={habit.color} />
    </Pressable>
  );
}
