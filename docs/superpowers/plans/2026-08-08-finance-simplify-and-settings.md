# Finance Simplification + Settings Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trim the Finance tab to its essentials (summary cards, one pie chart, transaction list) and add a Settings screen — reachable from a gear icon on the Dashboard — with persisted theme and currency controls.

**Architecture:** A new `settingsStore` (zustand) reads/writes the existing `settings` key/value table for two keys (`currency`, `themePreference`). The Finance screen and `TransactionRow` read `currency` from it to format amounts. `ThemeProvider` itself stays unchanged (still pure, DB-agnostic) — the Settings screen and the post-migration boot sequence are the only two places that bridge `settingsStore` to `theme.setPreference`. Settings is a new top-level modal route, added by promoting the root layout from `<Slot />` to a `<Stack>` containing the `(tabs)` group and the `settings` modal as siblings.

**Tech Stack:** Expo Router 6 (file-based routing, `Stack` + modal presentation), Zustand (state), Drizzle/expo-sqlite (existing `settings` repository, no schema change), NativeWind (styling), `@expo/vector-icons` Ionicons.

## Global Constraints

- **No test framework is configured in this repo** (no jest/vitest in `package.json`, no test files under `src/`). Every task's verification step is `npx tsc --noEmit` (the compiler catches removed exports/params — this codebase relies heavily on that here, since several signatures change) plus a manual Expo Go check on the final task. Do not add a test framework as part of this plan — out of scope.
- Follow existing conventions exactly: themed primitives from `@/components/ui` (`Card`, `Button`, `Text`, `EmptyState`), NativeWind `className` (never `StyleSheet.create`), `cn()` from `@/lib/cn` is a **plain string join, not `tailwind-merge`** — never pass two classes that set the same CSS property (e.g. two `text-*` color utilities) in one `className`, the result is undefined. Use a component's typed prop (e.g. an icon's `color` prop) instead when you need a color that isn't one of `Text`'s `color` variants.
- Currency codes must be valid ISO 4217 (required by `Intl.NumberFormat` inside `formatCurrency`, `src/lib/currency.ts`) — this is why currency is a fixed picker list, not free text.
- Commit after each task (this repo's convention per its git log: small, scoped commits).

---

### Task 1: `settingsStore` — persisted currency + theme preference

**Files:**
- Create: `src/store/settingsStore.ts`

**Interfaces:**
- Consumes: `createSettingsRepository` + `Database` from `@/db/repositories` / `@/db/client` (existing — `get`/`getAll`/`set`/`delete` by string key, see `src/db/repositories/settings.ts`); `ThemePreference` type from `@/theme/ThemeProvider` (existing: `'light' | 'dark' | 'system'`).
- Produces: `useSettingsStore` — a zustand hook with state `{ currency: string; themePreference: ThemePreference; status: 'idle' | 'loading' | 'ready' | 'error'; error: string | null }` and actions `load(): Promise<void>`, `setCurrency(code: string): Promise<void>`, `setThemePreference(preference: ThemePreference): Promise<void>`. Task 3 and Task 4 both call these by exact name.
- **Note:** `setThemePreference` here only persists and updates `settingsStore`'s own state — it does **not** call `theme.setPreference` (a zustand store outside React can't call a hook). Callers that need the theme to actually change (Task 3, Task 4) call both `theme.setPreference(...)` and `settingsStore.setThemePreference(...)` themselves.

- [ ] **Step 1: Write `src/store/settingsStore.ts`**

