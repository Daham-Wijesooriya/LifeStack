import { useRef } from 'react';
import { ScrollView, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import { Text } from './Text';

export interface TimeWheelPickerProps {
  /** "HH:mm", 24-hour. */
  value: string;
  onChange: (value: string) => void;
}

const ROW_HEIGHT = 40;
const VISIBLE_ROWS = 5;
const PADDING = (ROW_HEIGHT * (VISIBLE_ROWS - 1)) / 2;

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
const MINUTES = Array.from({ length: 60 }, (_, i) => i); // 0..59
const PERIODS = ['AM', 'PM'] as const;
type Period = (typeof PERIODS)[number];

function to12Hour(value: string): { hour: number; minute: number; period: Period } {
  const [hoursRaw, minutesRaw] = value.split(':');
  const hour24 = Number(hoursRaw ?? 0);
  const minute = Number(minutesRaw ?? 0);
  const period: Period = hour24 >= 12 ? 'PM' : 'AM';
  const hour = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return { hour, minute, period };
}

function to24Hour(hour: number, minute: number, period: Period): string {
  const hour24 = period === 'AM' ? (hour === 12 ? 0 : hour) : hour === 12 ? 12 : hour + 12;
  return `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

interface ColumnProps<T extends string | number> {
  items: readonly T[];
  selected: T;
  onSelect: (item: T) => void;
  format?: (item: T) => string;
}

/** One snapping scroll column (hour, minute, or AM/PM). */
function Column<T extends string | number>({ items, selected, onSelect, format }: ColumnProps<T>) {
  const scrollRef = useRef<ScrollView>(null);
  const selectedIndex = items.indexOf(selected);

  function handleMomentumEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(event.nativeEvent.contentOffset.y / ROW_HEIGHT);
    const clamped = Math.max(0, Math.min(items.length - 1, index));
    onSelect(items[clamped] ?? selected);
  }

  return (
    <ScrollView
      ref={scrollRef}
      className="flex-1"
      showsVerticalScrollIndicator={false}
      snapToInterval={ROW_HEIGHT}
      decelerationRate="fast"
      contentContainerStyle={{ paddingVertical: PADDING }}
      contentOffset={{ x: 0, y: selectedIndex * ROW_HEIGHT }}
      onMomentumScrollEnd={handleMomentumEnd}
    >
      {items.map((item) => (
        <View key={String(item)} style={{ height: ROW_HEIGHT }} className="items-center justify-center">
          <Text
            variant="lg"
            weight={item === selected ? 'semibold' : 'normal'}
            color={item === selected ? 'primary' : 'muted'}
          >
            {format ? format(item) : item}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

/**
 * Three snapping wheel columns (hour / minute / AM-PM), fully custom-built
 * so layout is always ours to control — this replaces the native spinner
 * that used to overflow the sheet on small screens.
 */
export function TimeWheelPicker({ value, onChange }: TimeWheelPickerProps) {
  const { hour, minute, period } = to12Hour(value);

  return (
    <View style={{ height: ROW_HEIGHT * VISIBLE_ROWS }} className="relative flex-row">
      <View pointerEvents="none" style={{ height: ROW_HEIGHT, top: PADDING }} className="absolute left-0 right-0 rounded-md bg-surface-alt" />
      <Column items={HOURS} selected={hour} onSelect={(h) => onChange(to24Hour(h, minute, period))} />
      <Column
        items={MINUTES}
        selected={minute}
        onSelect={(m) => onChange(to24Hour(hour, m, period))}
        format={(m) => String(m).padStart(2, '0')}
      />
      <Column items={PERIODS} selected={period} onSelect={(p) => onChange(to24Hour(hour, minute, p))} />
    </View>
  );
}
