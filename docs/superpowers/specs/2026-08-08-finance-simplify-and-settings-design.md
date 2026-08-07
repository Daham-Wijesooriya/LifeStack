# Finance page simplification + Settings screen (theme, currency)

Date: 2026-08-08

## Goal

1. Simplify the Finance tab down to essentials: **this month's income/expense/net summary cards** (kept), one pie chart, transaction list. Remove the **6-month trend chart** (a separate thing from the summary cards — don't confuse the two) and the budget-vs-actual section, and the now-dead code behind them. UI should read as minimal and clean, not just content-reduced — spacing and card styling for the kept sections are part of this pass, not an afterthought.
2. Add a Settings screen reachable via a gear icon on the Dashboard's top-right corner, with two controls: theme (light/dark/system) and currency — both persisted so they survive an app restart.

## Non-goals

- No changes to the `budgets` DB table or `BudgetsRepository` — that's infrastructure, not feature UI, and stays available for a future "detailed" finance view even though nothing calls it after this change.
- No new settings beyond theme + currency (notifications etc. aren't built elsewhere in the app, so a row for them would be a dead control).
- No changes to the sync-ready-schema work discussed earlier — unrelated, not started yet.

## 1. Finance page trim

**Delete outright** (fully-built but will have zero remaining callers):
- `src/components/finance/MonthlyTrendChart.tsx`
- `src/components/finance/BudgetProgressRow.tsx`
- `src/components/finance/BudgetFormSheet.tsx`
- their exports in `src/components/finance/index.ts`

**Modify:**
- `app/(tabs)/finance.tsx` — remove the "Monthly trend" and "Budget vs actual" `Card` sections, the `budgetFormVisible` state, the `BudgetFormSheet` usage, and the `setBudget` call. Screen becomes: month nav → income/expense/net cards → pie chart → transaction list → add-transaction button.
- `src/store/financeStore.ts` — remove `budgets` state, `setBudget`, `deleteBudget`, the `budgetsRepo` import/calls. `loadMonth` now only fetches the current month's transactions (see below), not a 6-month window.
- `src/hooks/useFinanceStats.ts` — drop the `budgets` parameter, `budgetProgress` field/type, `monthlyTrend` field/type, and the `TREND_MONTHS` trend-bucketing loop. Keeps `monthIncome`, `monthExpense`, `monthNet`, `categoryTotals`.

**Follow-on simplification:** `financeStore.loadMonth` currently fetches `TREND_MONTHS` (6) months of transactions to feed the trend chart. With the trend chart gone, nothing needs that window — `loadMonth` fetches only `monthStartDateISO(targetMonth)` to `monthEndDateISO(targetMonth)`, and the `monthTransactions` filter/sort in `finance.tsx` (which re-filters the already-month-scoped array by `currentMonth` — a leftover from the wide-window fetch) collapses to just sorting.

## 2. Settings persistence

No DB schema change — the `settings` key/value table already exists (`src/db/repositories/settings.ts`).

New `src/store/settingsStore.ts` (zustand, same shape as the other domain stores):

```ts
interface SettingsState {
  currency: string;            // ISO 4217 code, default 'USD'
  themePreference: ThemePreference; // 'light' | 'dark' | 'system', default 'system'
  status: 'idle' | 'loading' | 'ready' | 'error';
  load: () => Promise<void>;
  setCurrency: (code: string) => Promise<void>;
  setThemePreference: (pref: ThemePreference) => Promise<void>;
}
```

- `load()` reads both keys via `settingsRepo.getAll()`, falling back to the defaults above for whichever key is unset (first run).
- `setCurrency(code)` writes through `settingsRepo.set('currency', code)` then updates store state.
- `setThemePreference(pref)` calls `theme.setPreference(pref)` (the existing `useTheme()` setter — applies immediately, unchanged) *and* `settingsRepo.set('themePreference', pref)`. `ThemeProvider` itself is untouched and stays DB-agnostic; `settingsStore` is the only thing that bridges it to persistence.

**Load timing:** `ThemeProvider` renders above `MigrationGate` in `app/_layout.tsx` (it has to — the migration/error screens need theme tokens too), so it can't safely query the DB itself. Instead, `NativeMigrationGate` (same file) calls `useSettingsStore.getState().load()` in a `useEffect` once `success` becomes `true` — the DB is guaranteed migrated at that point — and if the loaded `themePreference` differs from the current one, applies it via `theme.setPreference(...)`. Expect one frame with the default theme on cold start before the persisted value applies, same as any app restoring an async-persisted preference.

**Currency call sites:** `formatCurrency` keeps its existing `currency` parameter (already the intended seam per its comment). `app/(tabs)/finance.tsx` and `src/components/finance/TransactionRow.tsx` read `useSettingsStore((s) => s.currency)` and pass it through instead of relying on the USD default.

## 3. Settings screen

New `app/settings.tsx`:
- **Theme**: three `Button` toggles (Light / Dark / System) — same `variant="primary"` (selected) / `variant="outline"` pattern already used for the habit frequency toggle in `HabitFormSheet`.
- **Currency**: a `Card` listing 8 common codes — USD, EUR, GBP, LKR, INR, AUD, JPY, CAD — as pressable rows with a checkmark on the selected one, same pattern as the color-preset picker in `HabitFormSheet`.

## 4. Navigation

`app/_layout.tsx`: `<Slot />` becomes:

```tsx
<Stack screenOptions={{ headerShown: false }}>
  <Stack.Screen name="(tabs)" />
  <Stack.Screen name="settings" options={{ presentation: 'modal', headerShown: true, title: 'Settings' }} />
</Stack>
```

This is the standard Expo Router shape for a modal reachable from any tab. `(tabs)/_layout.tsx` is unchanged — it still owns the tab bar and its own `headerShown: false`.

`app/(tabs)/index.tsx` (Dashboard) gains a header row: "Dashboard" title + a gear icon (`Ionicons name="settings-outline"`, same icon set as the tab bar) top-right, `onPress` → `router.push('/settings')`. The rest of the screen (currently an `EmptyState` placeholder) is unchanged.

## File change summary

| File | Change |
|---|---|
| `src/components/finance/MonthlyTrendChart.tsx` | delete |
| `src/components/finance/BudgetProgressRow.tsx` | delete |
| `src/components/finance/BudgetFormSheet.tsx` | delete |
| `src/components/finance/index.ts` | drop 3 exports |
| `app/(tabs)/finance.tsx` | remove trend/budget sections, wire currency |
| `src/store/financeStore.ts` | remove budget state/actions, narrow fetch window |
| `src/hooks/useFinanceStats.ts` | drop `budgets` param, `budgetProgress`, `monthlyTrend` |
| `src/components/finance/TransactionRow.tsx` | wire currency |
| `src/store/settingsStore.ts` | new |
| `app/settings.tsx` | new |
| `app/_layout.tsx` | `Slot` → `Stack` with `(tabs)` + modal `settings`; trigger `settingsStore.load()` post-migration |
| `app/(tabs)/index.tsx` | add header row + gear icon |

## Verification

- `npx tsc --noEmit` clean after all changes (removed exports/params mean call sites must update too — the compiler will catch anything missed).
- Manual pass in Expo Go: Finance tab shows the trimmed layout; Dashboard shows the gear icon; tapping it opens the Settings modal; changing theme applies immediately and survives an app reload; changing currency reformats amounts on Finance immediately.
