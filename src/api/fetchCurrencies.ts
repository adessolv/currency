const BASE_URL = 'https://api.frankfurter.app'

export type CurrencyInfo = { code: string; name: string }

/**
 * Frankfurter /currencies (ECB catalog).
 * Returns a sorted list of supported ISO 4217 currency codes with names.
 */
export async function fetchCurrencies(
  init?: RequestInit,
): Promise<CurrencyInfo[]> {
  const res = await fetch(`${BASE_URL}/currencies`, init)

  if (!res.ok) {
    let message = res.statusText
    try {
      const body = (await res.json()) as { message?: string }
      if (body.message) message = body.message
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }

  const data = (await res.json()) as Record<string, string>
  return Object.entries(data)
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.code.localeCompare(b.code))
}

