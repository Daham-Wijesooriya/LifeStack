/**
 * Design tokens for LifeStack.
 *
 * Colors are theme-dependent (light/dark) and are exposed to NativeWind as
 * CSS custom properties (see ThemeProvider.tsx + `vars()`), so both
 * `className="bg-surface"` and JS consumers (e.g. chart libraries that take
 * style/color props, not classNames) read from the same values.
 *
 * Spacing/radius/typography don't change between themes, so they're plain
 * static objects mirrored into tailwind.config.js `theme.extend`.
 */

export type ColorTokens = {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryText: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
};

// CSS custom property names, in sync with the `colors` entries in
// tailwind.config.js (each maps to `var(--color-*)`).
export const CSS_VAR_NAMES: Record<keyof ColorTokens, string> = {
  background: '--color-background',
  surface: '--color-surface',
  surfaceAlt: '--color-surface-alt',
  border: '--color-border',
  textPrimary: '--color-text-primary',
  textSecondary: '--color-text-secondary',
  textMuted: '--color-text-muted',
  primary: '--color-primary',
  primaryText: '--color-primary-text',
  success: '--color-success',
  warning: '--color-warning',
  danger: '--color-danger',
  info: '--color-info',
};

export const lightColors: ColorTokens = {
  background: '#F7F7FA',
  surface: '#FFFFFF',
  surfaceAlt: '#F0F0F4',
  border: '#E2E2E8',
  textPrimary: '#16161A',
  textSecondary: '#4B4B57',
  textMuted: '#8A8A94',
  primary: '#5B5BD6',
  primaryText: '#FFFFFF',
  success: '#1E9E6A',
  warning: '#B8860B',
  danger: '#D0403A',
  info: '#2E7BC4',
};

export const darkColors: ColorTokens = {
  background: '#0B0B0F',
  surface: '#17171C',
  surfaceAlt: '#1F1F26',
  border: '#2C2C34',
  textPrimary: '#F2F2F5',
  textSecondary: '#B4B4BE',
  textMuted: '#7A7A85',
  primary: '#8484F0',
  primaryText: '#0B0B0F',
  success: '#3FC98A',
  warning: '#E0AC3F',
  danger: '#E56B65',
  info: '#5FA8E0',
};

/** Converts a ColorTokens object into the `{ '--color-x': value }` map `vars()` expects. */
export function toCssVars(colors: ColorTokens): Record<string, string> {
  const entries = Object.entries(colors) as [keyof ColorTokens, string][];
  return Object.fromEntries(entries.map(([key, value]) => [CSS_VAR_NAMES[key], value]));
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const typography = {
  xs: { fontSize: 12, lineHeight: 16 },
  sm: { fontSize: 14, lineHeight: 20 },
  base: { fontSize: 16, lineHeight: 22 },
  lg: { fontSize: 18, lineHeight: 24 },
  xl: { fontSize: 22, lineHeight: 28 },
  '2xl': { fontSize: 28, lineHeight: 34 },
} as const;
