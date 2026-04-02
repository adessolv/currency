/**
 * Converts `amount` by multiplying with a conversion factor `rate`.
 * Returns `NaN` when inputs are invalid.
 */
export function convertAmount(amount: number, rate: number): number {
  if (!Number.isFinite(amount) || !Number.isFinite(rate)) return Number.NaN
  return amount * rate
}

