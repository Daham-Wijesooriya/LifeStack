import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';
import type { Transaction } from '@/db/schema';
import { formatCurrency } from '@/lib/currency';

export interface TransactionRowProps {
  transaction: Transaction;
  onPress: () => void;
}

export function TransactionRow({ transaction, onPress }: TransactionRowProps) {
  const isIncome = transaction.type === 'income';

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between gap-md rounded-lg border border-border bg-surface p-md active:opacity-80"
    >
      <View className="flex-1 gap-xs">
        <Text weight="medium">{transaction.category}</Text>
        <Text variant="sm" color="secondary">
          {transaction.date}
          {transaction.note ? ` · ${transaction.note}` : ''}
        </Text>
      </View>
      <Text weight="semibold" color={isIncome ? 'success' : 'danger'}>
        {isIncome ? '+' : '-'}
        {formatCurrency(transaction.amount)}
      </Text>
    </Pressable>
  );
}
