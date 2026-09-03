import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StatCard } from '@/components/dashboard';
import { HabitFormSheet, HabitRow } from '@/components/habits';
import { EmptyState, Text } from '@/components/ui';
import { computeCompletionRate, computeHabitStreak, todayISO } from '@/lib/date';
import { useHabitsStore } from '@/store/habitsStore';
import { useTheme } from '@/theme/ThemeProvider';

// A shorter, more "how am I doing lately" window than the full-year heatmap —
// matches what a glance-able summary stat should describe.
const RATE_WINDOW_DAYS = 30;

export default function HabitsListScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { habits, logsByHabitId, status, error, loadHabits, createHabit } = useHabitsStore();
  const [formVisible, setFormVisible] = useState(false);

  useEffect(() => {
    void loadHabits();
  }, [loadHabits]);

  const summary = useMemo(() => {
    const today = todayISO();
    let doneToday = 0;
    let bestStreak = 0;
    let rateSum = 0;
    for (const habit of habits) {
      const completedDates = (logsByHabitId[habit.id] ?? []).filter((log) => log.completed).map((log) => log.date);
      if (completedDates.includes(today)) doneToday += 1;
      bestStreak = Math.max(bestStreak, computeHabitStreak(habit.frequencyType, habit.targetPerWeek, completedDates));
      rateSum += computeCompletionRate(completedDates, habit.frequencyType, RATE_WINDOW_DAYS, habit.targetPerWeek);
    }
    return {
      doneToday,
      bestStreak,
      avgRate: habits.length > 0 ? Math.round(rateSum / habits.length) : 0,
    };
  }, [habits, logsByHabitId]);

  if (status === 'loading' || status === 'idle') {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text color="secondary">Loading habits…</Text>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View className="flex-1 items-center justify-center bg-background px-xl">
        <Text color="danger">{error}</Text>
      </View>
    );
  }

  return (
    // No (tabs) screen gets a native header, so the safe-area top inset has
    // to be handled here explicitly — see app/(tabs)/index.tsx for the same
    // fix and why a flat pt-lg isn't enough on notched devices.
    <View className="flex-1 bg-background px-lg" style={{ paddingTop: insets.top + 16 }}>
      <FlatList
        data={habits}
        keyExtractor={(habit) => String(habit.id)}
        contentContainerClassName="gap-sm"
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="gap-md pb-md">
            <View>
              <Text variant="xl" weight="semibold">
                Habits
              </Text>
              <Text variant="sm" color="secondary">
                {habits.length > 0 ? `${summary.doneToday}/${habits.length} done today` : 'Build routines that stick'}
              </Text>
            </View>

            {habits.length > 0 ? (
              <View className="flex-row gap-sm">
                <StatCard
                  label="Today"
                  value={`${summary.doneToday}/${habits.length}`}
                  icon={<Ionicons name="checkmark-circle-outline" size={16} color={colors.primary} />}
                />
                <StatCard
                  label="Best streak"
                  value={summary.bestStreak > 0 ? String(summary.bestStreak) : '—'}
                  valueColor="success"
                  icon={<Ionicons name="flame-outline" size={16} color={colors.warning} />}
                />
                <StatCard
                  label="30-day rate"
                  value={`${summary.avgRate}%`}
                  icon={<Ionicons name="trending-up-outline" size={16} color={colors.success} />}
                />
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon={<Ionicons name="flame-outline" size={40} color={colors.textMuted} />}
            title="No habits yet"
            description="Add your first habit to start building streaks."
            actionLabel="Add habit"
            onAction={() => setFormVisible(true)}
          />
        }
        renderItem={({ item }) => {
          const logs = logsByHabitId[item.id] ?? [];
          const completedDates = logs.filter((log) => log.completed).map((log) => log.date);
          const streak = computeHabitStreak(item.frequencyType, item.targetPerWeek, completedDates);
          return <HabitRow habit={item} logs={logs} streak={streak} />;
        }}
      />

      <Pressable
        onPress={() => setFormVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="Add habit"
        className="absolute bottom-xl right-lg h-14 w-14 items-center justify-center rounded-full bg-primary active:opacity-80"
        style={{ bottom: insets.bottom + 24 }}
      >
        <Ionicons name="add" size={28} color={colors.primaryText} />
      </Pressable>

      <HabitFormSheet
        visible={formVisible}
        onClose={() => setFormVisible(false)}
        onSubmit={async (input) => {
          await createHabit(input);
        }}
      />
    </View>
  );
}
