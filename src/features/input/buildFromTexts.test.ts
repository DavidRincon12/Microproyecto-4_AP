// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { buildFromTexts, formatInputError } from './buildFromTexts'

describe('buildFromTexts', () => {
  it('falla en alfabeto cuando hay símbolos repetidos y no intenta leer L', () => {
    const result = buildFromTexts('a, a', 'a^n')
    expect(result.status).toBe('error')
    if (result.status === 'error') {
      expect(result.alphabetErrors.length).toBeGreaterThan(0)
      expect(result.languageErrors).toEqual([])
    }
  })

  it('reporta el símbolo fuera del alfabeto en el error de L', () => {
    const result = buildFromTexts('a, b', 'a^n c^n')
    expect(result.status).toBe('error')
    if (result.status === 'error') {
      expect(result.alphabetErrors).toEqual([])
      expect(result.languageErrors.length).toBeGreaterThan(0)
      expect(result.languageErrors[0].message).toContain('c')
    }
  })

  it('construye el autómata para el ejemplo del tablero', () => {
    const result = buildFromTexts('0, 1', '{(0^n 1^m)^k | n > 0, m > 1, k = n}')
    expect(result.status).toBe('ok')
    if (result.status === 'ok') {
      expect(result.construction.automaton.states).toHaveLength(15)
      expect(result.construction.language.normalized).toBe('L = {(0ⁿ1ᵐ)ⁿ | n ≥ 1, m ≥ 2}')
    }
  })

  it('formatea errores con posición en base 1', () => {
    expect(formatInputError({ message: 'Símbolo inválido', position: 4 })).toBe(
      'Símbolo inválido (posición 5)',
    )
    expect(formatInputError({ message: 'Falta el alfabeto' })).toBe('Falta el alfabeto')
  })
})
