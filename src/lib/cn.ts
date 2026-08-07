type ClassValue = string | number | boolean | null | undefined;

/**
 * Joins truthy class name fragments with a space. Deliberately not
 * `tailwind-merge` — we don't have conflicting utility precedence to
 * resolve (NativeWind classes here are hand-written, not composed from
 * arbitrary user input), so the extra dependency isn't justified yet.
 */
export function cn(...values: ClassValue[]): string {
  return values.filter((value): value is string | number => Boolean(value)).join(' ');
}