```ts
import { create } from 'zustand';

import { db } from '@/db/client';
import { createSettingsRepository } from '@/db/repositories';
import type { ThemePreference } from '@/theme/ThemeProvider';

const settingsRepo = createSettingsRepository(db);

const CURRENCY_KEY = 'currency';
const THEME_PREFERENCE_KEY = 'themePreference';

const DEFAULT_CURRENCY = 'USD';
const DEFAULT_THEME_PREFERENCE: ThemePreference = 'system';

function isThemePreference(value: string): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

interface SettingsState {
  currency: string;
  themePreference: ThemePreference;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
  /** Reads both keys from the `settings` table, falling back to defaults for whichever is unset (first run). */
  load: () => Promise<void>;
  setCurrency: (code: string) => Promise<void>;
  /** Persists only — does not touch ThemeProvider. See note above. */
  setThemePreference: (preference: ThemePreference) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  currency: DEFAULT_CURRENCY,
  themePreference: DEFAULT_THEME_PREFERENCE,
  status: 'idle',
  error: null,

  async load() {
    set({ status: 'loading', error: null });
    try {
      const all = await settingsRepo.getAll();
      const storedTheme = all[THEME_PREFERENCE_KEY];
      set({
        currency: all[CURRENCY_KEY] ?? DEFAULT_CURRENCY,
        themePreference: storedTheme && isThemePreference(storedTheme) ? storedTheme : DEFAULT_THEME_PREFERENCE,
        status: 'ready',
      });
    } catch (error) {
      set({ status: 'error', error: error instanceof Error ? error.message : String(error) });
    }
  },

  async setCurrency(code) {
    set({ currency: code });
    await settingsRepo.set(CURRENCY_KEY, code);
  },

  async setThemePreference(preference) {
    set({ themePreference: preference });
    await settingsRepo.set(THEME_PREFERENCE_KEY, preference);
  },
}));
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no new errors (this file has no consumers yet, so it just needs to compile standalone).

- [ ] **Step 3: Commit**

```bash
git add src/store/settingsStore.ts
git commit -m "Add settingsStore for persisted currency + theme preference

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Trim the Finance screen, wire currency

**Files:**
- Delete: `src/components/finance/MonthlyTrendChart.tsx`
- Delete: `src/components/finance/BudgetProgressRow.tsx`
- Delete: `src/components/finance/BudgetFormSheet.tsx`
- Modify: `src/components/finance/index.ts`
- Modify: `src/hooks/useFinanceStats.ts`
- Modify: `src/store/financeStore.ts`
- Modify: `src/components/finance/TransactionRow.tsx`
- Modify: `app/(tabs)/finance.tsx`

**Interfaces:**
- Consumes: `useSettingsStore` (Task 1) — `state.currency`.
- Produces: `useFinanceStats(transactions: Transaction[]): FinanceStats` where `FinanceStats = { monthIncome: number; monthExpense: number; monthNet: number; categoryTotals: CategoryTotal[] }` (drops the old `budgets`/`currentMonth` params and the `budgetProgress`/`monthlyTrend` fields — `CategoryPieChart.tsx` already only imports `CategoryTotal`, unaffected). `TransactionRow` now requires a `currency: string` prop.

- [ ] **Step 1: Delete the three dead components**

```bash
rm "src/components/finance/MonthlyTrendChart.tsx" "src/components/finance/BudgetProgressRow.tsx" "src/components/finance/BudgetFormSheet.tsx"
```

- [ ] **Step 2: Rewrite `src/components/finance/index.ts`**

```ts
export * from './CategoryPieChart';
export * from './TransactionFormSheet';
export * from './TransactionRow';
```

- [ ] **Step 3: Rewrite `src/hooks/useFinanceStats.ts`**

```ts
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
```

- [ ] **Step 4: Rewrite `src/store/financeStore.ts`**

```ts
import { create } from 'zustand';

import { db } from '@/db/client';
import { createTransactionsRepository } from '@/db/repositories';
import type { Transaction } from '@/db/schema';
import { currentMonthISO, monthEndDateISO, monthStartDateISO, nowISO } from '@/lib/date';

const transactionsRepo = createTransactionsRepository(db);

export interface NewTransactionInput {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  note: string | null;
  date: string;
}

interface FinanceState {
  currentMonth: string;
  transactions: Transaction[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
  loadMonth: (month?: string) => Promise<void>;
  createTransaction: (input: NewTransactionInput) => Promise<void>;
  updateTransaction: (id: number, input: NewTransactionInput) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  currentMonth: currentMonthISO(),
  transactions: [],
  status: 'idle',
  error: null,

  async loadMonth(month) {
    const targetMonth = month ?? get().currentMonth;
    set({ status: 'loading', error: null, currentMonth: targetMonth });
    try {
      const transactions = await transactionsRepo.getInRange(
        monthStartDateISO(targetMonth),
        monthEndDateISO(targetMonth),
      );
      set({ transactions, status: 'ready' });
    } catch (error) {
      set({ status: 'error', error: error instanceof Error ? error.message : String(error) });
    }
  },

  async createTransaction(input) {
    await transactionsRepo.create({ ...input, createdAt: nowISO() });
    await get().loadMonth();
  },

  async updateTransaction(id, input) {
    await transactionsRepo.update(id, input);
    await get().loadMonth();
  },

  async deleteTransaction(id) {
    await transactionsRepo.delete(id);
    await get().loadMonth();
  },
}));
```

