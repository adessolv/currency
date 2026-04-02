const REGIONAL_INDICATOR_A = 0x1f1e6
const ASCII_A = 0x41
const ASCII_Z = 0x5a

/**
 * Builds a flag emoji from an ISO 3166-1 alpha-2 region code using regional indicators.
 * Returns empty string if the code is not two Latin letters A–Z.
 */
function flagEmojiFromRegionCode(region: string): string {
  const upper = region.toUpperCase()
  if (upper.length !== 2) return ''
  const a = upper.charCodeAt(0)
  const b = upper.charCodeAt(1)
  if (a < ASCII_A || a > ASCII_Z || b < ASCII_A || b > ASCII_Z) return ''
  try {
    return String.fromCodePoint(
      REGIONAL_INDICATOR_A + (a - ASCII_A),
      REGIONAL_INDICATOR_A + (b - ASCII_A),
    )
  } catch {
    return ''
  }
}

/**
 * Many ISO 4217 codes use the issuing territory's alpha-2 as the first two letters
 * (e.g. USD→US). If this does not yield a valid A–Z pair, returns an empty string.
 */
export function makeFlagFromCurrency(currencyCode: string): string {
  if (currencyCode.length !== 3) return ''
  return flagEmojiFromRegionCode(currencyCode.slice(0, 2))
}

