const currencyToCountry: Record<string, string> = {
    USD: 'us',
    EUR: 'eu',
    GBP: 'gb',
    INR: 'in',
    AUD: 'au',
    CAD: 'ca',
    CHF: 'ch',
    CNY: 'cn',
    JPY: 'jp',
    UAH: 'ua',
    PLN: 'pl',
    CZK: 'cz',
    SEK: 'se',
    NOK: 'no',
    DKK: 'dk',
    HUF: 'hu',
    RON: 'ro',
    BGN: 'bg',
    TRY: 'tr',
    BRL: 'br',
    MXN: 'mx',
    NZD: 'nz',
    SGD: 'sg',
    HKD: 'hk',
    KRW: 'kr',
    ZAR: 'za',
  }
  
  export function getFlagCodeFromCurrency(currencyCode: string): string {
    return currencyToCountry[currencyCode.toUpperCase()] ?? currencyCode.slice(0, 2).toLowerCase()
  }