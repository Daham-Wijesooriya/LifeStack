import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import { Platform } from 'react-native';

import * as schema from './schema';

export type Database = ReturnType<typeof createDatabase>;

function createDatabase() {
  const expoDb = openDatabaseSync('lifestack.db', { enableChangeListener: true });
  return drizzle(expoDb, { schema });
}

// expo-sqlite's web backend is alpha and needs SharedArrayBuffer (COOP/COEP
// response headers this project's dev server doesn't set), so calling
// openDatabaseSync crashes at import time on web. LifeStack is mobile-only —
// app/_layout.tsx shows a friendly notice on web instead of ever mounting
// anything that reaches `db`, but this proxy is a second line of defense
// with a clearer message than "SharedArrayBuffer is not defined" in case
// something ever does.
export const db: Database =
  Platform.OS === 'web'
    ? (new Proxy(
        {},
        {
          get(): never {
            throw new Error(
              'SQLite is not available on web in LifeStack — open the app in Expo Go or an emulator instead.',
            );
          },
        },
      ) as Database)
    : createDatabase();
