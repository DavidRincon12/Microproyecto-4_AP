// Modelo de datos puro para la tabla de transición del autómata a pila (RF-08).
import { EPSILON, formatTransition } from '../../core'
import type { Automaton } from '../../core'

export interface TransitionTableRow {
  readonly state: string
  readonly label: string
  readonly cells: readonly (readonly string[])[]
}

export interface TransitionTableModel {
  readonly columns: readonly string[]
  readonly rows: readonly TransitionTableRow[]
}

function formatStateLabel(stateId: string, initial: string, finals: readonly string[]): string {
  const isInitial = stateId === initial
  const isFinal = finals.includes(stateId)
  if (isInitial && isFinal) return `→* ${stateId}`
  if (isInitial) return `→ ${stateId}`
  if (isFinal) return `* ${stateId}`
  return stateId
}

export function buildTransitionTable(automaton: Automaton): TransitionTableModel {
  const columns = [...automaton.inputAlphabet, EPSILON]
  const colIndex = new Map(columns.map((col, idx) => [col, idx]))

  const rows: TransitionTableRow[] = automaton.states.map((state) => {
    const cells: string[][] = columns.map(() => [])
    for (const transition of automaton.transitions) {
      if (transition.from !== state.id) continue
      const key = transition.input ?? EPSILON
      const idx = colIndex.get(key)
      if (idx === undefined) continue
      cells[idx].push(`${formatTransition(transition)} → ${transition.to}`)
    }

    return {
      state: state.id,
      label: formatStateLabel(state.id, automaton.initial, automaton.finals),
      cells,
    }
  })

  return { columns, rows }
}
