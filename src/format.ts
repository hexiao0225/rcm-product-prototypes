export const usd = (n: number, fractionDigits = 0) =>
  n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })

export const pct = (n: number, fractionDigits = 1) => `${(n * 100).toFixed(fractionDigits)}%`

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

export const compactUsd = (n: number) => {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`
  return usd(n)
}

/** Model confidence, rendered the way a coder would want to read it. */
export const conf = (n: number) => n.toFixed(2)

export const plural = (n: number, one: string, many = `${one}s`) =>
  `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`
