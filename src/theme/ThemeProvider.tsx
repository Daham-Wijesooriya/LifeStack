import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useColorScheme, vars } from 'nativewind';

import {
  type ColorTokens,
  darkColors,
  lightColors,
  radius,
  spacing,
  toCssVars,
  typography,
} from './tokens';

export type ThemePreference = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  /** Resolved scheme actually in effect right now. */
  colorScheme: 'light' | 'dark';
  /** What the user asked for — 'system' tracks the OS setting. */
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  colors: ColorTokens;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { colorScheme, setColorScheme } = useColorScheme();
  // NativeWind's `colorScheme` is the *resolved* light/dark value, not the raw
  // preference — it can't tell us whether that resolution came from "system"
  // or an explicit choice. So the preference itself is tracked separately here
  // and pushed into NativeWind via setColorScheme whenever it changes.
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  const setPreference = useCallback(
    (next: ThemePreference) => {
      setPreferenceState(next);
      setColorScheme(next);
    },
    [setColorScheme],
  );

  // Falls back to 'light' only in the brief window before NativeWind resolves
  // the initial scheme (colorScheme is `undefined` on first render).
  const resolved = colorScheme === 'dark' ? 'dark' : 'light';
  const colors = resolved === 'dark' ? darkColors : lightColors;

  const value = useMemo<ThemeContextValue>(
    () => ({
      colorScheme: resolved,
      preference,
      setPreference,
      colors,
      spacing,
      radius,
      typography,
    }),
    [resolved, preference, setPreference, colors],
  );

  return (
    <ThemeContext.Provider value={value}>
      <View style={[{ flex: 1 }, vars(toCssVars(colors))]}>{children}</View>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
