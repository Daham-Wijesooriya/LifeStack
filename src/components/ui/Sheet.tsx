import type { ReactNode } from 'react';
import { Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from '@/lib/cn';

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  contentClassName?: string;
}

/**
 * Bottom sheet built on RN's `Modal` (slide-from-bottom is built in) rather
 * than a gesture-driven library like @gorhom/bottom-sheet — no drag-to-
 * dismiss, but one fewer dependency until a screen actually needs that.
 */
export function Sheet({ visible, onClose, children, contentClassName }: SheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable
        className="flex-1 justify-end bg-black/40"
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close"
      >
        {/* Absorbs taps so they don't fall through to the backdrop's onPress above. */}
        <Pressable
          onPress={() => {}}
          style={{ paddingBottom: insets.bottom + 16 }}
          className={cn('rounded-t-xl border border-border bg-surface px-lg pt-lg', contentClassName)}
        >
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
