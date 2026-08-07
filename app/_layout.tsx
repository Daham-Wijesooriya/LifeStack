import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, type ReactNode } from 'react';
import { Platform, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useDatabaseMigrations } from '@/db/migrate';
import { useSettingsStore } from '@/store/settingsStore';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

/**
 * Blocks rendering until pending Drizzle migrations have run — except on
 * web, where it never calls the migration hook at all. expo-sqlite's web
 * backend is alpha and needs response headers this dev server doesn't send
 * (see src/db/client.ts), so LifeStack treats web as unsupported and shows
 * a clear notice instead of touching the db.
 */
function MigrationGate({ children }: { children: ReactNode }) {
  if (Platform.OS === 'web') {
    return (
      <View className="flex-1 items-center justify-center gap-2 bg-background px-6">
        <Text className="text-center text-lg font-semibold text-text-primary">
          Open in Expo Go or an emulator
        </Text>
        <Text className="text-center text-text-secondary">
          LifeStack uses on-device SQLite, which the web preview doesn't support.
        </Text>
      </View>
    );
  }
  return <NativeMigrationGate>{children}</NativeMigrationGate>;
}

function NativeMigrationGate({ children }: { children: ReactNode }) {
  const { success, error } = useDatabaseMigrations();
  const theme = useTheme();

  // Settings can only be read once migrations have run (the `settings`
  // table doesn't exist before that). This only needs to fire once, when
  // `success` first flips true, so it intentionally doesn't depend on
  // `theme.preference`/`theme.setPreference` — including them would just
  // re-run this on every unrelated theme change.
  useEffect(() => {
    if (!success) return;
    void useSettingsStore
      .getState()
      .load()
      .then(() => {
        const loadedPreference = useSettingsStore.getState().themePreference;
        if (loadedPreference !== theme.preference) {
          theme.setPreference(loadedPreference);
        }
      });
  }, [success]);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-center text-danger">Migration error: {error.message}</Text>
      </View>
    );
  }
  if (!success) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-text-secondary">Setting up database…</Text>
      </View>
    );
  }
  return <>{children}</>;
}

function ThemedStatusBar() {
  const { colorScheme } = useTheme();
  return <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <MigrationGate>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="settings"
              options={{ presentation: 'modal', headerShown: true, title: 'Settings' }}
            />
          </Stack>
        </MigrationGate>
        <ThemedStatusBar />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
