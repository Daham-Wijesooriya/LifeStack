import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { HabitFormSheet, HabitHeatmap } from '@/components/habits';
import { Button, Text } from '@/components/ui';
import { useHabitStats } from '@/hooks/useHabitStats';
import { useHabitsStore } from '@/store/habitsStore';

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const habitId = Number(id);

  const habit = useHabitsStore((state) => state.habits.find((h) => h.id === habitId));
  const logs = useHabitsStore((state) => state.logsByHabitId[habitId] ?? []);
  const updateHabit = useHabitsStore((state) => state.updateHabit);
  const archiveHabit = useHabitsStore((state) => state.archiveHabit);
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

  async function handleArchive() {
    if (!habit) return;
    await archiveHabit(habit.id);
    router.back();
  }

  return (
    <View className="flex-1 gap-lg bg-background p-lg">
      <View className="flex-row items-center gap-md">
        <Text variant="2xl">{habit.icon}</Text>
        <View className="flex-1">
          <Text variant="xl" weight="semibold">
            {habit.name}
          </Text>
          <Text variant="sm" color="secondary">
            {habit.frequencyType === 'weekly' ? `${habit.targetPerWeek}×/week` : 'Daily'}
          </Text>
        </View>
      </View>

      <View className="flex-row gap-xl">
        <View>
          <Text variant="2xl" weight="bold">
            {stats.streak}
          </Text>
          <Text variant="sm" color="secondary">
            {habit.frequencyType === 'weekly' ? 'week streak' : 'day streak'}
          </Text>
        </View>
        <View>
          <Text variant="2xl" weight="bold">
            {stats.completionRate}%
          </Text>
          <Text variant="sm" color="secondary">
            last 52 weeks
          </Text>
        </View>
      </View>

      <View className="gap-sm">
        <Text variant="sm" weight="medium" color="secondary">
          Last 52 weeks
        </Text>
        <HabitHeatmap days={stats.heatmapDays} color={habit.color} />
      </View>

      <View className="mt-auto gap-sm">
        <Button variant="outline" onPress={() => setEditVisible(true)}>
          Edit
        </Button>
        <Button variant="secondary" onPress={handleArchive}>
          Archive
        </Button>
        <Button variant="danger" onPress={confirmDelete}>
          Delete
        </Button>
      </View>

      <HabitFormSheet
        visible={editVisible}
        onClose={() => setEditVisible(false)}
        initialHabit={habit}
        onSubmit={async (input) => {
          await updateHabit(habit.id, input);
        }}
      />
    </View>
  );
}
