import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';
import type { Todo } from '@/db/schema';
import { cn } from '@/lib/cn';
import { todayISO } from '@/lib/date';
import { useTodosStore } from '@/store/todosStore';

export interface TodoRowProps {
  todo: Todo;
  onPress: () => void;
}

const PRIORITY_DOT_CLASS: Record<Todo['priority'], string> = {
  low: 'bg-info',
  medium: 'bg-warning',
  high: 'bg-danger',
};

export function TodoRow({ todo, onPress }: TodoRowProps) {
  const toggleCompleted = useTodosStore((state) => state.toggleCompleted);
  const isOverdue = !todo.completed && !!todo.dueDate && todo.dueDate < todayISO();

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-md rounded-lg border border-border bg-surface p-md active:opacity-80"
    >
      {/* Absorbs the tap so it toggles completion instead of opening the edit sheet. */}
      <Pressable
        onPress={() => toggleCompleted(todo.id)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: todo.completed }}
        accessibilityLabel={`Mark ${todo.title} ${todo.completed ? 'not done' : 'done'}`}
        className={cn(
          'h-6 w-6 items-center justify-center rounded-md border-2 border-primary',
          todo.completed && 'bg-primary',
        )}
      >
        {todo.completed ? (
          <Text color="onPrimary" variant="sm">
            ✓
          </Text>
        ) : null}
      </Pressable>

      <View className="flex-1 gap-xs">
        <Text weight="medium" color={todo.completed ? 'muted' : 'primary'} className={todo.completed ? 'line-through' : undefined}>
          {todo.title}
        </Text>
        <View className="flex-row items-center gap-sm">
          <View className={cn('h-2 w-2 rounded-full', PRIORITY_DOT_CLASS[todo.priority])} />
          {todo.dueDate ? (
            <Text variant="sm" color={isOverdue ? 'danger' : 'secondary'}>
              {todo.dueDate}
            </Text>
          ) : null}
          {todo.tag ? (
            <Text variant="sm" color="muted">
              #{todo.tag}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
