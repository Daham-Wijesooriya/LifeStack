import { useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, ScrollView, View, type GestureResponderEvent } from 'react-native';

import { Text } from '@/components/ui';
import type { Todo } from '@/db/schema';
import { cn } from '@/lib/cn';
import { hhmmToMinutes, minutesToHHmm, nowHHmm, todayISO } from '@/lib/date';
import { useTheme } from '@/theme/ThemeProvider';

export interface DayTimelineProps {
  dateISO: string;
  /** Already filtered to this date's timed todos (dueDate === dateISO && startTime && endTime). */
  todos: Todo[];
  onToggle: (id: number) => void;
  onPressBlock: (todo: Todo) => void;
  /** User tapped an empty grid slot — "HH:mm", snapped to the nearest half hour. */
  onCreateAt: (startTime: string) => void;
}

const HOUR_HEIGHT = 64;
const PX_PER_MIN = HOUR_HEIGHT / 60;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const GUTTER_WIDTH = 52;
const MIN_BLOCK_HEIGHT = 30;

const PRIORITY_COLOR_KEY: Record<Todo['priority'], 'info' | 'warning' | 'danger'> = {
  low: 'info',
  medium: 'warning',
  high: 'danger',
};

function formatHourLabel(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}

interface PositionedBlock {
  todo: Todo;
  startMin: number;
  endMin: number;
  column: number;
  columnCount: number;
}

/**
 * Assigns each block a column + column count within its overlap cluster
 * (a simple left-to-right sweep, à la Google Calendar) so overlapping time
 * blocks render side by side instead of stacking on top of each other.
 */
function layoutBlocks(todos: Todo[]): PositionedBlock[] {
  const withMinutes = todos
    .map((todo) => ({
      todo,
      startMin: hhmmToMinutes(todo.startTime ?? '00:00'),
      endMin: Math.max(hhmmToMinutes(todo.endTime ?? '00:00'), hhmmToMinutes(todo.startTime ?? '00:00') + 15),
    }))
    .sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);

  const result: PositionedBlock[] = [];
  let cluster: PositionedBlock[] = [];
  let clusterEnd = -Infinity;

  function flushCluster() {
    if (cluster.length === 0) return;
    const columnCount = Math.max(...cluster.map((b) => b.column)) + 1;
    for (const block of cluster) {
      result.push({ ...block, columnCount });
    }
    cluster = [];
  }

  for (const item of withMinutes) {
    if (item.startMin >= clusterEnd) {
      flushCluster();
      clusterEnd = item.endMin;
    } else {
      clusterEnd = Math.max(clusterEnd, item.endMin);
    }
    const activeColumns = new Set(cluster.filter((b) => b.endMin > item.startMin).map((b) => b.column));
    let column = 0;
    while (activeColumns.has(column)) column += 1;
    cluster.push({ ...item, column, columnCount: 1 });
  }
  flushCluster();

  return result;
}

/**
 * Full-day vertical timeline: a tap on an empty hour slot starts a new time
 * block there, existing blocks render absolutely-positioned over the grid
 * (side-by-side on overlap), and — for today only — a live line marks the
 * current time.
 */
