// Genera el texto en formato DOT (Graphviz) para el diagrama de transición (RF-09).
import { formatTransition } from '../../core'
import type { Automaton } from '../../core'

function escapeDotLabel(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

export function toDot(automaton: Automaton, activeState?: string): string {
  const lines: string[] = [
    'digraph automata {',
    '  rankdir=LR;',
    '  node [shape=circle, fontname="Helvetica"];',
    '  edge [fontname="Helvetica", fontsize=11];',
    '  inicio [shape=point, width=0.1];',
    `  inicio -> ${automaton.initial};`,
  ]

  for (const finalState of automaton.finals) {
    lines.push(`  ${finalState} [shape=doublecircle];`)
  }

  if (activeState) {
    lines.push(`  ${activeState} [style=filled, fillcolor="#fef08a"];`)
  }

  const edgeGroups = new Map<string, string[]>()
  for (const transition of automaton.transitions) {
    const key = `${transition.from}\u0000${transition.to}`
    const escaped = escapeDotLabel(formatTransition(transition))
    const existing = edgeGroups.get(key)
    if (existing) {
      existing.push(escaped)
    } else {
      edgeGroups.set(key, [escaped])
    }
  }

  for (const [key, labels] of edgeGroups) {
    const [from, to] = key.split('\u0000')
    lines.push(`  ${from} -> ${to} [label="${labels.join('\\n')}"];`)
  }

  lines.push('}')
  return lines.join('\n')
}
