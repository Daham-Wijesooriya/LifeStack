import { View, type ViewProps } from 'react-native';

import { cn } from '@/lib/cn';

export type CardProps = ViewProps;

/**
 * Plain themed container — intentionally not pressable. Screens that need a
 * tappable card (habit rows, todo rows, ...) compose their own `Pressable`
 * around/inside it; those rows tend to need custom layouts anyway, so a
 * generic "PressableCard" variant would just be an API no one reuses as-is.
 */
export function Card({ className, ...props }: CardProps) {
  return <View className={cn('rounded-lg border border-border bg-surface p-lg', className)} {...props} />;
}
