import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HabitFormSheet } from '@/components/habits';
import { SleepLogFormSheet } from '@/components/sleep';
import { TodoFormSheet } from '@/components/todos';
import { TransactionFormSheet } from '@/components/finance';
import { ActivityStrip, DayScoreCard, QuickAddSheet, StatCard, UpcomingTimeline, type QuickAddKind } from '@/components/dashboard';
import { Card, Text } from '@/components/ui';
import { formatCurrency } from '@/lib/currency';
import { formatDurationMinutes, lastNDaysISO, todayISO } from '@/lib/date';
import { useFinanceStore } from '@/store/financeStore';
import { useHabitsStore } from '@/store/habitsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useSleepStore } from '@/store/sleepStore';
import { useTodosStore } from '@/store/todosStore';
import { useTheme } from '@/theme/ThemeProvider';

function greeting(hour: number): string {
  if (hour < 5) return 'Still up?';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Winding down';
}

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
  const now = useMemo(() => new Date(), []);

  const todaysSleep = sleepState.logs.find((log) => log.date === today);
  const habitsDoneToday = habitsState.habits.filter((habit) =>
    (habitsState.logsByHabitId[habit.id] ?? []).some((log) => log.date === today && log.completed),
  ).length;
  const todosDueToday = todosState.todos.filter((todo) => todo.dueDate === today);
  const todosDoneToday = todosDueToday.filter((todo) => todo.completed).length;
  const todosPending = todosState.todos.filter((todo) => !todo.completed).length;
  const overdueTodos = todosState.todos.filter(
    (todo) => !todo.completed && !!todo.dueDate && todo.dueDate < today,
  ).length;
  const todaysSpend = financeState.transactions
    .filter((t) => t.date === today && t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const todaysTimeline = useMemo(
    () =>
      todosState.todos
        .filter((todo) => todo.dueDate === today && todo.startTime && todo.endTime)
        .sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? '')),
    [todosState.todos, today],
  );

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

  const weeklyAvgPct =
    activityDays.length > 0 ? Math.round((activityDays.reduce((sum, d) => sum + d.ratio, 0) / activityDays.length) * 100) : 0;

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

  function goToTimeBoxing() {
    router.push('/todos');
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
        <View>
          <Text variant="xl" weight="semibold">
            {greeting(now.getHours())}
          </Text>
          <Text variant="sm" color="secondary">
            {format(now, 'EEEE, MMMM d')}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/settings')}
          accessibilityRole="button"
          accessibilityLabel="Settings"
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full bg-surface-alt active:opacity-80"
        >
          <Ionicons name="settings-outline" size={20} color={colors.textPrimary} />
        </Pressable>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text color="secondary">Loading…</Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-md px-lg pt-lg"
          contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
          showsVerticalScrollIndicator={false}
        >
          <DayScoreCard
            items={[
              {
                key: 'habits',
                label: 'Habits',
                icon: 'checkmark-done-outline',
                ratio: habitsState.habits.length > 0 ? habitsDoneToday / habitsState.habits.length : null,
              },
              {
                key: 'todos',
                label: 'Tasks',
                icon: 'list-outline',
                ratio: todosDueToday.length > 0 ? todosDoneToday / todosDueToday.length : null,
              },
              {
                key: 'sleep',
                label: 'Sleep',
                icon: 'moon-outline',
                ratio: todaysSleep ? todaysSleep.quality / 5 : null,
              },
            ]}
          />

          <View className="flex-row gap-md">
            <StatCard
              value={todaysSleep ? formatDurationMinutes(todaysSleep.durationMinutes) : '—'}
              label="Sleep"
              icon={<Ionicons name="moon-outline" size={16} color={colors.info} />}
              sublabel={todaysSleep ? `Quality ${todaysSleep.quality}/5` : 'Not logged'}
            />
            <StatCard
              value={`${habitsDoneToday}/${habitsState.habits.length}`}
              label="Habits"
              icon={<Ionicons name="flame-outline" size={16} color={colors.warning} />}
              sublabel={habitsState.habits.length > 0 ? `${weeklyAvgPct}% this week` : 'None yet'}
            />
          </View>
          <View className="flex-row gap-md">
            <StatCard
              value={String(todosPending)}
              label="Todos pending"
              icon={<Ionicons name="list-outline" size={16} color={colors.primary} />}
              sublabel={overdueTodos > 0 ? `${overdueTodos} overdue` : 'All on track'}
              sublabelColor={overdueTodos > 0 ? 'danger' : 'secondary'}
            />
            <StatCard
              value={formatCurrency(todaysSpend, currency)}
              label="Spent today"
              valueColor="danger"
              icon={<Ionicons name="wallet-outline" size={16} color={colors.danger} />}
              sublabel="Today's expenses"
            />
          </View>

          <UpcomingTimeline todos={todaysTimeline} onPressTodo={goToTimeBoxing} onViewAll={goToTimeBoxing} />

          <Card className="gap-sm">
            <View className="flex-row items-center justify-between">
              <Text weight="semibold">Last 7 days</Text>
              <Text variant="xs" color="secondary">
                {weeklyAvgPct}% avg
              </Text>
            </View>
            <ActivityStrip days={activityDays} />
          </Card>
        </ScrollView>
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
