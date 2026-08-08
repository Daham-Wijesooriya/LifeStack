import { View } from 'react-native';

import { Text } from '@/components/ui';
import { cn } from '@/lib/cn';

export interface ActivityStripDay {
  date: string;
  /** Single-letter day label (M, T, W, ...). */
  label: string;
  /** 0-1: fraction of active habits completed that day. */
  ratio: number;
}

export interface ActivityStripProps {
  days: ActivityStripDay[];
}

/**
 * A lightweight 7-day glance, not a per-habit stat — that lives on each
 * habit's own detail screen. Three discrete tiers (none/some/all) rather
 * than continuous color blending, since there's no "color with opacity"
 * utility in the token system and one isn't worth adding for this alone.
 */
export function ActivityStrip({ days }: ActivityStripProps) {
  return (
    <View className="flex-row justify-between">
      {days.map((day) => (
        <View key={day.date} className="items-center gap-xs">
          <View
            className={cn(
              'h-8 w-8 rounded-full border-2 border-primary',
              day.ratio >= 1 ? 'bg-primary' : day.ratio > 0 ? 'bg-surface-alt' : 'bg-transparent',
            )}
          />
          <Text variant="xs" color="muted">
            {day.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
