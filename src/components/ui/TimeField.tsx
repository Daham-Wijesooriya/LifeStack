import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { formatTimeHHmm } from '@/lib/date';

import { Text } from './Text';

export interface TimeFieldProps {
  label?: string;
  /** "HH:mm", 24-hour. */
  value: string;
  onChange: (value: string) => void;
}

function timeToDate(value: string): Date {
  const [hoursRaw, minutesRaw] = value.split(':');
  const date = new Date();
  date.setHours(Number(hoursRaw ?? 0), Number(minutesRaw ?? 0), 0, 0);
  return date;
}

/** Sibling to DateField, same Android-imperative / iOS-inline split, but for a bare time of day. */
export function TimeField({ label, value, onChange }: TimeFieldProps) {
  const [iosPickerVisible, setIosPickerVisible] = useState(false);
  const dateValue = timeToDate(value);

  function handleChange(event: DateTimePickerEvent, selected?: Date) {
    setIosPickerVisible(false);
    if (event.type === 'set' && selected) {
      onChange(formatTimeHHmm(selected));
    }
  }

  function openPicker() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({ value: dateValue, mode: 'time', onChange: handleChange });
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
      <Pressable onPress={openPicker} className="rounded-md border border-border bg-surface px-md py-sm">
        <Text>{value}</Text>
      </Pressable>
      {Platform.OS === 'ios' && iosPickerVisible ? (
        <DateTimePicker value={dateValue} mode="time" display="spinner" onChange={handleChange} />
      ) : null}
    </View>
  );
}