- [ ] **Step 5: Add a `currency` prop to `src/components/finance/TransactionRow.tsx`**

```tsx
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';
import type { Transaction } from '@/db/schema';
import { formatCurrency } from '@/lib/currency';

export interface TransactionRowProps {
  transaction: Transaction;
  currency: string;
  onPress: () => void;
}

export function TransactionRow({ transaction, currency, onPress }: TransactionRowProps) {
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
        {formatCurrency(transaction.amount, currency)}
      </Text>
    </Pressable>
  );
}
```

- [ ] **Step 6: Rewrite `app/(tabs)/finance.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';

import { CategoryPieChart, TransactionFormSheet, TransactionRow } from '@/components/finance';
import { Button, Card, EmptyState, Text } from '@/components/ui';
import type { Transaction } from '@/db/schema';
import { useFinanceStats } from '@/hooks/useFinanceStats';
import { formatCurrency } from '@/lib/currency';
import { addMonthsISO, formatMonthLabel } from '@/lib/date';
import { useFinanceStore } from '@/store/financeStore';
import { useSettingsStore } from '@/store/settingsStore';

export default function FinanceScreen() {
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
```

- [ ] **Step 7: Verify**

Run: `npx tsc --noEmit`
Expected: clean. This is the step that actually proves the deletions didn't leave anything dangling — if any file still imports `BudgetFormSheet`/`MonthlyTrendChart`/`BudgetProgressRow`, or calls `useFinanceStats`/`TransactionRow` with the old signature, it fails here.

- [ ] **Step 8: Commit**

```bash
git add -A -- src/components/finance app/'(tabs)'/finance.tsx src/hooks/useFinanceStats.ts src/store/financeStore.ts
git commit -m "Trim Finance screen to summary + pie chart + transactions; wire currency

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: Settings screen UI

**Files:**
- Create: `app/settings.tsx`

**Interfaces:**
- Consumes: `useSettingsStore` (Task 1) — `state.currency`, `state.setCurrency`, `state.setThemePreference`; `useTheme()` from `@/theme/ThemeProvider` — `theme.preference`, `theme.setPreference`, `theme.colors`.
- Produces: default-exported `SettingsScreen` component, routed at `/settings` by its file path (wired into navigation in Task 4).

- [ ] **Step 1: Write `app/settings.tsx`**

```tsx
import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { Button, Card, Text } from '@/components/ui';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme, type ThemePreference } from '@/theme/ThemeProvider';

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

const CURRENCY_OPTIONS = ['USD', 'EUR', 'GBP', 'LKR', 'INR', 'AUD', 'JPY', 'CAD'];

