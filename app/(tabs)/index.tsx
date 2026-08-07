import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, Text } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';

export default function DashboardScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background">
      {/*
       * No screen in the (tabs) group gets a native header (headerShown is
       * false at both the Tabs and root-Stack level), so this row has to
       * account for the safe-area top inset itself — a flat `pt-lg` would
       * put the gear icon under the status bar / notch on real devices.
       */}
      <View className="flex-row items-center justify-between px-lg" style={{ paddingTop: insets.top + 16 }}>
        <Text variant="xl" weight="semibold">
          Dashboard
        </Text>
        <Pressable
          onPress={() => router.push('/settings')}
          accessibilityRole="button"
          accessibilityLabel="Settings"
          hitSlop={8}
        >
          <Ionicons name="settings-outline" size={22} color={colors.textPrimary} />
        </Pressable>
      </View>
      <EmptyState
        title="Nothing here yet"
        description="Today's summary across all modules lands here once they're all built."
      />
    </View>
  );
}
