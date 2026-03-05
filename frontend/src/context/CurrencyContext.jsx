import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { fmtCurrency } from '../utils/currency'
import { fetchRates, convertAmount } from '../utils/exchangeRates'

const CurrencyContext = createContext(null)

const STORAGE_KEY = 'ft-display-currency'

export function CurrencyProvider({ children }) {
  const [displayCurrency, setDisplayCurrency] = useState(
    () => localStorage.getItem(STORAGE_KEY) || 'IDR'
  )
  // rates object: { USD: x, EUR: x, IDR: 1, ... } — base is always IDR
  const [rates, setRates]             = useState(null)
  // 'loading' | 'ok' | 'error'
  const [ratesStatus, setRatesStatus] = useState('loading')
  const [ratesDate, setRatesDate]     = useState(null)

  // Fetch rates on mount and whenever displayCurrency changes.
  // frankfurter.app uses IDR as base so all stored amounts (which are native units)
  // convert correctly regardless of the display currency chosen.
  useEffect(() => {
    let cancelled = false
    setRatesStatus('loading')
    fetchRates('IDR')
      .then(data => {
        if (cancelled) return
        setRates(data.rates)
        setRatesDate(data.updatedAt)
        setRatesStatus('ok')
      })
      .catch(() => {
        if (cancelled) return
        setRatesStatus('error')
      })
    return () => { cancelled = true }
  }, [])   // only on mount — rates don't change per-currency-switch

  const changeCurrency = useCallback((code) => {
    localStorage.setItem(STORAGE_KEY, code)
    setDisplayCurrency(code)
  }, [])

  /**
   * Convert an amount stored in `fromCurrency` to `displayCurrency` and format it.
   * If rates haven't loaded yet, formats without conversion.
   */
  const convert = useCallback(
    (amount, fromCurrency = 'IDR') => convertAmount(amount, fromCurrency, displayCurrency, rates),
    [displayCurrency, rates]
  )

  /**
   * fmt(amount, fromCurrency?) — converts then formats.
   * fromCurrency defaults to IDR (all transaction amounts are stored in their
   * account's native currency; callers pass the account currency explicitly).
   */
  const fmt = useCallback(
    (amount, fromCurrency = 'IDR') =>
      fmtCurrency(convert(amount, fromCurrency), displayCurrency),
    [convert, displayCurrency]
  )

  return (
    <CurrencyContext.Provider value={{
      displayCurrency,
      changeCurrency,
      rates,
      ratesStatus,
      ratesDate,
      convert,
      fmt,
    }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be used inside CurrencyProvider')
  return ctx
}
