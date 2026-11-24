// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { buildConstruction, parseAlphabet, parseLanguage } from '../../core'
import { buildTransitionTable } from './transitionTable'

function buildAnBn() {
  const sigma = parseAlphabet('a, b')
  if (!sigma.ok) throw new Error('Alfabeto inválido')
  const lang = parseLanguage('{a^n b^n | n >= 0}', sigma.value)
  if (!lang.ok) throw new Error('Lenguaje inválido')
  return buildConstruction(lang.value).automaton
}

describe('buildTransitionTable', () => {
  it('construye columnas, filas, etiquetas y transiciones esperadas para aⁿbⁿ', () => {
    const automaton = buildAnBn()
    const table = buildTransitionTable(automaton)

    expect(table.columns).toEqual(['a', 'b', 'ε'])
    expect(table.rows[0].label).toBe('→ q0')
    expect(table.rows[table.rows.length - 1].label).toBe('* q3')

    const rowQ1 = table.rows.find((r) => r.state === 'q1')
    expect(rowQ1).toBeDefined()
    expect(rowQ1?.cells[0]).toEqual(['X₀, a, X₀X → q1', 'X, a, XX → q1'])
    expect(rowQ1?.cells[2]).toEqual(['ε → q2'])
  })

  it('marca →* cuando el estado inicial también es de aceptación', () => {
    const table = buildTransitionTable({
      states: [{ id: 'q0', description: 'Único' }],
      initial: 'q0',
      finals: ['q0'],
      inputAlphabet: ['a'],
      stacks: [],
      transitions: [],
    })
    expect(table.rows[0].label).toBe('→* q0')
  })
})
