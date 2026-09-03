import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DateStrip, DayClock, TodoChecklistRow, TodoFormSheet, TodoRow } from '@/components/todos';
import { Sheet, Text } from '@/components/ui';
import type { Todo } from '@/db/schema';
import { addMinutesHHmm, hhmmToMinutes, nowHHmm, todayISO } from '@/lib/date';
import { useTodosStore } from '@/store/todosStore';
import { useTheme } from '@/theme/ThemeProvider';

/** Rounds up to the next half hour for "now" (today) or a plain 9am default for any other day. */
function suggestedStartTime(dateISO: string): string {
  if (dateISO !== todayISO()) return '09:00';
  const minutes = hhmmToMinutes(nowHHmm());
  return addMinutesHHmm('00:00', Math.min(23 * 60, Math.ceil(minutes / 30) * 30));
}

export default function DayPlannerScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const { todos, status, error, loadTodos, createTodo, updateTodo, deleteTodo } = useTodosStore();

  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [formVisible, setFormVisible] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | undefined>(undefined);
  const [createSlot, setCreateSlot] = useState<{ dueDate: string; startTime?: string } | undefined>(undefined);
  const [backlogVisible, setBacklogVisible] = useState(false);

  useEffect(() => {
    void loadTodos();
  }, [loadTodos]);

  const timedToday = useMemo(
    () =>
      todos
        .filter((t) => t.dueDate === selectedDate && t.startTime && t.endTime)
        .sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? '')),
    [todos, selectedDate],
  );
  const unscheduledToday = useMemo(
    () => todos.filter((t) => t.dueDate === selectedDate && !t.startTime),
    [todos, selectedDate],
  );
  // Unified checklist under the clock: timed todos first (by start time), then unscheduled.
  const todayList = useMemo(() => [...timedToday, ...unscheduledToday], [timedToday, unscheduledToday]);
  const backlog = useMemo(() => todos.filter((t) => !t.dueDate), [todos]);
  const markedDates = useMemo(
    () => new Set(todos.filter((t) => t.startTime && t.dueDate).map((t) => t.dueDate as string)),
    [todos],
  );

  const doneCount = todayList.filter((t) => t.completed).length;
  const progress = todayList.length > 0 ? doneCount / todayList.length : 0;
  const clockSize = Math.min(width - 96, 260);

  function openEdit(todo: Todo) {
    setEditingTodo(todo);
    setCreateSlot(undefined);
    setFormVisible(true);
  }

  function openQuickAdd() {
    setEditingTodo(undefined);
    setCreateSlot({ dueDate: selectedDate, startTime: suggestedStartTime(selectedDate) });
    setFormVisible(true);
  }

  if (status === 'loading' || status === 'idle') {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text color="secondary">Loading your plan…</Text>
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
    // fix, and matches the +16 offset every other tab screen uses.
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 16 }}>
      <View className="flex-row items-center justify-between px-lg pb-sm">
        <View>
          <Text variant="xl" weight="semibold">
            Day Planner
          </Text>
          <Text variant="sm" color="secondary">
            {todayList.length > 0 ? `${doneCount}/${todayList.length} todos done` : 'Plan your day, hour by hour'}
          </Text>
        </View>
        <Pressable
          onPress={() => setBacklogVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Backlog"
          className="h-10 w-10 items-center justify-center rounded-full bg-surface-alt active:opacity-80"
        >
          <Ionicons name="albums-outline" size={18} color={colors.textSecondary} />
          {backlog.length > 0 ? (
            <View className="absolute -right-1 -top-1 h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-[3px]">
              <Text style={{ fontSize: 9, lineHeight: 11 }} color="onPrimary" weight="bold">
                {backlog.length}
              </Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      {timedToday.length > 0 ? (
        <View className="mx-lg mb-sm h-1.5 overflow-hidden rounded-full bg-surface-alt">
          <View className="h-full rounded-full bg-primary" style={{ width: `${Math.round(progress * 100)}%` }} />
        </View>
      ) : null}

      <View className="px-lg pb-sm">
        <DateStrip selectedISO={selectedDate} onSelect={setSelectedDate} markedDates={markedDates} />
      </View>

      {/* Pinned above the list — the clock shouldn't scroll away, only the checklist below it should. */}
      <View className="items-center border-t border-border px-lg pb-lg pt-lg">
        <DayClock dateISO={selectedDate} todos={timedToday} size={clockSize} />
      </View>

      <ScrollView className="flex-1" contentContainerClassName="items-center gap-sm px-lg pb-2xl" showsVerticalScrollIndicator={false}>
        <View className="w-full gap-sm">
          {todayList.length === 0 ? (
            <Text variant="sm" color="muted" className="py-lg text-center">
              Nothing planned for this day yet.
            </Text>
          ) : (
            todayList.map((todo) => <TodoChecklistRow key={todo.id} todo={todo} onPress={() => openEdit(todo)} />)
          )}
        </View>
      </ScrollView>

      <Pressable
        onPress={openQuickAdd}
        accessibilityRole="button"
        accessibilityLabel="Add task"
        className="absolute bottom-xl right-lg h-14 w-14 items-center justify-center rounded-full bg-primary active:opacity-80"
        style={{ bottom: insets.bottom + 24 }}
      >
        <Ionicons name="add" size={28} color={colors.primaryText} />
      </Pressable>

      <TodoFormSheet
        visible={formVisible}
        onClose={() => setFormVisible(false)}
        initialTodo={editingTodo}
        initialSlot={createSlot}
        onSubmit={async (input) => {
          if (editingTodo) {
            await updateTodo(editingTodo.id, input);
          } else {
            await createTodo(input);
          }
        }}
        onDelete={
          editingTodo
            ? async () => {
                await deleteTodo(editingTodo.id);
              }
            : undefined
        }
      />

      <Sheet visible={backlogVisible} onClose={() => setBacklogVisible(false)}>
        <View className="gap-sm pb-lg">
          <Text variant="lg" weight="semibold">
            Backlog
          </Text>
          <Text variant="sm" color="secondary">
            Tasks with no date yet — edit one to give it a day.
          </Text>
          {backlog.length === 0 ? (
            <Text variant="sm" color="muted" className="py-lg text-center">
              Nothing here. Backlog is clear.
            </Text>
          ) : (
            <View className="gap-sm">
              {backlog.map((todo) => (
                <TodoRow
                  key={todo.id}
                  todo={todo}
                  onPress={() => {
                    setBacklogVisible(false);
                    openEdit(todo);
                  }}
                />
              ))}
            </View>
          )}
        </View>
      </Sheet>
    </View>
  );
}
