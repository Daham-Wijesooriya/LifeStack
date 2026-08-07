import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Button, DateField, Input, Sheet, Text } from '@/components/ui';
import type { Transaction } from '@/db/schema';
import { todayISO } from '@/lib/date';
import type { NewTransactionInput } from '@/store/financeStore';

const CATEGORY_PRESETS = [
  'Food',
  'Transport',
  'Housing',
  'Utilities',
  'Entertainment',
  'Health',
  'Shopping',
  'Salary',
  'Other',
];

export interface TransactionFormSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: NewTransactionInput) => Promise<void>;
  onDelete?: () => Promise<void>;
  /** Present for editing an existing transaction; absent for creating a new one. */
  initialTransaction?: Transaction;
}

export function TransactionFormSheet({
  visible,
  onClose,
  onSubmit,
  onDelete,
  initialTransaction,
}: TransactionFormSheetProps) {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(todayISO());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setType(initialTransaction?.type ?? 'expense');
    setAmount(initialTransaction ? String(initialTransaction.amount) : '');
    setCategory(initialTransaction?.category ?? '');
    setNote(initialTransaction?.note ?? '');
    setDate(initialTransaction?.date ?? todayISO());
    setError(null);
  }, [visible, initialTransaction]);

  async function handleSubmit() {
    const numericAmount = Number(amount);
    if (!category.trim()) {
      setError('Category is required');
      return;
    }
    if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      setError('Enter a valid amount');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        type,
        amount: numericAmount,
        category: category.trim(),
        note: note.trim() || null,
        date,
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
          {initialTransaction ? 'Edit transaction' : 'New transaction'}
        </Text>

        <View className="flex-row gap-sm">
          <Button variant={type === 'expense' ? 'primary' : 'outline'} size="sm" onPress={() => setType('expense')}>
            Expense
          </Button>
          <Button variant={type === 'income' ? 'primary' : 'outline'} size="sm" onPress={() => setType('income')}>
            Income
          </Button>
        </View>

        <Input label="Amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" />

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

        <DateField label="Date" value={date} onChange={(value) => setDate(value ?? todayISO())} clearable={false} />
        <Input label="Note" value={note} onChangeText={setNote} placeholder="Optional" />

        {error ? (
          <Text variant="sm" color="danger">
            {error}
          </Text>
        ) : null}

        <Button variant="primary" onPress={handleSubmit} loading={submitting}>
          {initialTransaction ? 'Save changes' : 'Add transaction'}
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
