import { View } from 'react-native';

import { Text } from '@/components/ui';
import type { BudgetProgress } from '@/hooks/useFinanceStats';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/currency';

export interface BudgetProgressRowProps {
  progress: BudgetProgress;
}

export function BudgetProgressRow({ progress }: BudgetProgressRowProps) {
  const { category, limit, actual } = progress;
  const percent = limit > 0 ? Math.min(actual / limit, 1) : 0;
  const overBudget = actual > limit;

  return (
    <View className="gap-xs">
      <View className="flex-row items-center justify-between">
        <Text variant="sm" weight="medium">
          {category}
        </Text>
        <Text variant="sm" color={overBudget ? 'danger' : 'secondary'}>
          {formatCurrency(actual)} / {formatCurrency(limit)}
        </Text>
      </View>
      <View className="h-2 overflow-hidden rounded-full bg-surface-alt">
        <View
          className={cn('h-full rounded-full', overBudget ? 'bg-danger' : 'bg-primary')}
          style={{ width: `${Math.round(percent * 100)}%` }}
        />
      </View>
    </View>
  );
}
