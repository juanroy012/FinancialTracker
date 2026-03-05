// Supported currencies with their display config.
// symbol — shown in the account card and form label
// locale — used for toLocaleString formatting
export const CURRENCIES = [
  { code: 'IDR', symbol: 'Rp',  name: 'Indonesian Rupiah',  locale: 'id-ID' },
  { code: 'USD', symbol: '$',   name: 'US Dollar',           locale: 'en-US' },
  { code: 'EUR', symbol: '€',   name: 'Euro',                locale: 'de-DE' },
  { code: 'GBP', symbol: '£',   name: 'British Pound',       locale: 'en-GB' },
  { code: 'JPY', symbol: '¥',   name: 'Japanese Yen',        locale: 'ja-JP' },
  { code: 'SGD', symbol: 'S$',  name: 'Singapore Dollar',    locale: 'en-SG' },
  { code: 'MYR', symbol: 'RM',  name: 'Malaysian Ringgit',   locale: 'ms-MY' },
  { code: 'PHP', symbol: '₱',   name: 'Philippine Peso',     locale: 'en-PH' },
  { code: 'THB', symbol: '฿',   name: 'Thai Baht',           locale: 'th-TH' },
  { code: 'KRW', symbol: '₩',   name: 'South Korean Won',    locale: 'ko-KR' },
  { code: 'CNY', symbol: '¥',   name: 'Chinese Yuan',        locale: 'zh-CN' },
  { code: 'AUD', symbol: 'A$',  name: 'Australian Dollar',   locale: 'en-AU' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar',     locale: 'en-CA' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc',         locale: 'de-CH' },
  { code: 'INR', symbol: '₹',   name: 'Indian Rupee',        locale: 'en-IN' },
]

const _map = Object.fromEntries(CURRENCIES.map(c => [c.code, c]))

/**
 * Format a balance integer into a human-readable string for a given currency code.
 * All balances are stored as whole units (e.g. 500000 = 500,000 — never divided).
 * The decimals field only controls how many decimal places are displayed.
 */
export function fmtCurrency(amountStored, currencyCode = 'IDR') {
  const cfg = _map[currencyCode] ?? _map['IDR']
  return cfg.symbol + ' ' + amountStored.toLocaleString(cfg.locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

/** Return just the symbol for a currency code. */
export function currencySymbol(code) {
  return (_map[code] ?? _map['IDR']).symbol
}

/** Return the config object for a currency code. */
export function currencyConfig(code) {
  return _map[code] ?? _map['IDR']
}

