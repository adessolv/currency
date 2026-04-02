import { useEffect, useRef, useState } from 'react'
import type { CurrencyInfo } from './api/fetchCurrencies'
import { getFlagCodeFromCurrency } from './utils/getFlagCodeFromCurrency'

interface Props {
  id: string
  value: string
  currencies: CurrencyInfo[]
  disabledCode?: string
  disabled?: boolean
  onChange: (code: string) => void
}

function FlagIcon({ currencyCode }: { currencyCode: string }) {
  const countryCode = getFlagCodeFromCurrency(currencyCode)

  return (
    <img
      className="cs-flag-img"
      src={`https://flagcdn.com/24x18/${countryCode}.png`}
      alt=""
      loading="lazy"
      width="24"
      height="18"
      onError={(e) => {
        ;(e.currentTarget as HTMLImageElement).style.display = 'none'
      }}
    />
  )
}

export function CurrencySelect({
  id,
  value,
  currencies,
  disabledCode,
  disabled,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const filtered = currencies.filter((c) => {
    const q = search.toLowerCase()
    return (
      c.code.toLowerCase().includes(q) ||
      (c.name ?? '').toLowerCase().includes(q)
    )
  })

  useEffect(() => {
    if (!open) return

    function handleClickOutside(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 0)
    }
  }, [open])

  function handleSelect(code: string) {
    onChange(code)
    setOpen(false)
    setSearch('')
  }

  return (
    <div ref={wrapperRef} className="cs-wrapper">
      <button
        id={id}
        type="button"
        className="cs-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
      >
        <FlagIcon currencyCode={value} />
        <span className="cs-code">{value}</span>

        <svg
          className={`cs-chevron${open ? ' cs-chevron--open' : ''}`}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>

      {open && (
        <div className="cs-dropdown">
          <div className="cs-search-wrapper">
            <input
              ref={searchRef}
              className="cs-search"
              type="text"
              placeholder="Search currency"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <ul className="cs-list" role="listbox" aria-labelledby={id}>
            {filtered.length === 0 ? (
              <li className="cs-empty">No currencies found</li>
            ) : (
              filtered.map((c) => {
                const isDisabled = c.code === disabledCode
                const isSelected = c.code === value

                return (
                  <li key={c.code}>
                    <button
                      type="button"
                      className={`cs-option${isSelected ? ' cs-option--selected' : ''}`}
                      onClick={() => handleSelect(c.code)}
                      disabled={isDisabled}
                    >
                      <FlagIcon currencyCode={c.code} />
                      <span className="cs-code">{c.code}</span>
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      )}
    </div>
  )
}