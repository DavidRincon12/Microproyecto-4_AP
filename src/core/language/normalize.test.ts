import { describe, expect, it } from 'vitest'
import type { Alphabet, LanguageSpec } from '../types'
import { parseLanguage } from './normalize'

const sigma = (...symbols: string[]): Alphabet => ({ symbols })

const specOf = (text: string, alphabet: Alphabet): LanguageSpec => {
  const result = parseLanguage(text, alphabet)
  if (!result.ok) throw new Error(result.errors.map((e) => e.message).join('; '))
  return result.value
}

const errorOf = (text: string, alphabet: Alphabet) => {
  const result = parseLanguage(text, alphabet)
  if (result.ok) throw new Error('se esperaba un error')
  return result.errors.map((e) => e.message).join(' | ')
}

const block = (symbol: string, variable: string, factor = 1) => ({
  kind: 'block',
  symbol,
  count: { kind: 'var', variable, factor },
})
const constant = (symbol: string, value = 1) => ({
  kind: 'block',
  symbol,
  count: { kind: 'const', value },
})

describe('parseLanguage', () => {
  it('normaliza el ejercicio del tablero', () => {
    const spec = specOf('{(0^n 1^m)^k | n > 0, m > 1, k = n}', sigma('0', '1'))
    expect(spec.items).toEqual([
      {
        kind: 'group',
        body: [block('0', 'n'), block('1', 'm')],
        reps: { kind: 'var', variable: 'n', factor: 1 },
      },
    ])
    expect(spec.variables).toEqual([
      { name: 'n', lowerBound: 1, aliases: ['k'] },
      { name: 'm', lowerBound: 2, aliases: [] },
    ])
    expect(spec.normalized).toBe('L = {(0ⁿ1ᵐ)ⁿ | n ≥ 1, m ≥ 2}')
  })

  it('da el mismo resultado con superíndices', () => {
    const ascii = specOf('{(0^n 1^m)^k | n > 0, m > 1, k = n}', sigma('0', '1'))
    const unicode = specOf('{(0ⁿ1ᵐ)ᵏ : n>0, m>1, k=n}', sigma('0', '1'))
    expect(unicode.items).toEqual(ascii.items)
    expect(unicode.variables).toEqual(ascii.variables)
  })

  it('reemplaza una variable por un múltiplo de otra', () => {
    const spec = specOf('a^n b^m | m = 2n', sigma('a', 'b'))
    expect(spec.items).toEqual([block('a', 'n'), block('b', 'n', 2)])
    expect(spec.variables.map((v) => v.name)).toEqual(['n'])
  })

  it('separa las sumas del exponente en bloques seguidos', () => {
    const spec = specOf('a^n b^m c^(n+m) | n, m >= 1', sigma('a', 'b', 'c'))
    expect(spec.items).toEqual([block('a', 'n'), block('b', 'm'), block('c', 'n'), block('c', 'm')])
  })

  it('desenrolla un grupo con exponente numérico', () => {
    expect(specOf('(ab)^2', sigma('a', 'b')).items).toEqual([
      constant('a'),
      constant('b'),
      constant('a'),
      constant('b'),
    ])
  })

  it('asume n ≥ 0 cuando la variable no tiene condición', () => {
    const spec = specOf('a^n b^n', sigma('a', 'b'))
    expect(spec.variables).toEqual([{ name: 'n', lowerBound: 0, aliases: [] }])
    expect(spec.notes.join(' ')).toContain('n ≥ 0')
  })

  it('rechaza símbolos que no están en Σ (RF-04)', () => {
    const message = errorOf('a^n c^n', sigma('a', 'b'))
    expect(message).toContain('«c»')
    expect(message).toContain('no pertenece')
  })

  it('rechaza variables que solo aparecen en las condiciones', () => {
    expect(errorOf('a^n | n > 0, j > 1', sigma('a'))).toContain('«j»')
  })

  it('explica que las desigualdades entre variables no están soportadas', () => {
    expect(errorOf('a^n b^m | n < m', sigma('a', 'b'))).toContain('no está soportad')
    expect(errorOf('a^n b^m | n > m', sigma('a', 'b'))).toContain('no está soportad')
  })

  it('rechaza grupos anidados', () => {
    expect(errorOf('((ab)^n)^k', sigma('a', 'b'))).toContain('dentro')
  })

  it('exige una sola variable como exponente de un grupo', () => {
    expect(errorOf('(ab)^(2n)', sigma('a', 'b'))).toContain('exponente de un grupo')
    expect(errorOf('(ab)^(n+m)', sigma('a', 'b'))).toContain('exponente de un grupo')
  })

  it('detecta condiciones contradictorias', () => {
    expect(errorOf('a^n | n = 2, n > 3', sigma('a'))).toContain('contradic')
    expect(errorOf('a^n b^k | k = n, k = 2n', sigma('a', 'b'))).toContain('contradic')
  })

  it('rechaza usar afuera una variable definida en un grupo que puede repetirse 0 veces', () => {
    expect(errorOf('(a^n b)^k c^n | k >= 0', sigma('a', 'b', 'c'))).toContain('0 veces')
  })

  it('limita la longitud del texto', () => {
    expect(errorOf(`a^n ${'b'.repeat(200)}`, sigma('a', 'b'))).toContain('200')
  })
})
