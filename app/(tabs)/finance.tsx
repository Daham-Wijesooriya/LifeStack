import { useEffect, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryPieChart, TransactionFormSheet, TransactionRow } from '@/components/finance';
import { Button, Card, EmptyState, Text } from '@/components/ui';
import type { Transaction } from '@/db/schema';
import { useFinanceStats } from '@/hooks/useFinanceStats';
import { formatCurrency } from '@/lib/currency';
import { addMonthsISO, formatMonthLabel } from '@/lib/date';
import { useFinanceStore } from '@/store/financeStore';
import { useSettingsStore } from '@/store/settingsStore';

export default function FinanceScreen() {
  const insets = useSafeAreaInsets();
  const { currentMonth, transactions, status, error, loadMonth, createTransaction, updateTransaction, deleteTransaction } =
    useFinanceStore();
  const currency = useSettingsStore((state) => state.currency);

  const [transactionFormVisible, setTransactionFormVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);

  useEffect(() => {
    void loadMonth();
  }, [loadMonth]);

  const stats = useFinanceStats(transactions);
  const sortedTransactions = [...transactions].sort((a, b) => b.date.localeCompare(a.date));

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
    // No (tabs) screen gets a native header, so the safe-area top inset has
    // to be handled here explicitly — see app/(tabs)/index.tsx for the same
    // fix and why a flat pt-lg isn't enough on notched devices.
    <View className="flex-1 bg-background px-lg" style={{ paddingTop: insets.top + 16 }}>
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
        data={sortedTransactions}
        keyExtractor={(transaction) => String(transaction.id)}
        contentContainerClassName="gap-sm pb-2xl"
        ListHeaderComponent={
          <View className="gap-md pb-md">
            <View className="flex-row gap-md">
              <Card className="flex-1 items-center">
                <Text variant="lg" weight="bold" color="success">
                  {formatCurrency(stats.monthIncome, currency)}
                </Text>
                <Text variant="sm" color="secondary">
                  income
                </Text>
              </Card>
              <Card className="flex-1 items-center">
                <Text variant="lg" weight="bold" color="danger">
                  {formatCurrency(stats.monthExpense, currency)}
                </Text>
                <Text variant="sm" color="secondary">
                  expenses
                </Text>
              </Card>
              <Card className="flex-1 items-center">
                <Text variant="lg" weight="bold">
                  {formatCurrency(stats.monthNet, currency)}
                </Text>
                <Text variant="sm" color="secondary">
                  net
                </Text>
              </Card>
            </View>

            <Card className="gap-sm">
              <Text weight="semibold">Spending by category</Text>
              <CategoryPieChart categories={stats.categoryTotals} />
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
        renderItem={({ item }) => (
          <TransactionRow transaction={item} currency={currency} onPress={() => openEditTransaction(item)} />
        )}
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
    </View>
  );
}
