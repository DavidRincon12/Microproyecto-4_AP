import { describe, expect, it } from 'vitest'
import { buildConstruction } from './construction/buildConstruction'
import { formalDefinition } from './formalDefinition'
import { parseLanguage } from './language/normalize'
import { anbnAutomaton } from './testing/fixtures'

describe('formalDefinition', () => {
  it('presenta la séptupla de aⁿbⁿ', () => {
    const definition = formalDefinition(anbnAutomaton)
    expect(definition.tuple).toBe('M = (Q, Σ, Γ, δ, q₀, {X₀}, F)')
    expect(definition.states).toBe('{q0, q1, q2, q3}')
    expect(definition.inputAlphabet).toBe('{a, b}')
    expect(definition.stacks).toEqual([{ name: 'X', alphabet: '{X₀, X}', bottom: 'X₀' }])
    expect(definition.stackAlphabet).toBe('{X₀, X}')
    expect(definition.initialState).toBe('q0')
    expect(definition.bottoms).toBe('{X₀}')
    expect(definition.finals).toBe('{q3}')
    expect(definition.acceptance).toContain('estado final')
  })

  it('escribe δ con los topes y reemplazos de cada pila', () => {
    expect(formalDefinition(anbnAutomaton).transitions).toEqual([
      'δ(q0, ε, ε) = (q1, X₀)',
      'δ(q1, a, X₀) = (q1, X₀X)',
      'δ(q1, a, X) = (q1, XX)',
      'δ(q1, ε) = q2',
      'δ(q2, b, X) = (q2, ε)',
      'δ(q2, ε, X₀) = (q3, X₀)',
    ])
  })

  it('separa las pilas con punto y coma cuando hay varias', () => {
    const parsed = parseLanguage('{(0^n 1^m)^k | n > 0, m > 1, k = n}', { symbols: ['0', '1'] })
    if (!parsed.ok) throw new Error('no se esperaba un error')
    const definition = formalDefinition(buildConstruction(parsed.value).automaton)
    expect(definition.bottoms).toBe('{X₀, Y₀, Z₀, Xₐ₀, Yₐ₀}')
    expect(definition.transitions).toContain('δ(q8, 0, X ; Xₐ₀) = (q8, ε ; Xₐ₀Xₐ)')
    expect(definition.transitions).toContain(
      'δ(q0, ε, ε ; ε ; ε ; ε ; ε) = (q1, X₀ ; Y₀ ; Z₀ ; Xₐ₀ ; Yₐ₀)',
    )
  })
})
