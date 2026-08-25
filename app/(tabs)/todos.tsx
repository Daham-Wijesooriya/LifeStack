import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DateStrip, DayTimeline, TodoFormSheet, TodoRow } from '@/components/todos';
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

export default function TimeBoxingScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { todos, status, error, loadTodos, createTodo, updateTodo, toggleCompleted, deleteTodo } = useTodosStore();

  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [formVisible, setFormVisible] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | undefined>(undefined);
  const [createSlot, setCreateSlot] = useState<{ dueDate: string; startTime?: string } | undefined>(undefined);
  const [backlogVisible, setBacklogVisible] = useState(false);

  useEffect(() => {
    void loadTodos();
  }, [loadTodos]);

  const timedToday = useMemo(
    () => todos.filter((t) => t.dueDate === selectedDate && t.startTime && t.endTime),
    [todos, selectedDate],
  );
  const unscheduledToday = useMemo(
    () => todos.filter((t) => t.dueDate === selectedDate && !t.startTime),
    [todos, selectedDate],
  );
  const backlog = useMemo(() => todos.filter((t) => !t.dueDate), [todos]);
  const markedDates = useMemo(
    () => new Set(todos.filter((t) => t.startTime && t.dueDate).map((t) => t.dueDate as string)),
    [todos],
  );

  const doneCount = timedToday.filter((t) => t.completed).length;
  const progress = timedToday.length > 0 ? doneCount / timedToday.length : 0;

  function openEdit(todo: Todo) {
    setEditingTodo(todo);
    setCreateSlot(undefined);
    setFormVisible(true);
  }

  function openCreateAt(startTime: string) {
    setEditingTodo(undefined);
    setCreateSlot({ dueDate: selectedDate, startTime });
    setFormVisible(true);
  }

  function openQuickAdd() {
    setEditingTodo(undefined);
    setCreateSlot({ dueDate: selectedDate, startTime: suggestedStartTime(selectedDate) });
    setFormVisible(true);
  }

  function openUnscheduledAdd() {
    setEditingTodo(undefined);
    setCreateSlot({ dueDate: selectedDate });
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
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 12 }}>
      <View className="flex-row items-center justify-between px-lg pb-sm">
        <View>
          <Text variant="xl" weight="semibold">
            Time Boxing
          </Text>
          <Text variant="sm" color="secondary">
            {timedToday.length > 0 ? `${doneCount}/${timedToday.length} blocks done` : 'Plan your day, hour by hour'}
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

      {unscheduledToday.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="max-h-12 flex-none px-lg"
          contentContainerClassName="gap-sm pb-sm"
        >
          {unscheduledToday.map((todo) => (
            <Pressable
              key={todo.id}
              onPress={() => openEdit(todo)}
              className="flex-row items-center gap-xs rounded-full border border-border bg-surface px-md py-xs active:opacity-80"
            >
              <Ionicons name="time-outline" size={12} color={colors.textMuted} />
              <Text variant="xs" color={todo.completed ? 'muted' : 'primary'} className={todo.completed ? 'line-through' : undefined}>
                {todo.title}
              </Text>
            </Pressable>
          ))}
          <Pressable
            onPress={openUnscheduledAdd}
            className="flex-row items-center gap-xs rounded-full border border-dashed border-border px-md py-xs active:opacity-80"
          >
            <Ionicons name="add" size={12} color={colors.textMuted} />
            <Text variant="xs" color="muted">
              Add
            </Text>
          </Pressable>
        </ScrollView>
      ) : null}

      <View className="flex-1 border-t border-border">
        <DayTimeline
          dateISO={selectedDate}
          todos={timedToday}
          onToggle={toggleCompleted}
          onPressBlock={openEdit}
          onCreateAt={openCreateAt}
        />
      </View>

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
