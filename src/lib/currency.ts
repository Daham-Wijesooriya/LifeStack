// Fixed to USD until Settings (step 8) adds a currency picker backed by
// the `settings` table — formatCurrency's `currency` param is already the
// seam that wiring will plug into, so callers won't need to change.
const DEFAULT_CURRENCY = 'USD';

export function formatCurrency(amount: number, currency: string = DEFAULT_CURRENCY): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
}
