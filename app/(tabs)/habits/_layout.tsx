import { Stack } from 'expo-router';

import { useTheme } from '@/theme/ThemeProvider';

export default function HabitsStackLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      {/* The list screen builds its own in-content title/subtitle header, so the native bar here would just duplicate it. */}
      <Stack.Screen name="index" options={{ title: 'Habits', headerShown: false }} />
      <Stack.Screen name="[id]" options={{ title: 'Habit' }} />
    </Stack>
  );
}
