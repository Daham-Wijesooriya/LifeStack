import { View } from 'react-native';

import { EmptyState } from '@/components/ui';

export default function DashboardScreen() {
  return (
    <View className="flex-1 bg-background">
      <EmptyState
        title="Dashboard"
        description="Today's summary across all modules lands here once they're all built."
      />
    </View>
  );
}
