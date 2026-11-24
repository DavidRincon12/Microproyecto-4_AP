import { describe, expect, it } from 'vitest'
import { formatTransition } from '../format'
import { parseLanguage } from '../language/normalize'
import { simulate } from '../simulation/simulate'
import type { Automaton, Construction } from '../types'
import { buildConstruction } from './buildConstruction'

const build = (language: string, ...symbols: string[]): Construction => {
  const result = parseLanguage(language, { symbols })
  if (!result.ok) throw new Error(result.errors.map((e) => e.message).join('; '))
  return buildConstruction(result.value)
}

const listOf = (automaton: Automaton) =>
  automaton.transitions.map((t) => `${t.from}→${t.to}: ${formatTransition(t)}`).sort()

const BOARD = '{(0^n 1^m)^k | n > 0, m > 1, k = n}'

describe('buildConstruction', () => {
  it('construye aⁿbⁿ igual que el diseño (7.5)', () => {
    const { automaton } = build('a^n b^n | n >= 0', 'a', 'b')
    expect(automaton.states.map((s) => s.id)).toEqual(['q0', 'q1', 'q2', 'q3'])
    expect(automaton.initial).toBe('q0')
    expect(automaton.finals).toEqual(['q3'])
    expect(listOf(automaton)).toEqual(
      [
        'q0→q1: ε, ε, X₀',
        'q1→q1: X₀, a, X₀X',
        'q1→q1: X, a, XX',
        'q1→q2: ε',
        'q2→q2: X, b, ε',
        'q2→q3: X₀, ε, X₀',
      ].sort(),
    )
  })

  it('construye el ejercicio del tablero igual que el diseño (7.4)', () => {
    const { automaton } = build(BOARD, '0', '1')
    expect(automaton.states).toHaveLength(15)
    expect(automaton.transitions).toHaveLength(27)
    expect(automaton.finals).toEqual(['q14'])
    expect(automaton.stacks.map((s) => s.name)).toEqual(['X', 'Y', 'Z', 'Xₐ', 'Yₐ'])
    expect(listOf(automaton)).toEqual(
      [
        'q0→q1: ε, ε, X₀ ; ε, ε, Y₀ ; ε, ε, Z₀ ; ε, ε, Xₐ₀ ; ε, ε, Yₐ₀',
        'q1→q2: X₀, 0, X₀X ; Z₀, 0, Z₀Z',
        'q2→q2: X, 0, XX ; Z, 0, ZZ',
        'q2→q3: ε',
        'q3→q4: Y₀, 1, Y₀Y',
        'q4→q5: Y, 1, YY',
        'q5→q5: Y, 1, YY',
        'q5→q6: ε',
        'q6→q7: Z, ε, ε',
        'q7→q13: Z₀, ε, Z₀',
        'q7→q8: Z, ε, ε',
        'q8→q8: X, 0, ε ; Xₐ₀, 0, Xₐ₀Xₐ',
        'q8→q8: X, 0, ε ; Xₐ, 0, XₐXₐ',
        'q8→q9: X₀, ε, X₀',
        'q9→q9: Xₐ, ε, ε ; X₀, ε, X₀X',
        'q9→q9: Xₐ, ε, ε ; X, ε, XX',
        'q9→q10: Xₐ₀, ε, Xₐ₀',
        'q10→q10: Y, 1, ε ; Yₐ₀, 1, Yₐ₀Yₐ',
        'q10→q10: Y, 1, ε ; Yₐ, 1, YₐYₐ',
        'q10→q11: Y₀, ε, Y₀',
        'q11→q11: Yₐ, ε, ε ; Y₀, ε, Y₀Y',
        'q11→q11: Yₐ, ε, ε ; Y, ε, YY',
        'q11→q12: Yₐ₀, ε, Yₐ₀',
        'q12→q7: ε',
        'q13→q13: X, ε, ε',
        'q13→q13: Y, ε, ε',
        'q13→q14: X₀, ε, X₀ ; Y₀, ε, Y₀',
      ].sort(),
    )
  })

  it('explica cada estado y cada transición en exactamente un paso', () => {
    const { automaton, steps } = build(BOARD, '0', '1')
    expect(steps[0].title).toBe('Alfabeto')
    expect(steps.at(-1)!.title).toBe('Resumen')
    const ids = steps.flatMap((s) => s.transitions)
    expect([...ids].sort()).toEqual(automaton.transitions.map((t) => t.id).sort())
    expect(automaton.states.every((s) => s.description.trim() !== '')).toBe(true)
    expect(automaton.transitions.every((t) => t.explanation.trim() !== '')).toBe(true)
  })

  it('acepta y rechaza las cadenas del tablero', () => {
    const { automaton } = build(BOARD, '0', '1')
    expect(simulate(automaton, '011').accepted).toBe(true)
    expect(simulate(automaton, '00110011').accepted).toBe(true)
    expect(simulate(automaton, '0011001').accepted).toBe(false)
    expect(simulate(automaton, '011011').accepted).toBe(false)
  })

  it('no acepta 00 cuando el grupo puede repetirse 0 veces', () => {
    const { automaton } = build('(0^n 1)^n | n >= 0', '0', '1')
    expect(simulate(automaton, '').accepted).toBe(true)
    expect(simulate(automaton, '01').accepted).toBe(true)
    expect(simulate(automaton, '001001').accepted).toBe(true)
    expect(simulate(automaton, '00').accepted).toBe(false)
  })

  it('simula una cadena larga del tablero en poco tiempo', () => {
    const { automaton } = build(BOARD, '0', '1')
    const input = `${'0'.repeat(9)}11`.repeat(9)
    const start = performance.now()
    expect(simulate(automaton, input).accepted).toBe(true)
    expect(performance.now() - start).toBeLessThan(2000)
  })
})
