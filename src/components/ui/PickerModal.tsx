import type { ReactNode } from 'react';
import { Modal, Pressable, View } from 'react-native';

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
      <Pressable
        className="flex-1 items-center justify-center bg-black/40 px-lg"
        onPress={onCancel}
        accessibilityRole="button"
        accessibilityLabel="Close"
      >
        {/* Absorbs taps so they don't fall through to the backdrop's onPress above. */}
        <Pressable
          onPress={() => {}}
          className="w-full max-w-sm overflow-hidden rounded-xl border border-border bg-surface"
        >
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
        </Pressable>
      </Pressable>
    </Modal>
  );
}
