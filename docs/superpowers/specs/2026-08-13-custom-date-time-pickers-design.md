# Custom date/time pickers (replace native device pickers)

Date: 2026-08-13

## Problem

`DateField` and `TimeField` (`src/components/ui/`) currently wrap
`@react-native-community/datetimepicker`, rendering the OS-native date/time
picker (Android's imperative dialog, iOS's inline spinner). This has already
caused one bug (wake-time picker overflowing off-screen in the sleep log
form, fixed 2026-08-08 as a one-off patch). The user has directed: **never
use the device's native date/time picker layout going forward — build a
custom picker that matches the app's own aesthetic.**

This spec covers replacing the native picker in both shared fields, used
across three forms: `TodoFormSheet` (due date), `SleepLogFormSheet`
(bedtime/wake time), and `TransactionFormSheet` (transaction date).

## Goals

- Replace native pickers in `DateField` and `TimeField` with fully custom,
  app-themed UI.
- Keep both components' external API (`value`/`onChange` props) unchanged,
  so no consuming form needs to change.
- Remove the now-unused `@react-native-community/datetimepicker` dependency
  and its `app.json` plugin entry.

## Non-goals

- No changes to how forms consume `DateField`/`TimeField`.
- No new design tokens — reuse existing `spacing`/`radius`/`colors`.
- No automated test suite addition (repo has none for UI components today;
  verification is manual via the `run` skill, matching existing practice).

## Architecture

Both fields keep their current props and internal state shape. Only the
"open picker" mechanism changes: instead of `DateTimePickerAndroid.open()` /
an inline native `<DateTimePicker>`, tapping the field opens a custom
centered modal dialog.

New shared components in `src/components/ui/`:

- **`PickerModal`** — centered-dialog wrapper (fade+scale transition,
  backdrop tap = cancel, hardware back = cancel), styled with existing
  tokens (`bg-surface`, `border-border`, `rounded-xl`). Has a title, a
  content slot, and a `Cancel` / `Done` footer. Deliberately a *centered*
  dialog rather than another bottom sheet — the fields already live inside a
  bottom `Sheet` (the form itself), and stacking two bottom sheets would
  read as confusing/layered.
- **`CalendarPicker`** — month-grid content, used inside `PickerModal` by
  `DateField`.
- **`TimeWheelPicker`** — three snapping scroll columns (hour/minute/AM-PM)
  content, used inside `PickerModal` by `TimeField`.

Selection is staged in local state inside the modal and only committed via
the field's `onChange` when **Done** is pressed; Cancel/backdrop/back
discards the staged value. This replaces the old platform-inconsistent
behavior (Android's native dialog applied instantly on its own OK/dismiss;
iOS's inline picker applied on every change) with one consistent
confirm-to-commit step on both platforms.

## Visual design

### CalendarPicker (DateField)

- Header: `‹` — "August 2026" (via existing `formatMonthLabel`) — `›`.
- Weekday row: `S M T W T F S`, Monday-start (matches `startOfWeekISO`'s
  existing Monday convention).
- 7-column day grid for the month. Leading/trailing days from adjacent
  months render muted (`text-muted`) and are tappable (jumps month +
  selects that day).
- Today (not selected): thin `primary`-colored ring.
- Selected day: filled `bg-primary` circle, `primary-text` label.
- Footer: "Today" text-button (bottom-left, jump-to-current-month +
  select-today in one tap) alongside `Cancel` / `Done` (bottom-right).

### TimeWheelPicker (TimeField)

- Three columns: Hour (1–12), Minute (00–59), AM/PM. Each is a snapping
  `ScrollView` (`snapToInterval` per row height, `onMomentumScrollEnd`
  resolves to the nearest index), ~5 rows visible.
- A fixed center highlight band spans all three columns (`bg-surface-alt`,
  `rounded-md`) marking the selected row. Row label opacity fades from
  `text-muted` at the edges toward full `text-primary` at center, so it
  reads like a native spinner but is fully custom-rendered — the earlier
  overflow bug is structurally impossible since layout is ours to control.
- Value stays `"HH:mm"` 24-hour internally (`formatTimeHHmm`'s existing
  contract, unchanged); displayed as 12-hour + AM/PM in the wheel only.
- Initial scroll offset on open is computed directly from the current
  `value` (no native "initial value" prop to lean on) — set via
  `contentOffset`/`scrollTo` with no animation on mount.
- Footer: `Cancel` / `Done`.

## Edge cases

- `DateField`'s existing "clear date" (✕) control stays outside the modal,
  unchanged.
- `DateField` with `value === null` opens the calendar on the current month
  with nothing pre-selected; tapping a day selects it, Done still required
  to commit.
- Wheel picker must land exactly on the current value's row when opened —
  computed offset, not an animated scroll.
- Month navigation across year boundaries (Dec ↔ Jan) uses the existing
  `addMonthsISO` helper — no new date math.
- Backdrop tap or hardware back button cancels (discards staged value),
  matching `Sheet`'s existing `onRequestClose` convention.

## Dependency cleanup

- Remove `@react-native-community/datetimepicker` from `package.json`.
- Remove `"@react-native-community/datetimepicker"` from the `plugins`
  array in `app.json`.
- Note: this changes the native module set, so a fresh `expo prebuild` /
  native rebuild will be needed before the Android debug build reflects it
  (matching the existing prebuild-regenerates-`android/` behavior already
  documented from the 2026-08-13 Android build work).

## Testing

No existing automated UI test suite in this repo (form sheets are verified
manually today). Verification here is manual via the `run` skill on the dev
client:

- `DateField`: Todos due date, Finance transaction date — select a day,
  cancel, "Today" shortcut, month navigation forward/back across a year
  boundary, clear.
- `TimeField`: Sleep bedtime/wake — select a time, cancel, verify wheel
  opens pre-scrolled to the current value, verify AM/PM.
- On both iOS and Android, at a small screen size, confirm nothing overflows
  the screen edge (the original bug this change fixes).
