import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { Sheet, Text } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';

export type QuickAddKind = 'habit' | 'todo' | 'sleep' | 'transaction';

export interface QuickAddSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (kind: QuickAddKind) => void;
}

interface QuickAddOption {
  kind: QuickAddKind;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** Mirrors the icon color each destination screen already uses for this category (flame/warning for habits, moon/info for sleep, ...), so the picker previews where you're headed instead of looking like an unrelated menu. */
  color: 'warning' | 'primary' | 'info' | 'success';
}

const OPTIONS: QuickAddOption[] = [
  { kind: 'habit', label: 'New habit', description: 'Track something daily or weekly', icon: 'flame-outline', color: 'warning' },
  { kind: 'todo', label: 'New todo', description: 'Add a task to your day', icon: 'list-outline', color: 'primary' },
  { kind: 'sleep', label: 'Sleep log', description: 'Log last night’s rest', icon: 'moon-outline', color: 'info' },
  { kind: 'transaction', label: 'Transaction', description: 'Record income or an expense', icon: 'wallet-outline', color: 'success' },
];

/** The FAB's picker — selecting an option hands off to that module's own FormSheet (see app/(tabs)/index.tsx). */
export function QuickAddSheet({ visible, onClose, onSelect }: QuickAddSheetProps) {
  const { colors } = useTheme();

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View className="gap-sm pb-lg">
        <Text variant="lg" weight="semibold">
          Quick add
        </Text>
        <View className="gap-sm">
          {OPTIONS.map((option) => (
            <Pressable
              key={option.kind}
              onPress={() => onSelect(option.kind)}
              className="flex-row items-center gap-md rounded-lg border border-border bg-surface p-md active:opacity-80"
            >
              <View
                className="h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: `${colors[option.color]}26` }}
              >
                <Ionicons name={option.icon} size={18} color={colors[option.color]} />
              </View>
              <View className="flex-1">
                <Text weight="medium">{option.label}</Text>
                <Text variant="xs" color="secondary">
                  {option.description}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>
          ))}
        </View>
      </View>
    </Sheet>
  );
}
