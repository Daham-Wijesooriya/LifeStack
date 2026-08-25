import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { CalendarPicker, PickerModal, Text } from '@/components/ui';
import { cn } from '@/lib/cn';
import { addDaysISO, dayStripISO, todayISO } from '@/lib/date';
import { useTheme } from '@/theme/ThemeProvider';

export interface DateStripProps {
  selectedISO: string;
  onSelect: (dateISO: string) => void;
  /** Dates (YYYY-MM-DD) that have at least one time-boxed todo — rendered as a small dot under the day. */
  markedDates: ReadonlySet<string>;
}

const DAYS_BEFORE = 3;
const DAYS_AFTER = 3;

/**
 * Week-wide day picker for the time-boxing screen — always centered on
 * `selectedISO` (not a fixed calendar week), so paging one day at a time
 * keeps the selection in the middle instead of jumping to a new week. The
 * center label opens the full month CalendarPicker for jumping further out.
 */
export function DateStrip({ selectedISO, onSelect, markedDates }: DateStripProps) {
  const { colors } = useTheme();
  const [pickerVisible, setPickerVisible] = useState(false);
  const [monthISO, setMonthISO] = useState(() => selectedISO.slice(0, 7));
  const [stagedISO, setStagedISO] = useState(selectedISO);
  const today = todayISO();

  const days = dayStripISO(selectedISO, DAYS_BEFORE, DAYS_AFTER);
  const isToday = selectedISO === today;

  function openPicker() {
    setMonthISO(selectedISO.slice(0, 7));
    setStagedISO(selectedISO);
    setPickerVisible(true);
  }

  function confirmPicker() {
    onSelect(stagedISO);
    setPickerVisible(false);
  }

  return (
    <View className="gap-sm">
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={() => onSelect(addDaysISO(selectedISO, -1))}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Previous day"
          className="h-9 w-9 items-center justify-center rounded-full active:bg-surface-alt"
        >
          <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
        </Pressable>

        <Pressable onPress={openPicker} className="flex-1 items-center gap-[2px] py-xs active:opacity-70">
          <Text variant="lg" weight="semibold">
            {isToday ? 'Today' : format(parseISO(selectedISO), 'EEEE')}
          </Text>
          <Text variant="xs" color="secondary">
            {format(parseISO(selectedISO), 'MMMM d, yyyy')}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onSelect(addDaysISO(selectedISO, 1))}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Next day"
          className="h-9 w-9 items-center justify-center rounded-full active:bg-surface-alt"
        >
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>

      <View className="flex-row justify-between">
        {days.map((dateISO) => {
          const isSelected = dateISO === selectedISO;
          const isTodayPill = dateISO === today;
          const hasItems = markedDates.has(dateISO);
          return (
            <Pressable
              key={dateISO}
              onPress={() => onSelect(dateISO)}
              accessibilityRole="button"
              accessibilityLabel={format(parseISO(dateISO), 'EEEE, MMMM d')}
              className={cn(
                'w-11 items-center gap-[3px] rounded-xl py-sm',
                isSelected ? 'bg-primary' : isTodayPill ? 'border border-primary' : undefined,
              )}
            >
              <Text
                variant="xs"
                weight="medium"
                color={isSelected ? 'onPrimary' : 'muted'}
                className={isSelected ? undefined : 'opacity-90'}
              >
                {format(parseISO(dateISO), 'EEEEE')}
              </Text>
              <Text variant="sm" weight="semibold" color={isSelected ? 'onPrimary' : 'primary'}>
                {format(parseISO(dateISO), 'd')}
              </Text>
              <View
                className="h-1 w-1 rounded-full"
                style={{ backgroundColor: hasItems ? (isSelected ? colors.primaryText : colors.primary) : 'transparent' }}
              />
            </Pressable>
          );
        })}
      </View>

      <PickerModal visible={pickerVisible} title="Jump to date" onCancel={() => setPickerVisible(false)} onDone={confirmPicker}>
        <CalendarPicker monthISO={monthISO} onMonthChange={setMonthISO} selectedISO={stagedISO} onSelect={setStagedISO} />
      </PickerModal>
    </View>
  );
}
