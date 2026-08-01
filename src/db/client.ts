import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';

import * as schema from './schema';

const expoDb = openDatabaseSync('lifestack.db', { enableChangeListener: true });

export const db = drizzle(expoDb, { schema });

export type Database = typeof db;
