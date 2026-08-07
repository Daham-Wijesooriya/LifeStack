import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Button, Input, Sheet, Text } from '@/components/ui';

const CATEGORY_PRESETS = ['Food', 'Transport', 'Housing', 'Utilities', 'Entertainment', 'Health', 'Shopping', 'Other'];

export interface BudgetFormSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (category: string, monthlyLimit: number) => Promise<void>;
}

/** Sets (or replaces) the current month's limit for a category — budgets are upserted by (category, month), so "new" and "edit" are the same action. */
export function BudgetFormSheet({ visible, onClose, onSubmit }: BudgetFormSheetProps) {
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setCategory('');
    setLimit('');
    setError(null);
  }, [visible]);

  async function handleSubmit() {
    const numericLimit = Number(limit);
    if (!category.trim()) {
      setError('Category is required');
      return;
    }
    if (!limit || Number.isNaN(numericLimit) || numericLimit <= 0) {
      setError('Enter a valid monthly limit');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(category.trim(), numericLimit);
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
          Set a budget
        </Text>

        <View className="gap-xs">
          <Text variant="sm" weight="medium" color="secondary">
            Category
          </Text>
          <View className="flex-row flex-wrap gap-sm">
            {CATEGORY_PRESETS.map((preset) => (
              <Button
                key={preset}
                variant={category === preset ? 'primary' : 'outline'}
                size="sm"
                onPress={() => setCategory(preset)}
              >
                {preset}
              </Button>
            ))}
          </View>
          <Input value={category} onChangeText={setCategory} placeholder="Or type a custom category" />
        </View>

        <Input
          label="Monthly limit"
          value={limit}
          onChangeText={setLimit}
          keyboardType="decimal-pad"
          placeholder="0.00"
        />

        {error ? (
          <Text variant="sm" color="danger">
            {error}
          </Text>
        ) : null}

        <Button variant="primary" onPress={handleSubmit} loading={submitting}>
          Save budget
        </Button>
      </View>
    </Sheet>
  );
}
