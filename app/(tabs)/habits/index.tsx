import { useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';

import { HabitFormSheet, HabitRow } from '@/components/habits';
import { Button, EmptyState, Text } from '@/components/ui';
import { computeHabitStreak } from '@/lib/date';
import { useHabitsStore } from '@/store/habitsStore';

export default function HabitsListScreen() {
  const { habits, logsByHabitId, status, error, loadHabits, createHabit } = useHabitsStore();
  const [formVisible, setFormVisible] = useState(false);

  useEffect(() => {
    void loadHabits();
  }, [loadHabits]);

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
    <View className="flex-1 bg-background px-lg pt-lg">
      {habits.length === 0 ? (
        <EmptyState
          title="No habits yet"
          description="Add your first habit to start building streaks."
          actionLabel="Add habit"
          onAction={() => setFormVisible(true)}
        />
      ) : (
        <FlatList
          data={habits}
          keyExtractor={(habit) => String(habit.id)}
          contentContainerClassName="gap-sm pb-2xl"
          renderItem={({ item }) => {
            const logs = logsByHabitId[item.id] ?? [];
            const completedDates = logs.filter((log) => log.completed).map((log) => log.date);
            const streak = computeHabitStreak(item.frequencyType, item.targetPerWeek, completedDates);
            return <HabitRow habit={item} logs={logs} streak={streak} />;
          }}
          ListFooterComponent={
            <Button variant="outline" onPress={() => setFormVisible(true)} className="mt-sm">
              + Add habit
            </Button>
          }
        />
      )}

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
