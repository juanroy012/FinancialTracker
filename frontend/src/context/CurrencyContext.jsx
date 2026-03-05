import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { fmtCurrency } from '../utils/currency'
import { fetchRates, convertAmount } from '../utils/exchangeRates'

const CurrencyContext = createContext(null)
const STORAGE_KEY = 'ft-display-currency'

export function CurrencyProvider({ children }) {
  const [displayCurrency, setDisplayCurrency] = useState(
    () => localStorage.getItem(STORAGE_KEY) || 'IDR'
  )
  const [rates, setRates]             = useState(null)
  const [ratesStatus, setRatesStatus] = useState('loading')
  const [ratesDate, setRatesDate]     = useState(null)

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
  }, [])

  const changeCurrency = useCallback((code) => {
    localStorage.setItem(STORAGE_KEY, code)
    setDisplayCurrency(code)
  }, [])

  const convert = useCallback(
    (amount, fromCurrency = 'IDR') => convertAmount(amount, fromCurrency, displayCurrency, rates),
    [displayCurrency, rates]
  )

  const fmt = useCallback(
    (amount, fromCurrency = 'IDR') => fmtCurrency(convert(amount, fromCurrency), displayCurrency),
    [convert, displayCurrency]
  )

  return (
    <CurrencyContext.Provider value={{ displayCurrency, changeCurrency, rates, ratesStatus, ratesDate, convert, fmt }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be used inside CurrencyProvider')
  return ctx
}
