import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button, Input, Sheet, Text } from '@/components/ui';
import type { Habit } from '@/db/schema';
import { cn } from '@/lib/cn';
import type { NewHabitInput } from '@/store/habitsStore';

const COLOR_PRESETS = ['#5B5BD6', '#1E9E6A', '#D0403A', '#B8860B', '#2E7BC4', '#C2469B'] as const;

export interface HabitFormSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: NewHabitInput) => Promise<void>;
  /** Present for editing an existing habit; absent for creating a new one. */
  initialHabit?: Habit;
}

export function HabitFormSheet({ visible, onClose, onSubmit, initialHabit }: HabitFormSheetProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('✅');
  const [color, setColor] = useState<string>(COLOR_PRESETS[0]);
  const [frequencyType, setFrequencyType] = useState<'daily' | 'weekly'>('daily');
  const [targetPerWeek, setTargetPerWeek] = useState('3');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset the form to the habit being edited (or blank, for a new one)
  // every time the sheet opens, rather than on every `initialHabit` change.
  useEffect(() => {
    if (!visible) return;
    setName(initialHabit?.name ?? '');
    setIcon(initialHabit?.icon ?? '✅');
    setColor(initialHabit?.color ?? COLOR_PRESETS[0]);
    setFrequencyType(initialHabit?.frequencyType ?? 'daily');
    setTargetPerWeek(String(initialHabit?.targetPerWeek ?? 3));
    setError(null);
  }, [visible, initialHabit]);

  async function handleSubmit() {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        icon: icon.trim() || '✅',
        color,
        frequencyType,
        targetPerWeek: frequencyType === 'weekly' ? Math.max(1, Number(targetPerWeek) || 1) : null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View className="gap-md pb-lg">
        <Text variant="lg" weight="semibold">
          {initialHabit ? 'Edit habit' : 'New habit'}
        </Text>

        <Input label="Name" value={name} onChangeText={setName} placeholder="Drink water" />
        <Input label="Icon (emoji)" value={icon} onChangeText={setIcon} placeholder="💧" maxLength={2} />

        <View className="gap-xs">
          <Text variant="sm" weight="medium" color="secondary">
            Color
          </Text>
          <View className="flex-row gap-sm">
            {COLOR_PRESETS.map((preset) => (
              <Pressable
                key={preset}
                onPress={() => setColor(preset)}
                accessibilityRole="radio"
                accessibilityState={{ checked: color === preset }}
                accessibilityLabel={`Color ${preset}`}
                className={cn(
                  'h-8 w-8 rounded-full border-2',
                  color === preset ? 'border-text-primary' : 'border-transparent',
                )}
                style={{ backgroundColor: preset }}
              />
            ))}
          </View>
        </View>

        <View className="gap-xs">
          <Text variant="sm" weight="medium" color="secondary">
            Frequency
          </Text>
          <View className="flex-row gap-sm">
            <Button
              variant={frequencyType === 'daily' ? 'primary' : 'outline'}
              size="sm"
              onPress={() => setFrequencyType('daily')}
            >
              Daily
            </Button>
            <Button
              variant={frequencyType === 'weekly' ? 'primary' : 'outline'}
              size="sm"
              onPress={() => setFrequencyType('weekly')}
            >
              N×/week
            </Button>
          </View>
        </View>

        {frequencyType === 'weekly' ? (
          <Input
            label="Times per week"
            value={targetPerWeek}
            onChangeText={setTargetPerWeek}
            keyboardType="number-pad"
          />
        ) : null}

        {error ? (
          <Text variant="sm" color="danger">
            {error}
          </Text>
        ) : null}

        <Button variant="primary" onPress={handleSubmit} loading={submitting}>
          {initialHabit ? 'Save changes' : 'Create habit'}
        </Button>
      </View>
    </Sheet>
  );
}
