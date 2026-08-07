import { View } from 'react-native';

import { EmptyState } from '@/components/ui';

export default function SleepScreen() {
  return (
    <View className="flex-1 bg-background">
      <EmptyState title="Sleep" description="Coming in a later step." />
    </View>
  );
}
