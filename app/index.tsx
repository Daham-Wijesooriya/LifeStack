import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { db } from '@/db/client';
import { createRepositories } from '@/db/repositories';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Temporary smoke-test screen — proves migrations ran, repositories are
 * reachable, and NativeWind/theme tokens render correctly. Gets replaced by
 * the tab structure + Dashboard in a later step.
 */
export default function SmokeTestScreen() {
  const { colorScheme, setPreference } = useTheme();
  const [status, setStatus] = useState<string>('Querying database…');

  useEffect(() => {
    const repos = createRepositories(db);
    Promise.all([
      repos.habits.getAll(),
      repos.todos.getAll(),
      repos.sleep.getAll(),
      repos.transactions.getAll(),
      repos.budgets.getAll(),
    ])
      .then(() => setStatus('Migrations ran, all 5 repositories reachable ✅'))
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        setStatus(`Database query failed: ${message}`);
      });
  }, []);

  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background px-6">
      <Text className="text-2xl font-semibold text-text-primary">LifeStack</Text>
      <Text className="text-center text-text-secondary">{status}</Text>
      <Text className="text-text-muted">Current theme: {colorScheme}</Text>
      <Pressable
        onPress={() => setPreference(colorScheme === 'dark' ? 'light' : 'dark')}
        className="rounded-lg bg-primary px-4 py-2"
      >
        <Text className="text-primary-text">Toggle theme</Text>
      </Pressable>
    </View>
  );
}
