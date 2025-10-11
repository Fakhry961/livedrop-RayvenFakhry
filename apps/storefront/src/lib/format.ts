export const fmtCurrency = (v: number) => {
  return `$${v.toFixed(2)}`
}

export default { fmtCurrency }
