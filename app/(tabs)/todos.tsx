import { useEffect, useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TodoFormSheet, TodoRow } from '@/components/todos';
import { Button, EmptyState, Text } from '@/components/ui';
import type { Todo } from '@/db/schema';
import { useTodosStore } from '@/store/todosStore';

type Filter = 'pending' | 'completed' | 'all';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'all', label: 'All' },
];

export default function TodosScreen() {
  const insets = useSafeAreaInsets();
  const { todos, status, error, loadTodos, createTodo, updateTodo, deleteTodo } = useTodosStore();
  const [filter, setFilter] = useState<Filter>('pending');
  const [formVisible, setFormVisible] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | undefined>(undefined);

  useEffect(() => {
    void loadTodos();
  }, [loadTodos]);

  const filteredTodos = useMemo(() => {
    if (filter === 'all') return todos;
    return todos.filter((todo) => (filter === 'completed' ? todo.completed : !todo.completed));
  }, [todos, filter]);

  function openCreate() {
    setEditingTodo(undefined);
    setFormVisible(true);
  }

  function openEdit(todo: Todo) {
    setEditingTodo(todo);
    setFormVisible(true);
  }

  if (status === 'loading' || status === 'idle') {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text color="secondary">Loading todos…</Text>
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
      <View className="flex-row gap-sm pb-md">
        {FILTERS.map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? 'primary' : 'outline'}
            size="sm"
            onPress={() => setFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </View>

      {filteredTodos.length === 0 ? (
        <EmptyState
          title={filter === 'completed' ? 'Nothing completed yet' : 'All clear'}
          description={filter === 'completed' ? 'Todos you finish will show up here.' : 'Add a todo to get started.'}
          actionLabel="Add todo"
          onAction={openCreate}
        />
      ) : (
        <FlatList
          data={filteredTodos}
          keyExtractor={(todo) => String(todo.id)}
          contentContainerClassName="gap-sm pb-2xl"
          renderItem={({ item }) => <TodoRow todo={item} onPress={() => openEdit(item)} />}
          ListFooterComponent={
            <Button variant="outline" onPress={openCreate} className="mt-sm">
              + Add todo
            </Button>
          }
        />
      )}

      <TodoFormSheet
        visible={formVisible}
        onClose={() => setFormVisible(false)}
        initialTodo={editingTodo}
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
    </View>
  );
}
