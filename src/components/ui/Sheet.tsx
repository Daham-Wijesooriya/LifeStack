import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView } from 'react-native';
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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/*
       * `Modal` mounts this subtree in its own native window, so a
       * KeyboardAvoidingView anywhere outside it (e.g. in the root layout)
       * would never see the keyboard events — it has to live in here.
       */}
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable
          className="flex-1 justify-end bg-black/40"
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          {/* Absorbs taps so they don't fall through to the backdrop's onPress above. */}
          <Pressable
            onPress={() => {}}
            className={cn(
              'max-h-[85%] overflow-hidden rounded-t-xl border border-border bg-surface',
              contentClassName,
            )}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
              className="px-lg pt-lg"
            >
              {children}
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
