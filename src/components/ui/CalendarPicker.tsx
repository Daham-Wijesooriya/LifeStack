import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { eachDayOfInterval, endOfMonth, endOfWeek, isSameDay, isSameMonth, startOfMonth, startOfWeek } from 'date-fns';

import { cn } from '@/lib/cn';
import { addMonthsISO, formatISODate, formatMonthLabel } from '@/lib/date';

import { Text } from './Text';

export interface CalendarPickerProps {
  /** YYYY-MM, the month currently displayed. */
  monthISO: string;
  onMonthChange: (monthISO: string) => void;
  /** YYYY-MM-DD, or null if nothing staged yet. */
  selectedISO: string | null;
  onSelect: (dateISO: string) => void;
}

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** Month-grid content for DateField's picker modal. Monday-start, matching the app's startOfWeekISO convention. */
export function CalendarPicker({ monthISO, onMonthChange, selectedISO, onSelect }: CalendarPickerProps) {
  const monthDate = useMemo(() => new Date(`${monthISO}-01T00:00:00`), [monthISO]);
  const today = useMemo(() => new Date(), []);

  // Full weeks, including leading/trailing days from adjacent months, so the
  // grid is always a clean set of 7-day rows.
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [monthDate]);

  return (
    <View className="gap-sm">
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={() => onMonthChange(addMonthsISO(monthISO, -1))}
          className="h-11 w-11 items-center justify-center rounded-md active:bg-surface-alt"
          accessibilityRole="button"
          accessibilityLabel="Previous month"
        >
          <Text variant="lg">‹</Text>
        </Pressable>
        <Text weight="semibold">{formatMonthLabel(monthISO)}</Text>
        <Pressable
          onPress={() => onMonthChange(addMonthsISO(monthISO, 1))}
          className="h-11 w-11 items-center justify-center rounded-md active:bg-surface-alt"
          accessibilityRole="button"
          accessibilityLabel="Next month"
        >
          <Text variant="lg">›</Text>
        </Pressable>
      </View>

      <View className="flex-row">
        {WEEKDAY_LABELS.map((label, i) => (
          <View key={i} className="flex-1 items-center py-xs">
            <Text variant="xs" color="muted" weight="medium">
              {label}
            </Text>
          </View>
        ))}
      </View>

      <View className="flex-row flex-wrap">
        {days.map((day) => {
          const dateISO = formatISODate(day);
          const inCurrentMonth = isSameMonth(day, monthDate);
          const isToday = isSameDay(day, today);
          const isSelected = selectedISO !== null && dateISO === selectedISO;

          return (
            <View key={dateISO} style={{ width: `${100 / 7}%` }} className="items-center py-xs">
              <Pressable
                onPress={() => {
                  if (!inCurrentMonth) onMonthChange(dateISO.slice(0, 7));
                  onSelect(dateISO);
                }}
                className={cn(
                  'h-11 w-11 items-center justify-center rounded-full',
                  isSelected && 'bg-primary',
                  !isSelected && isToday && 'border border-primary',
                )}
                accessibilityRole="button"
                accessibilityLabel={dateISO}
              >
                <Text
                  variant="sm"
                  weight={isToday || isSelected ? 'semibold' : 'normal'}
                  color={isSelected ? 'onPrimary' : inCurrentMonth ? 'primary' : 'muted'}
                >
                  {day.getDate()}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}
