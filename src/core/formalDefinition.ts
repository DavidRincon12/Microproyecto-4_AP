// Definición formal (RF-07): la séptupla clásica con el conjunto de fondos de las pilas
// en lugar de un solo Z₀, y δ escrita con los topes y reemplazos de cada pila.
import { EPSILON, formatSymbolSet } from './format'
import type { Automaton, FormalDefinition, Transition } from './types'

export function formalDefinition(automaton: Automaton): FormalDefinition {
  const bottoms = formatSymbolSet(automaton.stacks.map((s) => s.bottom))
  const finals = automaton.finals.join(', ')
  return {
    tuple: `M = (Q, Σ, Γ, δ, q₀, ${bottoms}, F)`,
    states: formatSymbolSet(automaton.states.map((s) => s.id)),
    inputAlphabet: formatSymbolSet(automaton.inputAlphabet),
    stacks: automaton.stacks.map((s) => ({
      name: s.name,
      alphabet: formatSymbolSet([s.bottom, s.token]),
      bottom: s.bottom,
    })),
    stackAlphabet: formatSymbolSet(automaton.stacks.flatMap((s) => [s.bottom, s.token])),
    initialState: automaton.initial,
    bottoms,
    finals: formatSymbolSet(automaton.finals),
    transitions: automaton.transitions.map(formatDelta),
    acceptance: `Acepta por estado final: una cadena es aceptada si, al terminar de leerla, el autómata puede estar en ${finals}. En ese momento cada pila tiene solo su fondo.`,
  }
}

function formatDelta(t: Transition): string {
  const input = t.input ?? EPSILON
  if (t.ops.length === 0) return `δ(${t.from}, ${input}) = ${t.to}`
  const tops = t.ops.map((op) => op.top ?? EPSILON).join(' ; ')
  const replacements = t.ops
    .map((op) => (op.push.length > 0 ? op.push.join('') : EPSILON))
    .join(' ; ')
  return `δ(${t.from}, ${input}, ${tops}) = (${t.to}, ${replacements})`
}
