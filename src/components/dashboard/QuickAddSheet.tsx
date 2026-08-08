import { View } from 'react-native';

import { Button, Sheet, Text } from '@/components/ui';

export type QuickAddKind = 'habit' | 'todo' | 'sleep' | 'transaction';

export interface QuickAddSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (kind: QuickAddKind) => void;
}

const OPTIONS: { kind: QuickAddKind; label: string }[] = [
  { kind: 'habit', label: 'New habit' },
  { kind: 'todo', label: 'New todo' },
  { kind: 'sleep', label: 'Sleep log' },
  { kind: 'transaction', label: 'Transaction' },
];

/** The FAB's picker — selecting an option hands off to that module's own FormSheet (see app/(tabs)/index.tsx). */
export function QuickAddSheet({ visible, onClose, onSelect }: QuickAddSheetProps) {
  return (
    <Sheet visible={visible} onClose={onClose}>
      <View className="gap-sm pb-lg">
        <Text variant="lg" weight="semibold">
          Quick add
        </Text>
        {OPTIONS.map((option) => (
          <Button key={option.kind} variant="outline" onPress={() => onSelect(option.kind)}>
            {option.label}
          </Button>
        ))}
      </View>
    </Sheet>
  );
}
