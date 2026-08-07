import { View } from 'react-native';

import { EmptyState } from '@/components/ui';

export default function FinanceScreen() {
  return (
    <View className="flex-1 bg-background">
      <EmptyState title="Finance" description="Coming in a later step." />
    </View>
  );
}
