import { View } from 'react-native';

import { EmptyState } from '@/components/ui';

export default function TodosScreen() {
  return (
    <View className="flex-1 bg-background">
      <EmptyState title="Todos" description="Coming in a later step." />
    </View>
  );
}
