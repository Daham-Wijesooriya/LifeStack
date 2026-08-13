import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { todayISO } from '@/lib/date';

import { Button } from './Button';
import { CalendarPicker } from './CalendarPicker';
import { PickerModal } from './PickerModal';
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
 * Shared date picker for Todos (due date), Sleep (bedtime/wake), and Finance
 * (transaction date) — a custom calendar-grid modal matching the app's own
 * look, not the OS native picker. Selection is staged locally and only
 * committed via onChange when Done is pressed.
 */
export function DateField({ label, value, onChange, placeholder = 'Select date', clearable = true }: DateFieldProps) {
  const [visible, setVisible] = useState(false);
  const [monthISO, setMonthISO] = useState(() => (value ?? todayISO()).slice(0, 7));
  const [stagedISO, setStagedISO] = useState<string | null>(value);

  function open() {
    setStagedISO(value);
    setMonthISO((value ?? todayISO()).slice(0, 7));
    setVisible(true);
  }

  function commit() {
    onChange(stagedISO);
    setVisible(false);
  }

  function jumpToToday() {
    const today = todayISO();
    setMonthISO(today.slice(0, 7));
    setStagedISO(today);
  }

  return (
    <View className="gap-xs">
      {label ? (
        <Text variant="sm" weight="medium" color="secondary">
          {label}
        </Text>
      ) : null}
      <Pressable
        onPress={open}
        className="flex-row items-center justify-between rounded-md border border-border bg-surface px-md py-sm"
      >
        <Text color={value ? 'primary' : 'muted'}>{value ?? placeholder}</Text>
        {clearable && value ? (
          <Pressable onPress={() => onChange(null)} hitSlop={8} accessibilityLabel="Clear date">
            <Text color="muted">✕</Text>
          </Pressable>
        ) : null}
      </Pressable>
      <PickerModal
        visible={visible}
        title={label ?? 'Select date'}
        onCancel={() => setVisible(false)}
        onDone={commit}
        doneDisabled={stagedISO === null}
        footerLeft={
          <Button variant="ghost" size="sm" hitSlop={8} onPress={jumpToToday}>
            Today
          </Button>
        }
      >
        <CalendarPicker monthISO={monthISO} onMonthChange={setMonthISO} selectedISO={stagedISO} onSelect={setStagedISO} />
      </PickerModal>
    </View>
  );
}
