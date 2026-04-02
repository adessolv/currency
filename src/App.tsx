import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { fetchCurrencies, type CurrencyInfo } from './api/fetchCurrencies'
import { getRate } from './api/getRates'
import { convertAmount } from './utils/convertAmount'
import { currencyOptionLabel } from './utils/currencyOptionLabel'
import './App.css'

const MAX_INTEGER_DIGITS = 12

const numberFmt = (n: number, maxFractionDigits = 2) =>
  new Intl.NumberFormat(undefined, {
    maximumFractionDigits: maxFractionDigits,
    minimumFractionDigits: 0,
  }).format(n)

/** Keeps at most one decimal point and caps the integer part to `MAX_INTEGER_DIGITS` digits. */
function sanitizeAmountInput(raw: string): string {
  let s = raw.replace(/,/g, '.').replace(/[^\d.]/g, '')
  const dot = s.indexOf('.')
  if (dot !== -1) {
    s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, '')
  }
  const [intPart = '', frac] = s.split('.', 2)
  const intClamped = intPart.slice(0, MAX_INTEGER_DIGITS)
  if (dot === -1) return intClamped
  return frac !== undefined ? `${intClamped}.${frac}` : `${intClamped}.`
}

function App() {
  const [amount, setAmount] = useState('1')
  const [from, setFrom] = useState('USD')
  const [to, setTo] = useState('INR')
  const [refetchNonce, setRefetchNonce] = useState(0)

  const [currencies, setCurrencies] = useState<CurrencyInfo[] | null>(null)
  const [catalogError, setCatalogError] = useState<string | null>(null)

  const [rate, setRate] = useState<number | null>(null)
  const [rateDate, setRateDate] = useState<string | null>(null)
  const [rateError, setRateError] = useState<string | null>(null)
  const [loadingRates, setLoadingRates] = useState(false)
  const [committedResult, setCommittedResult] = useState<string | null>(null)

  const parsed = useMemo(() => {
    const n = parseFloat(amount.replace(',', '.'))
    return Number.isFinite(n) ? n : Number.NaN
  }, [amount])

  const currencyList = currencies ?? []
  const catalogReady = currencyList.length > 0
  const catalogBusy = currencies === null && !catalogError

  useEffect(() => {
    const ac = new AbortController()

    ;(async () => {
      try {
        const list = await fetchCurrencies({ signal: ac.signal })
        setCurrencies(list)
        setCatalogError(null)
      } catch (e) {
        if ((e as Error).name === 'AbortError') return
        setCurrencies([])
        setCatalogError(
          e instanceof Error ? e.message : 'Failed to load currencies',
        )
      }
    })()

    return () => ac.abort()
  }, [])

  // Ensure both dropdown values are valid once we have the currency catalog.
  useEffect(() => {
    if (!catalogReady) return

    const codes = new Set(currencyList.map((c) => c.code))
    const f = codes.has(from) ? from : currencyList[0].code
    const t =
      codes.has(to) && to !== f
        ? to
        : currencyList.find((c) => c.code !== f)?.code ?? f

    if (f !== from) setFrom(f)
    if (t !== to) setTo(t)
  }, [catalogReady, currencyList, from, to])

  // Edge-case: force `from !== to` even if something external sets it.
  useEffect(() => {
    if (!catalogReady) return
    if (from !== to) return

    const fallback = currencyList.find((c) => c.code !== from)?.code
    if (fallback && fallback !== to) setTo(fallback)
  }, [from, to, catalogReady, currencyList])

  // Fetch conversion rate factor whenever from/to changes.
  useEffect(() => {
    if (!catalogReady) return

    const ac = new AbortController()
    let cancelled = false

    async function load() {
      setLoadingRates(true)
      setRateError(null)
      setRateDate(null)
      setRate(null)
      setCommittedResult(null)

      try {
        const { rate: r, date } = await getRate(from, to, { signal: ac.signal })
        if (cancelled) return
        setRate(r)
        setRateDate(date)
      } catch (e) {
        if (cancelled || (e as Error).name === 'AbortError') return
        setRate(null)
        setRateDate(null)
        setRateError(e instanceof Error ? e.message : 'Request failed')
      } finally {
        if (!cancelled) setLoadingRates(false)
      }
    }

    void load()

    return () => {
      cancelled = true
      ac.abort()
    }
  }, [catalogReady, from, to, refetchNonce])

  useLayoutEffect(() => {
    if (!catalogReady) return
    if (loadingRates || rateError || rate === null) return
    if (!Number.isFinite(parsed) || parsed < 0) return

    const v = convertAmount(parsed, rate)
    if (!Number.isFinite(v)) return

    setCommittedResult(`${numberFmt(parsed)} ${from} = ${numberFmt(v)} ${to}`)
  }, [catalogReady, parsed, from, to, rate, rateError, loadingRates])

  const showResultHint =
    !committedResult &&
    catalogReady &&
    !loadingRates &&
    !rateError &&
    Number.isFinite(parsed) &&
    parsed >= 0

  function swapCurrencies() {
    setCommittedResult(null)
    setFrom(to)
    setTo(from)
  }

  function handleGetRate() {
    setRefetchNonce((n) => n + 1)
  }

  return (
    <main className="page">
      <div className="card">
        <h1 className="title">Currency Converter</h1>

        <div className="field">
          <label className="label" htmlFor="amount">
            Enter Amount
          </label>
          <input
            id="amount"
            className="input"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={amount}
            onChange={(e) => {
              setCommittedResult(null)
              setAmount(sanitizeAmountInput(e.target.value))
            }}
            aria-invalid={!Number.isFinite(parsed)}
            aria-describedby="amount-limit-hint"
          />
          <p id="amount-limit-hint" className="input-hint">
            Maximum {MAX_INTEGER_DIGITS} digits before the decimal point.
          </p>
        </div>

        {catalogError && (
          <p className="error error--catalog" role="alert">
            Currencies: {catalogError}
          </p>
        )}

        {catalogBusy && (
          <p className="status" role="status">
            Loading currencies…
          </p>
        )}

        <div className="row">
          <div className="field field--grow">
            <label className="label" htmlFor="from">
              From
            </label>
            {catalogReady ? (
              <select
                id="from"
                className="select"
                value={from}
                onChange={(e) => {
                  setCommittedResult(null)
                  setFrom(e.target.value)
                }}
              >
                {currencyList.map((c) => (
                  <option key={c.code} value={c.code} disabled={c.code === to}>
                    {currencyOptionLabel(c.code)}
                  </option>
                ))}
              </select>
            ) : (
              <select id="from" className="select" disabled value="">
                <option value="">
                  {catalogBusy ? 'Loading currencies…' : 'Currencies unavailable'}
                </option>
              </select>
            )}
          </div>

          <button
            type="button"
            className="swap"
            disabled={!catalogReady}
            onClick={swapCurrencies}
            aria-label="Swap currencies"
            title="Swap currencies"
          >
            <svg
              className="swap__icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
          </button>

          <div className="field field--grow">
            <label className="label" htmlFor="to">
              To
            </label>
            {catalogReady ? (
              <select
                id="to"
                className="select"
                value={to}
                onChange={(e) => {
                  setCommittedResult(null)
                  setTo(e.target.value)
                }}
              >
                {currencyList.map((c) => (
                  <option key={c.code} value={c.code} disabled={c.code === from}>
                    {currencyOptionLabel(c.code)}
                  </option>
                ))}
              </select>
            ) : (
              <select id="to" className="select" disabled value="">
                <option value="">
                  {catalogBusy ? 'Loading currencies…' : 'Currencies unavailable'}
                </option>
              </select>
            )}
          </div>
        </div>

        {rateDate && !rateError && (
          <p className="meta" aria-live="polite">
            ECB reference rate · {rateDate}
          </p>
        )}

        {loadingRates && (
          <p className="status" role="status">
            Loading rates…
          </p>
        )}

        {rateError && !loadingRates && (
          <p className="error" role="alert">
            {rateError}
          </p>
        )}

        {committedResult && (
          <p className="result" aria-live="polite">
            {committedResult}
          </p>
        )}

        {showResultHint && (
          <p className="hint hint--result" role="status">
            Conversion will appear here when the rate is ready.
          </p>
        )}

        {!Number.isFinite(parsed) && (
          <p className="hint" role="status">
            Enter a valid amount.
          </p>
        )}

        <button
          type="button"
          className="primary"
          onClick={handleGetRate}
          disabled={!catalogReady}
        >
          Get Exchange Rate
        </button>
      </div>
    </main>
  )
}

export default App

