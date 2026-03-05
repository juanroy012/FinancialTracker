// Fetches exchange rates from frankfurter.app — free, no API key required.
// Rates are cached in localStorage for 1 hour to avoid unnecessary requests.
//
// frankfurter.app always returns rates relative to a base currency.
// e.g. GET /latest?base=IDR returns { rates: { USD: 0.000062, EUR: 0.000057, ... } }

const CACHE_KEY  = 'ft-exchange-rates'
const CACHE_META = 'ft-exchange-rates-meta'
const TTL_MS     = 60 * 60 * 1000  // 1 hour

/**
 * Returns { rates, base, updatedAt } where rates is { USD: x, EUR: x, ... }
 * with base as the "from" currency (all values are "1 base = x target").
 * Throws on network or parse errors.
 */
export async function fetchRates(base = 'IDR') {
  // Check cache first
  try {
    const meta = JSON.parse(localStorage.getItem(CACHE_META) || '{}')
    if (meta.base === base && meta.ts && (Date.now() - meta.ts) < TTL_MS) {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')
      if (cached) return cached
    }
  } catch {
    // corrupt cache — fall through to fetch
  }

  const res = await fetch(`https://api.frankfurter.app/latest?base=${base}`)
  if (!res.ok) throw new Error(`Exchange rate fetch failed: ${res.status}`)
  const data = await res.json()

  // frankfurter doesn't include the base currency itself in rates,
  // so add it manually as 1.
  const rates = { ...data.rates, [base]: 1 }
  const result = { rates, base, updatedAt: data.date }

  // Persist to cache
  try {
    localStorage.setItem(CACHE_KEY,  JSON.stringify(result))
    localStorage.setItem(CACHE_META, JSON.stringify({ base, ts: Date.now() }))
  } catch {
    // storage full — skip caching
  }

  return result
}

/**
 * Convert an amount from one currency to another using a rates object
 * (where rates[currency] = "1 base = x currency").
 *
 * If either currency isn't in the rates map, returns the original amount unchanged.
 */
export function convertAmount(amount, fromCurrency, toCurrency, rates) {
  if (fromCurrency === toCurrency) return amount
  if (!rates) return amount
  // Convert: amount in fromCurrency → base → toCurrency
  const fromRate = rates[fromCurrency]
  const toRate   = rates[toCurrency]
  if (!fromRate || !toRate) return amount
  return Math.round((amount / fromRate) * toRate)
}

