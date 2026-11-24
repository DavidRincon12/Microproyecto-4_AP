import { describe, expect, it } from 'vitest'
import { parseLanguage } from '../language/normalize'
import type { LanguageSpec } from '../types'
import { analyze } from './analyze'

const specOf = (language: string, ...symbols: string[]): LanguageSpec => {
  const result = parseLanguage(language, { symbols })
  if (!result.ok) throw new Error(result.errors.map((e) => e.message).join('; '))
  return result.value
}

describe('analyze', () => {
  it('asigna las cinco pilas del tablero', () => {
    const analysis = analyze(specOf('{(0^n 1^m)^k | n > 0, m > 1, k = n}', '0', '1'))
    expect(analysis.stacks.map((s) => s.name)).toEqual(['X', 'Y', 'Z', 'Xₐ', 'Yₐ'])
    expect(analysis.stacks.map((s) => s.bottom)).toEqual(['X₀', 'Y₀', 'Z₀', 'Xₐ₀', 'Yₐ₀'])
    expect(analysis.roleOf(0, 0, 'def')).toEqual({ kind: 'define', targets: ['X', 'Z'] })
    expect(analysis.roleOf(0, 1, 'def')).toEqual({ kind: 'define', targets: ['Y'] })
    expect(analysis.roleOf(0, 0, 'verif')).toEqual({
      kind: 'verifyTransfer',
      stack: 'X',
      aux: 'Xₐ',
    })
    expect(analysis.roleOf(0, 1, 'verif')).toEqual({
      kind: 'verifyTransfer',
      stack: 'Y',
      aux: 'Yₐ',
    })
    expect(analysis.groupOf(0)).toEqual({
      mode: 'b',
      variable: 'n',
      repsStack: 'Z',
      pushTargets: [],
      hasDefinitions: true,
    })
    expect(analysis.cleanup).toEqual(['X', 'Y'])
  })

  it('usa una sola pila y desapila para aⁿbⁿ', () => {
    const analysis = analyze(specOf('a^n b^n | n >= 0', 'a', 'b'))
    expect(analysis.stacks.map((s) => s.name)).toEqual(['X'])
    expect(analysis.roleOf(0, null, 'def')).toEqual({ kind: 'define', targets: ['X'] })
    expect(analysis.roleOf(1, null, 'def')).toEqual({ kind: 'verifyPop', stack: 'X' })
    expect(analysis.cleanup).toEqual([])
  })

  it('no usa pila para una variable que aparece una sola vez', () => {
    const analysis = analyze(specOf('a^n b^m c^n | n, m >= 1', 'a', 'b', 'c'))
    expect(analysis.roleOf(1, null, 'def')).toEqual({ kind: 'free' })
    expect(analysis.stacks.map((s) => s.name)).toEqual(['X'])
  })

  it('traspasa a la auxiliar cuando el conteo se usa otra vez', () => {
    const analysis = analyze(specOf('a^n b^n c^n | n >= 1', 'a', 'b', 'c'))
    expect(analysis.stacks.map((s) => s.name)).toEqual(['X', 'Xₐ'])
    expect(analysis.roleOf(1, null, 'def')).toEqual({
      kind: 'verifyTransfer',
      stack: 'X',
      aux: 'Xₐ',
    })
    expect(analysis.roleOf(2, null, 'def')).toEqual({ kind: 'verifyPop', stack: 'X' })
  })

  it('cuenta las repeticiones apilando cuando el grupo define la variable', () => {
    const analysis = analyze(specOf('(ab)^n c^n', 'a', 'b', 'c'))
    expect(analysis.groupOf(0)).toEqual({
      mode: 'c',
      variable: 'n',
      repsStack: null,
      pushTargets: ['X'],
      hasDefinitions: false,
    })
    expect(analysis.roleOf(0, 0, 'def')).toEqual({ kind: 'const' })
    expect(analysis.roleOf(1, null, 'def')).toEqual({ kind: 'verifyPop', stack: 'X' })
  })

  it('usa una pila de repeticiones cuando la variable se definió antes del grupo', () => {
    const analysis = analyze(specOf('a^k (bc)^k', 'a', 'b', 'c'))
    expect(analysis.stacks.map((s) => s.name)).toEqual(['X'])
    expect(analysis.roleOf(0, null, 'def')).toEqual({ kind: 'define', targets: ['X'] })
    expect(analysis.groupOf(1)).toMatchObject({ mode: 'a', repsStack: 'X' })
  })

  it('deja solo el fondo de X cuando el lenguaje es regular', () => {
    const analysis = analyze(specOf('a^n b^m', 'a', 'b'))
    expect(analysis.stacks).toHaveLength(1)
    expect(analysis.stacks[0]).toMatchObject({ name: 'X', bottom: 'X₀' })
    expect(analysis.roleOf(0, null, 'def')).toEqual({ kind: 'free' })
    expect(analysis.roleOf(1, null, 'def')).toEqual({ kind: 'free' })
  })

  it('explica cada variable en una línea', () => {
    const analysis = analyze(specOf('{(0^n 1^m)^k | n > 0, m > 1, k = n}', '0', '1'))
    expect(analysis.variableLines).toHaveLength(2)
    expect(analysis.variableLines[0]).toMatch(/^n: /)
  })
})