export default function SettingsScreen() {
  const theme = useTheme();
  const currency = useSettingsStore((state) => state.currency);
  const setCurrency = useSettingsStore((state) => state.setCurrency);
  const setThemePreference = useSettingsStore((state) => state.setThemePreference);

  function applyThemePreference(preference: ThemePreference) {
    theme.setPreference(preference);
    void setThemePreference(preference);
  }

  return (
    <View className="flex-1 gap-lg bg-background p-lg">
      <Card className="gap-sm">
        <Text weight="semibold">Theme</Text>
        <View className="flex-row gap-sm">
          {THEME_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={theme.preference === option.value ? 'primary' : 'outline'}
              size="sm"
              onPress={() => applyThemePreference(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </View>
      </Card>

      <Card className="gap-xs">
        <Text weight="semibold">Currency</Text>
        {CURRENCY_OPTIONS.map((code) => (
          <Pressable
            key={code}
            onPress={() => void setCurrency(code)}
            accessibilityRole="radio"
            accessibilityState={{ checked: currency === code }}
            className="flex-row items-center justify-between py-sm"
          >
            <Text>{code}</Text>
            {currency === code ? <Ionicons name="checkmark" size={18} color={theme.colors.primary} /> : null}
          </Pressable>
        ))}
      </Card>
    </View>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: clean. (The route isn't reachable in the app yet — that's Task 4 — but the file must still type-check standalone.)

- [ ] **Step 3: Commit**

```bash
git add app/settings.tsx
git commit -m "Add Settings screen: theme toggle + currency picker

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: Navigation — modal route, Dashboard gear icon, boot-time settings load

**Files:**
- Modify: `app/_layout.tsx`
- Modify: `app/(tabs)/index.tsx`

**Interfaces:**
- Consumes: `useSettingsStore` (Task 1); `app/settings.tsx` (Task 3, referenced only by its route name `"settings"`, not imported directly — Expo Router resolves it from the file path).

- [ ] **Step 1: Update `app/_layout.tsx`**

Current content (for reference — replace the whole file):

```tsx
import '../global.css';

import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { Platform, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useDatabaseMigrations } from '@/db/migrate';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

/**
 * Blocks rendering until pending Drizzle migrations have run — except on
 * web, where it never calls the migration hook at all. expo-sqlite's web
 * backend is alpha and needs response headers this dev server doesn't send
 * (see src/db/client.ts), so LifeStack treats web as unsupported and shows
 * a clear notice instead of touching the db.
 */
function MigrationGate({ children }: { children: ReactNode }) {
  if (Platform.OS === 'web') {
    return (
      <View className="flex-1 items-center justify-center gap-2 bg-background px-6">
        <Text className="text-center text-lg font-semibold text-text-primary">
          Open in Expo Go or an emulator
        </Text>
        <Text className="text-center text-text-secondary">
          LifeStack uses on-device SQLite, which the web preview doesn't support.
        </Text>
      </View>
    );
  }
  return <NativeMigrationGate>{children}</NativeMigrationGate>;
}

function NativeMigrationGate({ children }: { children: ReactNode }) {
  const { success, error } = useDatabaseMigrations();

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-center text-danger">Migration error: {error.message}</Text>
      </View>
    );
  }
  if (!success) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-text-secondary">Setting up database…</Text>
      </View>
    );
  }
  return <>{children}</>;
}

function ThemedStatusBar() {
  const { colorScheme } = useTheme();
  return <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <MigrationGate>
          <Slot />
        </MigrationGate>
        <ThemedStatusBar />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
```

Replace it with:

```tsx
import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, type ReactNode } from 'react';
import { Platform, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useDatabaseMigrations } from '@/db/migrate';
import { useSettingsStore } from '@/store/settingsStore';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

/**
 * Blocks rendering until pending Drizzle migrations have run — except on
 * web, where it never calls the migration hook at all. expo-sqlite's web
 * backend is alpha and needs response headers this dev server doesn't send
 * (see src/db/client.ts), so LifeStack treats web as unsupported and shows
 * a clear notice instead of touching the db.
 */
function MigrationGate({ children }: { children: ReactNode }) {
  if (Platform.OS === 'web') {
    return (
      <View className="flex-1 items-center justify-center gap-2 bg-background px-6">
        <Text className="text-center text-lg font-semibold text-text-primary">
          Open in Expo Go or an emulator
        </Text>
        <Text className="text-center text-text-secondary">
          LifeStack uses on-device SQLite, which the web preview doesn't support.
        </Text>
      </View>
    );
  }
  return <NativeMigrationGate>{children}</NativeMigrationGate>;
}

function NativeMigrationGate({ children }: { children: ReactNode }) {
  const { success, error } = useDatabaseMigrations();
  const theme = useTheme();

  // Settings can only be read once migrations have run (the `settings`
  // table doesn't exist before that). This only needs to fire once, when
  // `success` first flips true, so it intentionally doesn't depend on
  // `theme.preference`/`theme.setPreference` — including them would just
  // re-run this on every unrelated theme change.
  useEffect(() => {
    if (!success) return;
    void useSettingsStore
      .getState()
      .load()
      .then(() => {
        const loadedPreference = useSettingsStore.getState().themePreference;
        if (loadedPreference !== theme.preference) {
          theme.setPreference(loadedPreference);
        }
      });
  }, [success]);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-center text-danger">Migration error: {error.message}</Text>
      </View>
    );
  }
  if (!success) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-text-secondary">Setting up database…</Text>
      </View>
    );
  }
  return <>{children}</>;
}

