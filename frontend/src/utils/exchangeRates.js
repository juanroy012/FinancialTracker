const CACHE_KEY  = 'ft-exchange-rates'
const CACHE_META = 'ft-exchange-rates-meta'
const TTL_MS     = 60 * 60 * 1000

export async function fetchRates(base = 'IDR') {
  try {
    const meta = JSON.parse(localStorage.getItem(CACHE_META) || '{}')
    if (meta.base === base && meta.ts && (Date.now() - meta.ts) < TTL_MS) {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')
      if (cached) return cached
    }
  } catch {
    // corrupt cache
  }

  const res = await fetch(`https://api.frankfurter.app/latest?base=${base}`)
  if (!res.ok) throw new Error(`Exchange rate fetch failed: ${res.status}`)
  const data = await res.json()

  // frankfurter omits the base currency from its response
  const rates = { ...data.rates, [base]: 1 }
  const result = { rates, base, updatedAt: data.date }

  try {
    localStorage.setItem(CACHE_KEY,  JSON.stringify(result))
    localStorage.setItem(CACHE_META, JSON.stringify({ base, ts: Date.now() }))
  } catch {
    // storage full
  }

  return result
}

export function convertAmount(amount, fromCurrency, toCurrency, rates) {
  if (fromCurrency === toCurrency) return amount
  if (!rates) return amount
  const fromRate = rates[fromCurrency]
  const toRate   = rates[toCurrency]
  if (!fromRate || !toRate) return amount
  return Math.round((amount / fromRate) * toRate)
}
