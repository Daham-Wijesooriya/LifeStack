import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Card, Text, type TextColor, type TextVariant } from '@/components/ui';
import { cn } from '@/lib/cn';

export interface StatCardProps {
  value: string;
  label: string;
  valueColor?: TextColor;
  valueVariant?: TextVariant;
  icon?: ReactNode;
  /** Small note under the label, e.g. "2 overdue" — omitted when there's nothing extra to say. */
  sublabel?: string;
  sublabelColor?: TextColor;
  className?: string;
}

export function StatCard({
  value,
  label,
  valueColor = 'primary',
  valueVariant = 'xl',
  icon,
  sublabel,
  sublabelColor = 'secondary',
  className,
}: StatCardProps) {
  return (
    <Card className={cn('gap-sm', className ?? 'flex-1')}>
      <View className="flex-row items-center justify-between">
        <Text variant="sm" color="secondary" numberOfLines={1}>
          {label}
        </Text>
        {icon}
      </View>
      <Text
        variant={valueVariant}
        weight="bold"
        color={valueColor}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {value}
      </Text>
      {sublabel ? (
        <Text variant="xs" color={sublabelColor} numberOfLines={2}>
          {sublabel}
        </Text>
      ) : null}
    </Card>
  );
}