function ThemedStatusBar() {
  const { colorScheme } = useTheme();
  return <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <MigrationGate>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="settings"
              options={{ presentation: 'modal', headerShown: true, title: 'Settings' }}
            />
          </Stack>
        </MigrationGate>
        <ThemedStatusBar />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
```

- [ ] **Step 2: Rewrite `app/(tabs)/index.tsx`**

```tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { EmptyState, Text } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';

export default function DashboardScreen() {
  const { colors } = useTheme();

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-lg pt-lg">
        <Text variant="xl" weight="semibold">
          Dashboard
        </Text>
        <Pressable
          onPress={() => router.push('/settings')}
          accessibilityRole="button"
          accessibilityLabel="Settings"
          hitSlop={8}
        >
          <Ionicons name="settings-outline" size={22} color={colors.textPrimary} />
        </Pressable>
      </View>
      <EmptyState
        title="Nothing here yet"
        description="Today's summary across all modules lands here once they're all built."
      />
    </View>
  );
}
```

Note: the `EmptyState` title changes from `"Dashboard"` to `"Nothing here yet"` — the header row now carries the "Dashboard" title, so keeping it on both would read as a duplicated heading directly under itself.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add app/_layout.tsx app/'(tabs)'/index.tsx
git commit -m "Add Settings modal route, Dashboard gear icon, boot-time theme load

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

- [ ] **Step 5: Manual verification in Expo Go**

Start the dev server (`npx expo start -c` if it's not already running) and, on device:
1. Finance tab: confirm it shows month nav → income/expense/net cards → pie chart → transaction list, with no trend chart and no budget section.
2. Dashboard tab: confirm the gear icon appears top-right; tapping it opens the Settings screen as a modal.
3. In Settings, tap each theme option — the app's colors should switch immediately. Fully close and reopen the app (not just reload) — the theme should still be whatever was last selected, not reset to system default.
4. In Settings, pick a different currency, then go back to Finance — the summary cards and transaction amounts should immediately reformat in the new currency.

---

## Self-Review

**Spec coverage:**
- Finance trim (summary cards kept, trend chart + budgets removed, dead components deleted) → Task 2. ✅
- Settings persistence (currency + theme, via existing `settings` table) → Task 1. ✅
- Settings screen UI (theme toggle, currency picker) → Task 3. ✅
- Dashboard gear icon + modal navigation → Task 4. ✅
- Boot-time load of persisted theme after migrations → Task 4, `NativeMigrationGate`. ✅
- Non-goal: `budgets` DB table/repository untouched → confirmed, no task modifies `src/db/schema.ts` or `src/db/repositories/budgets.ts`/`index.ts`. ✅

**Placeholder scan:** none — every step has literal file content, no "add appropriate X" phrasing.

**Type consistency:** `useFinanceStats(transactions)` signature in Task 2 Step 3 matches its call site in Task 2 Step 6 (`useFinanceStats(transactions)`, no `budgets`/`currentMonth` args). `TransactionRow`'s `currency` prop in Task 2 Step 5 matches its usage in Task 2 Step 6 (`<TransactionRow transaction={item} currency={currency} ...>`). `useSettingsStore`'s `setCurrency`/`setThemePreference`/`load` names match across Task 1 (definition), Task 3 (currency picker + theme toggle), and Task 4 (`NativeMigrationGate`'s boot load).
