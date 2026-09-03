import { useTheme } from './ThemeProvider';

/**
 * Shared accent palette for user-facing "pick a color" UI (habit colors,
 * finance category chart slices, ...). Built from the active theme's tokens
 * so presets stay legible and on-brand in both light and dark mode instead
 * of a light-only value drifting out of sync when the theme flips.
 *
 * The last entry (pink) has no dedicated token — it exists purely to widen
 * the picker beyond the five semantic colors — so it stays fixed across
 * themes like the semantic ones already are for their own use elsewhere.
 */
export function useAccentPalette(): readonly [string, string, string, string, string, string] {
  const { colors } = useTheme();
  return [colors.primary, colors.success, colors.danger, colors.warning, colors.info, '#C2469B'];
}

/**
 * Deterministically maps a numeric id (a todo, a habit, ...) onto one color
 * in a palette — the same id always lands on the same color, so a task can
 * be tied together visually across different views (e.g. DayClock's wedges
 * and the checklist rows under it) without passing color state around.
 */
export function pickAccentColor(id: number, palette: readonly string[]): string {
  const index = ((id % palette.length) + palette.length) % palette.length;
  return palette[index] as string;
}
