import { getLocales } from 'expo-localization'

// Skynkod is global (Lita, 2026-10-24): money shows in the currency of her
// phone's region (€, $, £, MAD…), never a fixed one.
export const userCurrency = () => {
  try { return getLocales()[0]?.currencyCode || 'EUR' } catch { return 'EUR' }
}
const userLocale = () => {
  try { return getLocales()[0]?.languageTag || 'en' } catch { return 'en' }
}

// 1234 → "€1,234" / "1 234 €" / "1,234 MAD", rounded unless `decimals`.
export const formatMoney = (amount, currency = userCurrency(), decimals = 0) => {
  const n = Number(amount) || 0
  try {
    return new Intl.NumberFormat(userLocale(), { style: 'currency', currency, minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n)
  } catch {
    return `${(decimals ? Math.round(n * 10 ** decimals) / 10 ** decimals : Math.round(n)).toLocaleString()} ${currency}`
  }
}

// The symbol alone, next to a price field: "€", "$", "MAD".
export const currencySymbol = (currency = userCurrency()) => {
  try {
    const part = new Intl.NumberFormat(userLocale(), { style: 'currency', currency }).formatToParts(0).find(p => p.type === 'currency')
    return part?.value || currency
  } catch { return currency }
}
