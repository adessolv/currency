const BASE_URL = 'https://api.frankfurter.app'

export type FrankfurterLatestResponse = {
  amount: number
  base: string
  date: string
  rates: Record<string, number>
}

export type RateInfo = {
  /** Conversion factor for 1 unit of `from` into `to`. */
  rate: number
  base: string
  to: string
  date: string
}

/**
 * Fetches the conversion rate using Frankfurter (ECB reference rates).
 * Internally requests `amount=1`, so `rates[to]` is directly the factor.
 */
export async function getRate(
  from: string,
  to: string,
  init?: RequestInit,
): Promise<RateInfo> {
  if (from === to) {
    return {
      rate: 1,
      base: from,
      to,
      date: new Date().toISOString().slice(0, 10),
    }
  }

  const params = new URLSearchParams({
    amount: '1',
    from,
    to,
  })

  const res = await fetch(`${BASE_URL}/latest?${params}`, init)

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

  const data = (await res.json()) as FrankfurterLatestResponse
  const rate = data.rates[to]
  if (rate === undefined) throw new Error('Missing rate in response')

  return { rate, base: data.base, to, date: data.date }
}

