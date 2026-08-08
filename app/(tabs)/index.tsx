import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HabitFormSheet } from '@/components/habits';
import { SleepLogFormSheet } from '@/components/sleep';
import { TodoFormSheet } from '@/components/todos';
import { TransactionFormSheet } from '@/components/finance';
import { ActivityStrip, QuickAddSheet, StatCard, type QuickAddKind } from '@/components/dashboard';
import { Card, Text } from '@/components/ui';
import { formatCurrency } from '@/lib/currency';
import { formatDurationMinutes, lastNDaysISO, todayISO } from '@/lib/date';
import { useFinanceStore } from '@/store/financeStore';
import { useHabitsStore } from '@/store/habitsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useSleepStore } from '@/store/sleepStore';
import { useTodosStore } from '@/store/todosStore';
import { useTheme } from '@/theme/ThemeProvider';

export default function DashboardScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const habitsState = useHabitsStore();
  const todosState = useTodosStore();
  const sleepState = useSleepStore();
  const financeState = useFinanceStore();
  const currency = useSettingsStore((state) => state.currency);

  const [quickAddVisible, setQuickAddVisible] = useState(false);
  const [activeForm, setActiveForm] = useState<QuickAddKind | null>(null);

  useEffect(() => {
    void habitsState.loadHabits();
    void todosState.loadTodos();
    void sleepState.loadLogs();
    void financeState.loadMonth();
    // Each store's own load action is stable (defined once in create()), so
    // this only needs to run on mount — matching every other screen's
    // load-on-mount pattern, just fanned out to four stores instead of one.
  }, []);

  const today = todayISO();

  const todaysSleep = sleepState.logs.find((log) => log.date === today);
  const habitsDoneToday = habitsState.habits.filter((habit) =>
    (habitsState.logsByHabitId[habit.id] ?? []).some((log) => log.date === today && log.completed),
  ).length;
  const todosPending = todosState.todos.filter((todo) => !todo.completed).length;
  const todaysSpend = financeState.transactions
    .filter((t) => t.date === today && t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const activityDays = useMemo(() => {
    const days = lastNDaysISO(7);
    return days.map((date) => {
      const completedCount = habitsState.habits.filter((habit) =>
        (habitsState.logsByHabitId[habit.id] ?? []).some((log) => log.date === date && log.completed),
      ).length;
      return {
        date,
        label: format(parseISO(date), 'EEEEE'),
        ratio: habitsState.habits.length > 0 ? completedCount / habitsState.habits.length : 0,
      };
    });
  }, [habitsState.habits, habitsState.logsByHabitId]);

  const isLoading =
    habitsState.status === 'idle' ||
    habitsState.status === 'loading' ||
    todosState.status === 'idle' ||
    todosState.status === 'loading' ||
    sleepState.status === 'idle' ||
    sleepState.status === 'loading' ||
    financeState.status === 'idle' ||
    financeState.status === 'loading';

  function handleQuickAddSelect(kind: QuickAddKind) {
    setQuickAddVisible(false);
    setActiveForm(kind);
  }

  return (
    <View className="flex-1 bg-background">
      {/*
       * No screen in the (tabs) group gets a native header (headerShown is
       * false at both the Tabs and root-Stack level), so this row has to
       * account for the safe-area top inset itself — a flat `pt-lg` would
       * put the gear icon under the status bar / notch on real devices.
       */}
      <View className="flex-row items-center justify-between px-lg" style={{ paddingTop: insets.top + 16 }}>
        <Text variant="xl" weight="semibold">
          Dashboard
        </Text>
        <Pressable
          onPress={() => router.push('/settings')}
          accessibilityRole="button"
          accessibilityLabel="Settings"
          hitSlop={8}
        >
          <Ionicons name="settings-outline" size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text color="secondary">Loading…</Text>
        </View>
      ) : (
        <View className="flex-1 gap-md px-lg pt-lg">
          <View className="flex-row gap-md">
            <StatCard value={todaysSleep ? formatDurationMinutes(todaysSleep.durationMinutes) : '—'} label="sleep" />
            <StatCard value={`${habitsDoneToday}/${habitsState.habits.length}`} label="habits" />
          </View>
          <View className="flex-row gap-md">
            <StatCard value={String(todosPending)} label="todos pending" />
            <StatCard value={formatCurrency(todaysSpend, currency)} label="spent today" valueColor="danger" />
          </View>

          <Card className="gap-sm">
            <Text weight="semibold">Last 7 days</Text>
            <ActivityStrip days={activityDays} />
          </Card>
        </View>
      )}

      <Pressable
        onPress={() => setQuickAddVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="Quick add"
        className="absolute bottom-xl right-lg h-14 w-14 items-center justify-center rounded-full bg-primary active:opacity-80"
        style={{ bottom: insets.bottom + 24 }}
      >
        <Ionicons name="add" size={28} color={colors.primaryText} />
      </Pressable>

      <QuickAddSheet visible={quickAddVisible} onClose={() => setQuickAddVisible(false)} onSelect={handleQuickAddSelect} />

      <HabitFormSheet
        visible={activeForm === 'habit'}
        onClose={() => setActiveForm(null)}
        onSubmit={async (input) => {
          await habitsState.createHabit(input);
        }}
      />
      <TodoFormSheet
        visible={activeForm === 'todo'}
        onClose={() => setActiveForm(null)}
        onSubmit={async (input) => {
          await todosState.createTodo(input);
        }}
      />
      <SleepLogFormSheet
        visible={activeForm === 'sleep'}
        onClose={() => setActiveForm(null)}
        onSubmit={async (input) => {
          await sleepState.createLog(input);
        }}
      />
      <TransactionFormSheet
        visible={activeForm === 'transaction'}
        onClose={() => setActiveForm(null)}
        onSubmit={async (input) => {
          await financeState.createTransaction(input);
        }}
      />
    </View>
  );
}
