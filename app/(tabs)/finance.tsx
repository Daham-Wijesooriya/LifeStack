import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StatCard } from '@/components/dashboard';
import { CategoryPieChart, TransactionFormSheet, TransactionRow } from '@/components/finance';
import { Card, EmptyState, Text } from '@/components/ui';
import type { Transaction } from '@/db/schema';
import { useFinanceStats } from '@/hooks/useFinanceStats';
import { formatCurrency } from '@/lib/currency';
import { addMonthsISO, formatMonthLabel } from '@/lib/date';
import { useFinanceStore } from '@/store/financeStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/theme/ThemeProvider';

export default function FinanceScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const {
    currentMonth,
    transactions,
    carryIn,
    status,
    error,
    loadMonth,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  } = useFinanceStore();
  const currency = useSettingsStore((state) => state.currency);

  const [transactionFormVisible, setTransactionFormVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);

  useEffect(() => {
    void loadMonth();
  }, [loadMonth]);

  const stats = useFinanceStats(transactions, carryIn);
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
      <View className="pb-sm">
        <Text variant="xl" weight="semibold">
          Finance
        </Text>
        <Text variant="sm" color="secondary">
          {transactions.length > 0 ? `${transactions.length} transactions this month` : 'Track your income and expenses'}
        </Text>
      </View>

      <View className="flex-row items-center justify-between pb-md">
        <Pressable
          onPress={() => void loadMonth(addMonthsISO(currentMonth, -1))}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          className="h-9 w-9 items-center justify-center rounded-full active:bg-surface-alt"
        >
          <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
        </Pressable>
        <Text variant="lg" weight="semibold">
          {formatMonthLabel(currentMonth)}
        </Text>
        <Pressable
          onPress={() => void loadMonth(addMonthsISO(currentMonth, 1))}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Next month"
          className="h-9 w-9 items-center justify-center rounded-full active:bg-surface-alt"
        >
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>

      <FlatList
        data={sortedTransactions}
        keyExtractor={(transaction) => String(transaction.id)}
        contentContainerClassName="gap-sm"
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
        ListHeaderComponent={
          <View className="gap-md pb-md">
            <StatCard
              className="w-full"
              label="Net"
              value={formatCurrency(stats.monthNet, currency)}
              valueColor={stats.monthNet > 0 ? 'success' : stats.monthNet < 0 ? 'danger' : 'primary'}
              valueVariant="2xl"
              icon={<Ionicons name="wallet-outline" size={18} color={colors.primary} />}
              sublabel={
                carryIn !== 0
                  ? `Includes ${formatCurrency(carryIn, currency)} carried over from before ${formatMonthLabel(currentMonth)}`
                  : undefined
              }
              sublabelColor="muted"
            />

            <View className="flex-row gap-md">
              <StatCard
                label="Income"
                value={formatCurrency(stats.monthIncome, currency)}
                valueColor="success"
                icon={<Ionicons name="arrow-up-circle-outline" size={16} color={colors.success} />}
              />
              <StatCard
                label="Expenses"
                value={formatCurrency(stats.monthExpense, currency)}
                valueColor="danger"
                icon={<Ionicons name="arrow-down-circle-outline" size={16} color={colors.danger} />}
              />
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
            icon={<Ionicons name="wallet-outline" size={40} color={colors.textMuted} />}
            title="No transactions this month"
            description="Log an income or expense to get started."
            actionLabel="Add transaction"
            onAction={openCreateTransaction}
          />
        }
        renderItem={({ item }) => (
          <TransactionRow transaction={item} currency={currency} onPress={() => openEditTransaction(item)} />
        )}
      />

      <Pressable
        onPress={openCreateTransaction}
        accessibilityRole="button"
        accessibilityLabel="Add transaction"
        className="absolute bottom-xl right-lg h-14 w-14 items-center justify-center rounded-full bg-primary active:opacity-80"
        style={{ bottom: insets.bottom + 24 }}
      >
        <Ionicons name="add" size={28} color={colors.primaryText} />
      </Pressable>

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
