import { makeFlagFromCurrency } from './makeFlagFromCurrency'

/**
 * Label for selects: flag + code when a flag can be generated, otherwise code only.
 */
export function currencyOptionLabel(code: string): string {
  const flag = makeFlagFromCurrency(code)
  return flag ? `${flag} ${code}` : code
}

