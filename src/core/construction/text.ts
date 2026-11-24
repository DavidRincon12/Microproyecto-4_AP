// Ayudas de redacción para las explicaciones de la construcción.

/** 1 → "1 símbolo a"; 3 → "3 símbolos a". Así se evita "la 0" o "2 1". */
export const symbolCount = (count: number, symbol: string) =>
  `${count} ${count === 1 ? 'símbolo' : 'símbolos'} ${symbol}`

/** ["X", "Y", "Z"] → "X, Y y Z"; usa «e» si la última palabra suena a i (X e Y). */
export function andList(items: readonly string[]): string {
  if (items.length <= 1) return items.join('')
  const last = items[items.length - 1]
  const soundsLikeI = /^(h?[iIíÍ]|[yY]$)/.test(last)
  return `${items.slice(0, -1).join(', ')} ${soundsLikeI ? 'e' : 'y'} ${last}`
}
