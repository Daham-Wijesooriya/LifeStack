import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button, DateField, Input, Sheet, Text, TimeField } from '@/components/ui';
import type { SleepLog } from '@/db/schema';
import { cn } from '@/lib/cn';
import { combineDateAndTimeISO, formatTimeHHmm, inferBedtimeDateISO, minutesBetweenISO, todayISO } from '@/lib/date';
import type { NewSleepLogInput } from '@/store/sleepStore';

const QUALITY_LEVELS = [1, 2, 3, 4, 5] as const;

export interface SleepLogFormSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: NewSleepLogInput) => Promise<void>;
  onDelete?: () => Promise<void>;
  /** Present for editing an existing log; absent for creating a new one. */
  initialLog?: SleepLog;
}

export function SleepLogFormSheet({ visible, onClose, onSubmit, onDelete, initialLog }: SleepLogFormSheetProps) {
  const [date, setDate] = useState(todayISO());
  const [bedtime, setBedtime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [quality, setQuality] = useState(3);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setDate(initialLog?.date ?? todayISO());
    setBedtime(initialLog ? formatTimeHHmm(new Date(initialLog.bedtime)) : '23:00');
    setWakeTime(initialLog ? formatTimeHHmm(new Date(initialLog.wakeTime)) : '07:00');
    setQuality(initialLog?.quality ?? 3);
    setNotes(initialLog?.notes ?? '');
    setError(null);
  }, [visible, initialLog]);

  async function handleSubmit() {
    if (!date) {
      setError('Date is required');
      return;
    }
    const bedtimeISO = combineDateAndTimeISO(inferBedtimeDateISO(date, bedtime), bedtime);
    const wakeISO = combineDateAndTimeISO(date, wakeTime);
    const durationMinutes = minutesBetweenISO(bedtimeISO, wakeISO);

    if (durationMinutes <= 0) {
      setError("Wake time has to be after bedtime — double check the times you picked.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        date,
        bedtime: bedtimeISO,
        wakeTime: wakeISO,
        durationMinutes,
        quality,
        notes: notes.trim() || null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    setSubmitting(true);
    try {
      await onDelete();
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View className="gap-md pb-lg">
        <Text variant="lg" weight="semibold">
          {initialLog ? 'Edit sleep log' : 'New sleep log'}
        </Text>

        <DateField label="Date (wake day)" value={date} onChange={(value) => setDate(value ?? todayISO())} clearable={false} />

        {/*
         * Stacked full-width, not side by side — the iOS spinner picker that
         * pops up under each field needs close to the full sheet width for
         * its hour/minute wheels. Squeezed into a half column, it overflowed
         * past the right edge (worse for Wake time, being the right column).
         */}
        <TimeField label="Bedtime" value={bedtime} onChange={setBedtime} />
        <TimeField label="Wake time" value={wakeTime} onChange={setWakeTime} />

        <View className="gap-xs">
          <Text variant="sm" weight="medium" color="secondary">
            Quality
          </Text>
          <View className="flex-row gap-sm">
            {QUALITY_LEVELS.map((level) => (
              <Pressable
                key={level}
                onPress={() => setQuality(level)}
                accessibilityRole="radio"
                accessibilityState={{ checked: quality === level }}
                accessibilityLabel={`Quality ${level} of 5`}
                className={cn(
                  'h-10 w-10 items-center justify-center rounded-full border-2 border-primary',
                  quality === level && 'bg-primary',
                )}
              >
                <Text color={quality === level ? 'onPrimary' : 'primary'} weight="medium">
                  {level}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Input label="Notes" value={notes} onChangeText={setNotes} placeholder="Optional" multiline numberOfLines={2} />

        {error ? (
          <Text variant="sm" color="danger">
            {error}
          </Text>
        ) : null}

        <Button variant="primary" onPress={handleSubmit} loading={submitting}>
          {initialLog ? 'Save changes' : 'Add sleep log'}
        </Button>
        {onDelete ? (
          <Button variant="danger" onPress={handleDelete} loading={submitting}>
            Delete
          </Button>
        ) : null}
      </View>
    </Sheet>
  );
}
