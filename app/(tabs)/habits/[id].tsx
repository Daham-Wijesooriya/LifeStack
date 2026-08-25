import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HabitFormSheet, HabitHeatmap } from '@/components/habits';
import { Button, Card, Text } from '@/components/ui';
import { useHabitStats } from '@/hooks/useHabitStats';
import { useHabitsStore } from '@/store/habitsStore';
import { useTheme } from '@/theme/ThemeProvider';

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const habitId = Number(id);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const habit = useHabitsStore((state) => state.habits.find((h) => h.id === habitId));
  const logs = useHabitsStore((state) => state.logsByHabitId[habitId] ?? []);
  const updateHabit = useHabitsStore((state) => state.updateHabit);
  const deleteHabit = useHabitsStore((state) => state.deleteHabit);

  const [editVisible, setEditVisible] = useState(false);
  const stats = useHabitStats(habit, logs);

  if (!habit) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-xl">
        <Text color="secondary">Habit not found.</Text>
      </View>
    );
  }

  function confirmDelete() {
    if (!habit) return;
    Alert.alert('Delete habit?', `This removes "${habit.name}" and all of its history. This can't be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteHabit(habit.id);
          router.back();
        },
      },
    ]);
  }

  const completedLogsCount = logs.filter((log) => log.completed).length;

  return (
    <>
      {/*
       * Overrides the stack's static "Habit" title (see _layout.tsx) with
       * this habit's own name, and adds an Edit action in its place — the
       * old in-body Archive button is gone entirely, Edit/Delete cover the
       * management actions this screen needs.
       */}
      <Stack.Screen
        options={{
          title: habit.name,
          headerRight: () => (
            <Pressable
              onPress={() => setEditVisible(true)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Edit habit"
              className="h-9 w-9 items-center justify-center active:opacity-70"
            >
              <Ionicons name="create-outline" size={22} color={colors.textPrimary} />
            </Pressable>
          ),
        }}
      />
      <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-lg p-lg" contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        {/*
         * LinearGradient isn't a NativeWind-registered component, so
         * `className` has no effect on it — it only paints the
         * absolute-fill background here, with the bordered/padded card
         * layout living on a plain View stacked on top.
         */}
        <View className="overflow-hidden rounded-3xl border border-border">
          <LinearGradient
            colors={[`${habit.color}33`, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View className="gap-md p-lg">
            <View className="flex-row items-center gap-md">
              <View
                className="h-16 w-16 items-center justify-center rounded-2xl"
                style={{ backgroundColor: `${habit.color}22` }}
              >
                <Text variant="2xl">{habit.icon}</Text>
              </View>
              <View className="flex-1 gap-xs">
                <Text variant="xl" weight="bold">
                  {habit.name}
                </Text>
                <View className="flex-row items-center gap-xs self-start rounded-full bg-surface px-sm py-[2px]">
                  <Ionicons name="repeat-outline" size={12} color={colors.textSecondary} />
                  <Text variant="xs" weight="medium" color="secondary">
                    {habit.frequencyType === 'weekly' ? `${habit.targetPerWeek}× per week` : 'Every day'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View className="flex-row gap-md">
          <Card className="flex-1 gap-xs">
            <View className="flex-row items-center gap-xs">
              <Ionicons name="flame" size={16} color={habit.color} />
              <Text variant="sm" color="secondary">
                Streak
              </Text>
            </View>
            <Text variant="2xl" weight="bold">
              {stats.streak}
              <Text variant="sm" color="secondary" weight="medium">
                {' '}
                {habit.frequencyType === 'weekly' ? 'wk' : 'day'}
              </Text>
            </Text>
          </Card>
          <Card className="flex-1 gap-xs">
            <View className="flex-row items-center gap-xs">
              <Ionicons name="stats-chart" size={16} color={colors.info} />
              <Text variant="sm" color="secondary">
                Consistency
              </Text>
            </View>
            <Text variant="2xl" weight="bold">
              {stats.completionRate}
              <Text variant="sm" color="secondary" weight="medium">
                %
              </Text>
            </Text>
          </Card>
          <Card className="flex-1 gap-xs">
            <View className="flex-row items-center gap-xs">
              <Ionicons name="checkmark-done" size={16} color={colors.success} />
              <Text variant="sm" color="secondary">
                Total
              </Text>
            </View>
            <Text variant="2xl" weight="bold">
              {completedLogsCount}
            </Text>
          </Card>
        </View>

        <Card className="gap-sm">
          <Text weight="semibold">Activity — last 52 weeks</Text>
          <HabitHeatmap days={stats.heatmapDays} color={habit.color} />
        </Card>

        <Button
          variant="dangerOutline"
          onPress={confirmDelete}
          leftIcon={<Ionicons name="trash-outline" size={16} color={colors.danger} />}
        >
          Delete habit
        </Button>
      </ScrollView>

      <HabitFormSheet
        visible={editVisible}
        onClose={() => setEditVisible(false)}
        initialHabit={habit}
        onSubmit={async (input) => {
          await updateHabit(habit.id, input);
        }}
      />
    </>
  );
}
