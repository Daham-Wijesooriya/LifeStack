import { useMemo } from 'react';

import type { Transaction } from '@/db/schema';

export interface CategoryTotal {
  category: string;
  total: number;
}

export interface FinanceStats {
  monthIncome: number;
  monthExpense: number;
  /** This month's own income − expense, not counting anything carried over. */
  monthOwnNet: number;
  /** Running balance: last month's net (which itself carries the month before it, and so on) plus this month's own net. */
  monthNet: number;
  categoryTotals: CategoryTotal[];
}

/**
 * All derived from already-loaded store data (see financeStore's loadMonth,
 * which now fetches only the target month — no cross-month filtering needed
 * here anymore) plus `carryIn`, the running balance rolled forward from
 * every prior month.
 */
export function useFinanceStats(transactions: Transaction[], carryIn: number = 0): FinanceStats {
  return useMemo(() => {
    const expenseTx = transactions.filter((t) => t.type === 'expense');

    const monthIncome = transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const monthExpense = expenseTx.reduce((sum, t) => sum + t.amount, 0);
    const monthOwnNet = monthIncome - monthExpense;

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
      monthOwnNet,
      monthNet: carryIn + monthOwnNet,
      categoryTotals,
    };
  }, [transactions, carryIn]);
}
