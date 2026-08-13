import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { PickerModal } from './PickerModal';
import { Text } from './Text';
import { TimeWheelPicker } from './TimeWheelPicker';

export interface TimeFieldProps {
  label?: string;
  /** "HH:mm", 24-hour. */
  value: string;
  onChange: (value: string) => void;
}

/**
 * Sibling to DateField — same custom modal, staged-until-Done pattern, for a
 * bare time of day. Replaces the native spinner (which used to overflow the
 * sheet on small screens) with a custom wheel we fully control the layout of.
 */
export function TimeField({ label, value, onChange }: TimeFieldProps) {
  const [visible, setVisible] = useState(false);
  const [staged, setStaged] = useState(value);

  function open() {
    setStaged(value);
    setVisible(true);
  }

  function commit() {
    onChange(staged);
    setVisible(false);
  }

  return (
    <View className="gap-xs">
      {label ? (
        <Text variant="sm" weight="medium" color="secondary">
          {label}
        </Text>
      ) : null}
      <Pressable onPress={open} className="rounded-md border border-border bg-surface px-md py-sm">
        <Text>{value}</Text>
      </Pressable>
      <PickerModal visible={visible} title={label ?? 'Select time'} onCancel={() => setVisible(false)} onDone={commit}>
        <TimeWheelPicker value={staged} onChange={setStaged} />
      </PickerModal>
    </View>
  );
}
