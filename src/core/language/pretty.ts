// Escritura de L normalizado con superíndices: (0ⁿ1ᵐ)ⁿ, a²ⁿ, …
import type { BlockItem, Count, PatternItem, VariableInfo } from '../types'
import { toSuperscript } from './superscripts'

export function formatCount(count: Count): string {
  if (count.kind === 'const') return count.value === 1 ? '' : toSuperscript(String(count.value))
  return toSuperscript(`${count.factor === 1 ? '' : count.factor}${count.variable}`)
}

const formatBlock = (block: BlockItem) => `${block.symbol}${formatCount(block.count)}`

export function formatPattern(items: readonly PatternItem[]): string {
  return items
    .map((item) =>
      item.kind === 'block'
        ? formatBlock(item)
        : `(${item.body.map(formatBlock).join('')})${formatCount(item.reps)}`,
    )
    .join('')
}

export function formatNormalizedLanguage(
  items: readonly PatternItem[],
  variables: readonly VariableInfo[],
): string {
  const pattern = formatPattern(items)
  const conditions = variables.map((v) => `${v.name} ≥ ${v.lowerBound}`).join(', ')
  return conditions ? `L = {${pattern} | ${conditions}}` : `L = {${pattern}}`
}
