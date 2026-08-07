# LifeStack

A personal life-tracking app built with Expo (React Native) — habits, to-dos, sleep, and budgeting in one place, backed by on-device SQLite.

## Tech stack

- **Expo SDK 54** + **Expo Router** (file-based routing)
- **React Native 0.81** / **React 19**
- **expo-sqlite** + **Drizzle ORM** (schema, migrations, typed repositories)
- **NativeWind** (Tailwind CSS for React Native) for styling and theming
- **Zustand** for client state
- **TypeScript** (strict mode)

> This project tracks Expo SDK 54 closely — check the [versioned Expo docs](https://docs.expo.dev/versions/v54.0.0/) before assuming API behavior.

## Getting started

```bash
npm install
npm start        # opens Expo dev tools
npm run android   # run on Android emulator/device
npm run ios       # run on iOS simulator/device
```

> **Web is not supported.** LifeStack relies on on-device SQLite via `expo-sqlite`, whose web backend is alpha and needs response headers the dev server doesn't send. Running `npm run web` shows a notice instead of the app — use Expo Go or an emulator/simulator.

## Project structure

```
app/                  # Expo Router screens (file-based routing)
  _layout.tsx          # Root layout: theme provider, migration gate, status bar
  index.tsx             # Entry screen

src/
  db/
    schema.ts           # Drizzle table definitions (source of truth for the DB shape)
    client.ts            # SQLite client setup
    migrate.ts            # useDatabaseMigrations() hook, runs pending migrations on launch
    drizzle/               # Generated SQL migrations + snapshots (drizzle-kit)
    repositories/           # Typed data-access layer, one module per domain
  theme/
    tokens.ts            # Design tokens (colors, spacing, etc.)
    ThemeProvider.tsx      # Light/dark theme context

drizzle.config.ts      # drizzle-kit config (schema path, migrations output)
tailwind.config.js     # NativeWind/Tailwind config
```

## Data model

Defined in `src/db/schema.ts`, with a typed repository per table under `src/db/repositories/`:

| Table | Purpose |
|---|---|
| `habits` / `habit_logs` | Habit definitions (daily/weekly) and per-day completion logs |
| `todos` | Tasks with priority, due date, tag, and completion state |
| `sleep_logs` | Bedtime/wake time, computed duration, and sleep quality |
| `transactions` | Income/expense entries by category |
| `budgets` | Monthly spending limit per category |
| `settings` | Simple key/value app settings |

Conventions (enforced by callers, not the DB — see comments in `schema.ts`):
- Calendar-day columns (`date`, `due_date`, `month`) are local `YYYY-MM-DD` strings, never UTC-derived.
- Full-instant columns (`created_at`, `completed_at`, `bedtime`, `wake_time`) are ISO 8601 datetime strings.
- Repositories never call `new Date()`/`Date.now()` directly — timestamps are always supplied by the caller, keeping repositories pure and easy to test.
- Currency amounts are stored as plain decimals (e.g. `12.50`), not integer minor units.

## Database migrations

Schema changes go through [drizzle-kit](https://orm.drizzle.team/kit-docs/overview):

```bash
npx drizzle-kit generate   # generate a new SQL migration from schema.ts changes
```

Migrations run automatically on app launch via `useDatabaseMigrations()` in `src/db/migrate.ts`; the root layout blocks rendering behind a migration gate until they complete.

## Status

Early scaffolding stage: DB schema, repositories, theming, and root layout are in place behind a temporary smoke-test screen (`app/index.tsx`) that verifies migrations and repository access. The tab structure and dashboard UI are not built yet.
