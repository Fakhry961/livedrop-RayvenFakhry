/**
 * Format number as a fixed 2-decimal currency string with leading `$`.
 * Example: 12.5 -> "$12.50"
 */
export const fmtCurrency = (v: number) => {
  return `$${v.toFixed(2)}`
}

export default { fmtCurrency }
