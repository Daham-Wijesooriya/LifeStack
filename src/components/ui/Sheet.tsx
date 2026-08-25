import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
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
      {/*
       * `Modal` mounts this subtree in its own native window, so a
       * KeyboardAvoidingView anywhere outside it (e.g. in the root layout)
       * would never see the keyboard events — it has to live in here.
       */}
      <KeyboardAvoidingView className="flex-1" behavior="padding">
        <View className="flex-1 justify-end bg-black/40">
          {/*
           * Full-screen backdrop as a sibling BEHIND the card, not a
           * Pressable wrapping it (same fix as PickerModal). A Pressable
           * ancestor can win the touch-responder race against a descendant
           * ScrollView on Android and swallow its drag gestures entirely —
           * here that's the sheet's own content ScrollView. As a sibling
           * the backdrop only ever sees taps outside the card.
           */}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
          />
          <View
            className={cn(
              'max-h-[85%] overflow-hidden rounded-t-xl border border-border bg-surface',
              contentClassName,
            )}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
              className="px-lg pt-lg"
            >
              {children}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
