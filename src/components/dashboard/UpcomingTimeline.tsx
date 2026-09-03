import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { Card, Text } from '@/components/ui';
import type { Todo } from '@/db/schema';
import { formatHHmmLabel } from '@/lib/date';
import { pickAccentColor, useAccentPalette } from '@/theme/accentPalette';
import { useTheme } from '@/theme/ThemeProvider';

export interface UpcomingTimelineProps {
  /** Today's time-boxed todos, already sorted by start time. */
  todos: Todo[];
  onPressTodo: (todo: Todo) => void;
  onViewAll: () => void;
}

/** Dashboard preview of today's day-timeline — the full planner lives on the Todos tab. */
export function UpcomingTimeline({ todos, onPressTodo, onViewAll }: UpcomingTimelineProps) {
  const { colors } = useTheme();
  const accentPalette = useAccentPalette();
  const preview = todos.slice(0, 3);

  return (
    <Card className="gap-sm">
      <View className="flex-row items-center justify-between">
        <Text weight="semibold">Today's plan</Text>
        <Pressable onPress={onViewAll} accessibilityRole="button" accessibilityLabel="Open time boxing" className="flex-row items-center gap-[2px] active:opacity-70">
          <Text variant="sm" color="secondary">
            Plan day
          </Text>
          <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
        </Pressable>
      </View>

      {preview.length === 0 ? (
        <Text variant="sm" color="muted">
          Nothing time-boxed yet — tap "Plan day" to block out your schedule.
        </Text>
      ) : (
        <View className="gap-sm">
          {preview.map((todo) => {
            const color = pickAccentColor(todo.id, accentPalette);
            return (
              <Pressable
                key={todo.id}
                onPress={() => onPressTodo(todo)}
                className="flex-row items-center gap-sm rounded-md border-l-[3px] bg-surface-alt px-sm py-xs active:opacity-80"
                style={{ borderLeftColor: color }}
              >
                <Text variant="xs" color="secondary" style={{ width: 68 }}>
                  {formatHHmmLabel(todo.startTime ?? '00:00')}
                </Text>
                <Text
                  variant="sm"
                  weight="medium"
                  color={todo.completed ? 'muted' : 'primary'}
                  className={todo.completed ? 'flex-1 line-through' : 'flex-1'}
                  numberOfLines={1}
                >
                  {todo.title}
                </Text>
                {todo.completed ? <Ionicons name="checkmark-circle" size={16} color={colors.success} /> : null}
              </Pressable>
            );
          })}
        </View>
      )}
    </Card>
  );
}
