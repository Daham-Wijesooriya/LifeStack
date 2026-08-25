import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Card, Text } from '@/components/ui';

export interface StatCardProps {
  value: string;
  label: string;
  valueColor?: 'primary' | 'success' | 'danger';
  icon?: ReactNode;
  /** Small note under the label, e.g. "2 overdue" — omitted when there's nothing extra to say. */
  sublabel?: string;
  sublabelColor?: 'secondary' | 'danger' | 'success';
}

export function StatCard({ value, label, valueColor = 'primary', icon, sublabel, sublabelColor = 'secondary' }: StatCardProps) {
  return (
    <Card className="flex-1 gap-sm">
      <View className="flex-row items-center justify-between">
        <Text variant="sm" color="secondary">
          {label}
        </Text>
        {icon}
      </View>
      <Text variant="xl" weight="bold" color={valueColor}>
        {value}
      </Text>
      {sublabel ? (
        <Text variant="xs" color={sublabelColor}>
          {sublabel}
        </Text>
      ) : null}
    </Card>
  );
}
