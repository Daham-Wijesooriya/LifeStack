import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { EmptyState, Text } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';

export default function DashboardScreen() {
  const { colors } = useTheme();

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-lg pt-lg">
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
