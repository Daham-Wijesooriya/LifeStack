import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';

import {
  BudgetFormSheet,
  BudgetProgressRow,
  CategoryPieChart,
  MonthlyTrendChart,
  TransactionFormSheet,
  TransactionRow,
} from '@/components/finance';
import { Button, Card, EmptyState, Text } from '@/components/ui';
import type { Transaction } from '@/db/schema';
import { useFinanceStats } from '@/hooks/useFinanceStats';
import { addMonthsISO, formatMonthLabel } from '@/lib/date';
import { formatCurrency } from '@/lib/currency';
import { useFinanceStore } from '@/store/financeStore';

export default function FinanceScreen() {
  const {
    currentMonth,
    transactions,
    budgets,
    status,
    error,
    loadMonth,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    setBudget,
  } = useFinanceStore();

  const [transactionFormVisible, setTransactionFormVisible] = useState(false);
  const [budgetFormVisible, setBudgetFormVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);

  useEffect(() => {
    void loadMonth();
  }, [loadMonth]);

  const stats = useFinanceStats(transactions, budgets, currentMonth);

  const monthTransactions = useMemo(
    () => transactions.filter((t) => t.date.startsWith(currentMonth)).sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, currentMonth],
  );

  function openCreateTransaction() {
    setEditingTransaction(undefined);
    setTransactionFormVisible(true);
  }

  function openEditTransaction(transaction: Transaction) {
    setEditingTransaction(transaction);
    setTransactionFormVisible(true);
  }

  if (status === 'loading' || status === 'idle') {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text color="secondary">Loading finances…</Text>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View className="flex-1 items-center justify-center bg-background px-xl">
        <Text color="danger">{error}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background px-lg pt-lg">
      <View className="flex-row items-center justify-between pb-md">
        <Pressable onPress={() => void loadMonth(addMonthsISO(currentMonth, -1))} hitSlop={8}>
          <Text variant="lg">‹</Text>
        </Pressable>
        <Text variant="lg" weight="semibold">
          {formatMonthLabel(currentMonth)}
        </Text>
        <Pressable onPress={() => void loadMonth(addMonthsISO(currentMonth, 1))} hitSlop={8}>
          <Text variant="lg">›</Text>
        </Pressable>
      </View>

      <FlatList
        data={monthTransactions}
        keyExtractor={(transaction) => String(transaction.id)}
        contentContainerClassName="gap-sm pb-2xl"
        ListHeaderComponent={
          <View className="gap-md pb-md">
            <View className="flex-row gap-md">
              <Card className="flex-1 items-center">
                <Text variant="lg" weight="bold" color="success">
                  {formatCurrency(stats.monthIncome)}
                </Text>
                <Text variant="sm" color="secondary">
                  income
                </Text>
              </Card>
              <Card className="flex-1 items-center">
                <Text variant="lg" weight="bold" color="danger">
                  {formatCurrency(stats.monthExpense)}
                </Text>
                <Text variant="sm" color="secondary">
                  expenses
                </Text>
              </Card>
              <Card className="flex-1 items-center">
                <Text variant="lg" weight="bold">
                  {formatCurrency(stats.monthNet)}
                </Text>
                <Text variant="sm" color="secondary">
                  net
                </Text>
              </Card>
            </View>

            <Card className="gap-sm">
              <Text weight="semibold">Monthly trend</Text>
              <MonthlyTrendChart data={stats.monthlyTrend} />
            </Card>

            <Card className="gap-sm">
              <Text weight="semibold">Spending by category</Text>
              <CategoryPieChart categories={stats.categoryTotals} />
            </Card>

            <Card className="gap-md">
              <View className="flex-row items-center justify-between">
                <Text weight="semibold">Budget vs actual</Text>
                <Button variant="ghost" size="sm" onPress={() => setBudgetFormVisible(true)}>
                  + Add
                </Button>
              </View>
              {stats.budgetProgress.length === 0 ? (
                <Text variant="sm" color="secondary">
                  No budgets set for this month yet.
                </Text>
              ) : (
                <View className="gap-md">
                  {stats.budgetProgress.map((progress) => (
                    <BudgetProgressRow key={progress.budgetId} progress={progress} />
                  ))}
                </View>
              )}
            </Card>

            <Text weight="semibold">Transactions</Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="No transactions this month"
            description="Log an income or expense to get started."
            actionLabel="Add transaction"
            onAction={openCreateTransaction}
          />
        }
        renderItem={({ item }) => <TransactionRow transaction={item} onPress={() => openEditTransaction(item)} />}
        ListFooterComponent={
          <Button variant="outline" onPress={openCreateTransaction} className="mt-sm">
            + Add transaction
          </Button>
        }
      />

      <TransactionFormSheet
        visible={transactionFormVisible}
        onClose={() => setTransactionFormVisible(false)}
        initialTransaction={editingTransaction}
        onSubmit={async (input) => {
          if (editingTransaction) {
            await updateTransaction(editingTransaction.id, input);
          } else {
            await createTransaction(input);
          }
        }}
        onDelete={
          editingTransaction
            ? async () => {
                await deleteTransaction(editingTransaction.id);
              }
            : undefined
        }
      />

      <BudgetFormSheet
        visible={budgetFormVisible}
        onClose={() => setBudgetFormVisible(false)}
        onSubmit={async (category, limit) => {
          await setBudget(category, limit);
        }}
      />
    </View>
  );
}
