// Generador de referencia, solo para pruebas: enumera los valores de las variables y
// expande el patrón. No comparte código con la construcción, por eso sirve de oráculo.
import type { Count, LanguageSpec, PatternItem } from '../types'

export function enumerateLanguage(spec: LanguageSpec, maxLength: number): Set<string> {
  const names = spec.variables.map((v) => v.name)
  const values: Record<string, number> = Object.fromEntries(
    spec.variables.map((v) => [v.name, v.lowerBound]),
  )
  const words = new Set<string>()

  const visit = (index: number) => {
    if (index === names.length) {
      const word = expand(spec.items, values)
      if (word.length <= maxLength) words.add(word)
      return
    }
    const name = names[index]
    const lowerBound = spec.variables[index].lowerBound
    // La longitud no baja al crecer una variable: al pasarse del máximo no hay más candidatas.
    // El tope cubre variables que no alargan la cadena (dentro de un grupo repetido 0 veces).
    for (let value = lowerBound; value <= maxLength; value++) {
      values[name] = value
      if (expand(spec.items, values).length > maxLength) break
      visit(index + 1)
    }
    values[name] = lowerBound
  }
  visit(0)
  return words
}

const valueOf = (count: Count, values: Record<string, number>) =>
  count.kind === 'const' ? count.value : count.factor * values[count.variable]

function expand(items: readonly PatternItem[], values: Record<string, number>): string {
  return items
    .map((item) =>
      item.kind === 'block'
        ? item.symbol.repeat(valueOf(item.count, values))
        : item.body
            .map((block) => block.symbol.repeat(valueOf(block.count, values)))
            .join('')
            .repeat(valueOf(item.reps, values)),
    )
    .join('')
}

/** Todas las cadenas sobre Σ con longitud de 0 a maxLength. */
export function allWords(symbols: readonly string[], maxLength: number): string[] {
  const words = ['']
  let frontier = ['']
  for (let length = 1; length <= maxLength; length++) {
    frontier = frontier.flatMap((word) => symbols.map((s) => word + s))
    words.push(...frontier)
  }
  return words
}
