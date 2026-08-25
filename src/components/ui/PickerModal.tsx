import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Button } from './Button';
import { Text } from './Text';

export interface PickerModalProps {
  visible: boolean;
  title: string;
  onCancel: () => void;
  onDone: () => void;
  doneDisabled?: boolean;
  /** Optional slot to the left of Cancel/Done, e.g. DateField's "Today" shortcut. */
  footerLeft?: ReactNode;
  children: ReactNode;
}

/**
 * Centered dialog for DateField/TimeField's custom pickers. Deliberately a
 * centered card, not another bottom Sheet — the field itself already lives
 * inside one (a form sheet), and stacking two bottom sheets would read as
 * confusing/layered. Selection only commits when Done is pressed; backdrop
 * tap or the hardware back button cancels, mirroring Sheet's onRequestClose.
 */
export function PickerModal({ visible, title, onCancel, onDone, doneDisabled, footerLeft, children }: PickerModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View className="flex-1 items-center justify-center bg-black/40 px-lg">
        {/*
         * Full-screen backdrop as a sibling BEHIND the card, not a Pressable
         * wrapping it. A Pressable ancestor can win the touch-responder race
         * against a descendant ScrollView on Android and swallow its drag
         * gestures entirely (this is what was breaking the wheel picker's
         * scroll, even with a plain View absorber in between) — as a sibling
         * it only ever sees taps that land outside the card.
         */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />
        <View className="w-full max-w-sm overflow-hidden rounded-xl border border-border bg-surface">
          <View className="gap-md p-lg">
            <Text variant="lg" weight="semibold">
              {title}
            </Text>
            {children}
          </View>
          <View className="flex-row items-center justify-between border-t border-border px-lg py-sm">
            <View>{footerLeft}</View>
            <View className="flex-row gap-sm">
              <Button variant="ghost" size="md" onPress={onCancel}>
                Cancel
              </Button>
              <Button variant="primary" size="md" onPress={onDone} disabled={doneDisabled}>
                Done
              </Button>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
