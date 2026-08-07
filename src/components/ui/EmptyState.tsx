import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

import { cn } from '@/lib/cn';

import { Button } from './Button';
import { Text } from './Text';

export interface EmptyStateProps extends ViewProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <View className={cn('flex-1 items-center justify-center gap-sm px-xl py-2xl', className)} {...props}>
      {icon}
      <Text variant="lg" weight="semibold" className="text-center">
        {title}
      </Text>
      {description ? (
        <Text variant="sm" color="secondary" className="text-center">
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button variant="primary" size="sm" onPress={onAction} className="mt-sm">
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}
