// Única fuente de la notación de la profesora: "tope, entrada, reemplazo" por pila,
// pilas separadas con " ; " y reemplazo escrito de fondo a tope.
// Si la notación cambia (λ en vez de ε, otro separador), se cambia solo aquí.
import type { StackOp, Transition } from './types'

export const EPSILON = 'ε'
const OP_SEPARATOR = ' ; '

export function formatStackOp(op: StackOp, input: string | null): string {
  const top = op.top ?? EPSILON
  const replacement = op.push.length > 0 ? op.push.join('') : EPSILON
  return `${top}, ${input ?? EPSILON}, ${replacement}`
}

export function formatTransition(t: Transition): string {
  if (t.ops.length === 0) return t.input ?? EPSILON
  return t.ops.map((op) => formatStackOp(op, t.input)).join(OP_SEPARATOR)
}

export function formatSymbolSet(symbols: readonly string[]): string {
  return symbols.length === 0 ? '∅' : `{${symbols.join(', ')}}`
}
