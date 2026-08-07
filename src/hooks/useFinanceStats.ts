import { useMemo } from 'react';

import type { Transaction } from '@/db/schema';

export interface CategoryTotal {
  category: string;
  total: number;
}

export interface FinanceStats {
  monthIncome: number;
  monthExpense: number;
  monthNet: number;
  categoryTotals: CategoryTotal[];
}

/**
 * All derived from already-loaded store data (see financeStore's loadMonth,
 * which now fetches only the target month — no cross-month filtering needed
 * here anymore).
 */
export function useFinanceStats(transactions: Transaction[]): FinanceStats {
  return useMemo(() => {
    const expenseTx = transactions.filter((t) => t.type === 'expense');

    const monthIncome = transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const monthExpense = expenseTx.reduce((sum, t) => sum + t.amount, 0);

    const categoryMap = new Map<string, number>();
    for (const t of expenseTx) {
      categoryMap.set(t.category, (categoryMap.get(t.category) ?? 0) + t.amount);
    }
    const categoryTotals = Array.from(categoryMap, ([category, total]) => ({ category, total })).sort(
      (a, b) => b.total - a.total,
    );

    return {
      monthIncome,
      monthExpense,
      monthNet: monthIncome - monthExpense,
      categoryTotals,
    };
  }, [transactions]);
}
