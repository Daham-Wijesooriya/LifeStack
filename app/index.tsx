import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Button, Card, Text } from '@/components/ui';
import { db } from '@/db/client';
import { createRepositories } from '@/db/repositories';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Temporary smoke-test screen — proves migrations ran, repositories are
 * reachable, and the UI component library renders correctly. Gets replaced
 * by the tab structure + Dashboard in a later step.
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
    <View className="flex-1 items-center justify-center gap-lg bg-background px-xl">
      <Card className="w-full gap-sm">
        <Text variant="2xl" weight="bold">
          LifeStack
        </Text>
        <Text variant="sm" color="secondary">
          {status}
        </Text>
        <Text variant="sm" color="muted">
          Current theme: {colorScheme}
        </Text>
      </Card>
      <Button variant="primary" onPress={() => setPreference(colorScheme === 'dark' ? 'light' : 'dark')}>
        Toggle theme
      </Button>
    </View>
  );
}
