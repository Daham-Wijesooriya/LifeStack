import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';
import type { Todo } from '@/db/schema';
import { cn } from '@/lib/cn';
import { PRIORITY_ICON_COLOR } from '@/lib/todoPriority';
import { useTodosStore } from '@/store/todosStore';
import { pickAccentColor, useAccentPalette } from '@/theme/accentPalette';
import { useTheme } from '@/theme/ThemeProvider';

export interface TodoChecklistRowProps {
  todo: Todo;
  onPress: () => void;
}

/**
 * A single day's todo, for the unified checklist rendered under DayClock.
 * Scheduled todos get a left accent stripe in the exact same color as their
 * wedge on the clock above, so the two views read as one connected system
 * instead of two independent color languages; unscheduled ones stay neutral
 * since they have no wedge to match. Tapping the tick toggles completion;
 * tapping the row opens edit.
 */
export function TodoChecklistRow({ todo, onPress }: TodoChecklistRowProps) {
  const { colors } = useTheme();
  const accentPalette = useAccentPalette();
  const toggleCompleted = useTodosStore((state) => state.toggleCompleted);
  const isScheduled = !!(todo.startTime && todo.endTime);
  const accentColor = isScheduled ? pickAccentColor(todo.id, accentPalette) : colors.border;

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-md rounded-lg border border-border bg-surface py-md pl-sm pr-md active:opacity-80"
      style={{ borderLeftWidth: 3, borderLeftColor: accentColor }}
    >
      <Pressable
        onPress={() => toggleCompleted(todo.id)}
        hitSlop={6}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: todo.completed }}
        accessibilityLabel={`Mark ${todo.title} ${todo.completed ? 'not done' : 'done'}`}
        className={cn(
          'h-6 w-6 items-center justify-center rounded-md border-2 border-primary',
          todo.completed && 'bg-primary',
        )}
      >
        {todo.completed ? <Ionicons name="checkmark" size={14} color={colors.primaryText} /> : null}
      </Pressable>

      <View className="flex-1 gap-xs">
        <Text weight="medium" color={todo.completed ? 'muted' : 'primary'} className={todo.completed ? 'line-through' : undefined}>
          {todo.title}
        </Text>
        <View className="flex-row items-center gap-sm">
          <Ionicons name="flag" size={10} color={colors[PRIORITY_ICON_COLOR[todo.priority]]} />
          {isScheduled ? (
            <Text variant="sm" color="secondary">
              {todo.startTime}–{todo.endTime}
            </Text>
          ) : (
            <Text variant="sm" color="muted">
              Unscheduled
            </Text>
          )}
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
