import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { formatISODate } from '@/lib/date';

import { Text } from './Text';

export interface DateFieldProps {
  label?: string;
  /** YYYY-MM-DD, or null for "no date set". */
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  clearable?: boolean;
}

/**
 * Shared date picker for Todos (due date), and later Sleep (bedtime/wake)
 * and Finance (transaction date) — Android's picker is a native imperative
 * dialog while iOS renders inline, hence the platform branch.
 */
export function DateField({ label, value, onChange, placeholder = 'Select date', clearable = true }: DateFieldProps) {
  const [iosPickerVisible, setIosPickerVisible] = useState(false);
  // Local midnight, not UTC midnight: a bare "T00:00:00" (no zone suffix) is
  // parsed as local time, which round-trips correctly through formatISODate.
  const dateValue = value ? new Date(`${value}T00:00:00`) : new Date();

  function handleChange(event: DateTimePickerEvent, selected?: Date) {
    setIosPickerVisible(false);
    if (event.type === 'set' && selected) {
      onChange(formatISODate(selected));
    }
  }

  function openPicker() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({ value: dateValue, mode: 'date', onChange: handleChange });
    } else {
      setIosPickerVisible(true);
    }
  }

  return (
    <View className="gap-xs">
      {label ? (
        <Text variant="sm" weight="medium" color="secondary">
          {label}
        </Text>
      ) : null}
      <Pressable
        onPress={openPicker}
        className="flex-row items-center justify-between rounded-md border border-border bg-surface px-md py-sm"
      >
        <Text color={value ? 'primary' : 'muted'}>{value ?? placeholder}</Text>
        {clearable && value ? (
          <Pressable onPress={() => onChange(null)} hitSlop={8} accessibilityLabel="Clear date">
            <Text color="muted">✕</Text>
          </Pressable>
        ) : null}
      </Pressable>
      {Platform.OS === 'ios' && iosPickerVisible ? (
        <DateTimePicker value={dateValue} mode="date" display="inline" onChange={handleChange} />
      ) : null}
    </View>
  );
}
