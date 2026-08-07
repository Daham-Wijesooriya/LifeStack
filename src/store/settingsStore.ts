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
  /** Persists only — does not touch ThemeProvider. Callers that need the theme to actually
   * change (Settings screen, boot-time load) call `theme.setPreference` themselves. */
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
