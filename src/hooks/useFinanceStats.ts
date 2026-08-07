import { useMemo } from 'react';

import type { Budget, Transaction } from '@/db/schema';
import { addMonthsISO, formatMonthLabel } from '@/lib/date';

const TREND_MONTHS = 6;

export interface CategoryTotal {
  category: string;
  total: number;
}

export interface BudgetProgress {
  budgetId: number;
  category: string;
  limit: number;
  actual: number;
}

export interface MonthlyTotal {
  month: string;
  label: string;
  income: number;
  expense: number;
}

export interface FinanceStats {
  monthIncome: number;
  monthExpense: number;
  monthNet: number;
  categoryTotals: CategoryTotal[];
  budgetProgress: BudgetProgress[];
  monthlyTrend: MonthlyTotal[];
}

/** All derived from already-loaded store data (see financeStore's loadMonth) — no fetching here. */
export function useFinanceStats(transactions: Transaction[], budgets: Budget[], currentMonth: string): FinanceStats {
  return useMemo(() => {
    const monthTransactions = transactions.filter((t) => t.date.startsWith(currentMonth));
    const monthExpenseTx = monthTransactions.filter((t) => t.type === 'expense');

    const monthIncome = monthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const monthExpense = monthExpenseTx.reduce((sum, t) => sum + t.amount, 0);

    const categoryMap = new Map<string, number>();
    for (const t of monthExpenseTx) {
      categoryMap.set(t.category, (categoryMap.get(t.category) ?? 0) + t.amount);
    }
    const categoryTotals = Array.from(categoryMap, ([category, total]) => ({ category, total })).sort(
      (a, b) => b.total - a.total,
    );

    const budgetProgress = budgets.map((budget) => ({
      budgetId: budget.id,
      category: budget.category,
      limit: budget.monthlyLimit,
      actual: categoryMap.get(budget.category) ?? 0,
    }));

    const trendMonths = Array.from({ length: TREND_MONTHS }, (_, i) =>
      addMonthsISO(currentMonth, i - (TREND_MONTHS - 1)),
    );
    const monthlyTrend = trendMonths.map((month) => {
      const monthTx = transactions.filter((t) => t.date.startsWith(month));
      return {
        month,
        label: formatMonthLabel(month),
        income: monthTx.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
        expense: monthTx.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
      };
    });

    return {
      monthIncome,
      monthExpense,
      monthNet: monthIncome - monthExpense,
      categoryTotals,
      budgetProgress,
      monthlyTrend,
    };
  }, [transactions, budgets, currentMonth]);
}