export function DayTimeline({ dateISO, todos, onToggle, onPressBlock, onCreateAt }: DayTimelineProps) {
  const { colors } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const [areaWidth, setAreaWidth] = useState(0);
  const isToday = dateISO === todayISO();
  const [nowMinutes, setNowMinutes] = useState(() => hhmmToMinutes(nowHHmm()));

  const blocks = useMemo(() => layoutBlocks(todos), [todos]);

  // Keeps the "now" line live while the screen stays mounted on today.
  useEffect(() => {
    if (!isToday) return;
    const interval = setInterval(() => setNowMinutes(hhmmToMinutes(nowHHmm())), 60_000);
    return () => clearInterval(interval);
  }, [isToday]);

  // Jump to the relevant part of the day whenever the selected date changes:
  // near "now" for today, near the first block otherwise, else a sane 7am default.
  useEffect(() => {
    const targetMinutes = isToday
      ? Math.max(0, nowMinutes - 90)
      : (blocks[0]?.startMin ?? 7 * 60) - 60;
    scrollRef.current?.scrollTo({ y: Math.max(0, targetMinutes) * PX_PER_MIN, animated: false });
    // Only when the date itself changes — not on every block/now-minute tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateISO]);

  function handleAreaLayout(event: LayoutChangeEvent) {
    setAreaWidth(event.nativeEvent.layout.width);
  }

  function handleSlotPress(hour: number, event: GestureResponderEvent) {
    const y = event.nativeEvent.locationY;
    const halfHour = y < HOUR_HEIGHT / 2 ? 0 : 30;
    onCreateAt(minutesToHHmm(hour * 60 + halfHour));
  }

  return (
    <ScrollView ref={scrollRef} className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="flex-row">
        {/* Hour gutter */}
        <View style={{ width: GUTTER_WIDTH }}>
          {HOURS.map((hour) => (
            <View key={hour} style={{ height: HOUR_HEIGHT }}>
              <Text variant="xs" color="muted" style={{ marginTop: -7 }}>
                {formatHourLabel(hour)}
              </Text>
            </View>
          ))}
        </View>

        {/* Grid + blocks */}
        <View className="relative flex-1" onLayout={handleAreaLayout}>
          {HOURS.map((hour) => (
            <Pressable
              key={hour}
              onPress={(event) => handleSlotPress(hour, event)}
              style={{ height: HOUR_HEIGHT }}
              className="border-t border-border active:bg-surface-alt"
            />
          ))}

          {isToday && nowMinutes >= 0 ? (
            <View pointerEvents="none" className="absolute left-0 right-0 flex-row items-center" style={{ top: nowMinutes * PX_PER_MIN - 4 }}>
              <View className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.danger }} />
              <View className="h-[1.5px] flex-1" style={{ backgroundColor: colors.danger }} />
            </View>
          ) : null}

          {areaWidth > 0
            ? blocks.map(({ todo, startMin, endMin, column, columnCount }) => {
                const colorKey = PRIORITY_COLOR_KEY[todo.priority];
                const color = colors[colorKey];
                const width = areaWidth / columnCount;
                const height = Math.max(MIN_BLOCK_HEIGHT, (endMin - startMin) * PX_PER_MIN);
                const showTime = height >= 44;

                return (
                  <Pressable
                    key={todo.id}
                    onPress={() => onPressBlock(todo)}
                    className={cn('absolute overflow-hidden rounded-md border-l-[3px] px-sm py-[3px] active:opacity-80')}
                    style={{
                      top: startMin * PX_PER_MIN,
                      left: column * width + 2,
                      width: width - 4,
                      height: height - 2,
                      backgroundColor: todo.completed ? colors.surfaceAlt : `${color}22`,
                      borderLeftColor: color,
                    }}
                  >
                    <View className="flex-1 flex-row items-start gap-xs">
                      <Pressable
                        onPress={() => onToggle(todo.id)}
                        hitSlop={6}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: todo.completed }}
                        accessibilityLabel={`Mark ${todo.title} ${todo.completed ? 'not done' : 'done'}`}
                        className={cn(
                          'mt-[1px] h-4 w-4 items-center justify-center rounded-[4px] border-2',
                          todo.completed && 'bg-primary',
                        )}
                        style={{ borderColor: todo.completed ? colors.primary : color }}
                      >
                        {todo.completed ? (
                          <Text variant="xs" color="onPrimary" style={{ fontSize: 9, lineHeight: 10 }}>
                            ✓
                          </Text>
                        ) : null}
                      </Pressable>
                      <View className="flex-1">
                        <Text
                          variant="xs"
                          weight="semibold"
                          color={todo.completed ? 'muted' : 'primary'}
                          className={todo.completed ? 'line-through' : undefined}
                          numberOfLines={showTime ? 2 : 1}
                        >
                          {todo.title}
                        </Text>
                        {showTime ? (
                          <Text variant="xs" color="muted">
                            {todo.startTime}–{todo.endTime}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  </Pressable>
                );
              })
            : null}
        </View>
      </View>
    </ScrollView>
  );
}
