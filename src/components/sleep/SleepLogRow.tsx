import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';
import type { SleepLog } from '@/db/schema';
import { formatDurationMinutes } from '@/lib/date';

export interface SleepLogRowProps {
  log: SleepLog;
  onPress: () => void;
}

export function SleepLogRow({ log, onPress }: SleepLogRowProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between rounded-lg border border-border bg-surface p-md active:opacity-80"
    >
      <View className="gap-xs">
        <Text weight="medium">{log.date}</Text>
        <Text variant="sm" color="secondary">
          {formatDurationMinutes(log.durationMinutes)} · Quality {log.quality}/5
        </Text>
      </View>
    </Pressable>
  );
}
