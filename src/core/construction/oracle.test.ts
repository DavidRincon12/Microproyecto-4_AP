// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { parseLanguage } from '../language/normalize'
import { simulate } from '../simulation/simulate'
import { allWords, enumerateLanguage } from '../testing/referenceLanguage'
import { buildConstruction } from './buildConstruction'

// Catálogo del diseño (6.3) y casos que ejercitan cada pieza y cada modo de grupo.
const CATALOG: readonly [language: string, symbols: string][] = [
  ['a^n b^n | n >= 0', 'ab'],
  ['a^n b^(2n) | n >= 0', 'ab'],
  ['a^(2n) b^n', 'ab'],
  ['a^n b^m c^n | n, m >= 1', 'abc'],
  ['a^n b^m c^m d^n | n, m >= 1', 'abcd'],
  ['a^n b^n c^n | n >= 1', 'abc'],
  ['a^n b^m c^(n+m) | n, m >= 1', 'abc'],
  ['(ab)^n c^n', 'abc'],
  ['a^k (bc)^k', 'abc'],
  ['{(0^n 1^m)^k | n > 0, m > 1, k = n}', '01'],
  ['a^n a^m b^n', 'ab'],
  ['(0^n 1)^n | n >= 0', '01'],
  ['a^n b^m', 'ab'],
  ['(a^j b)^k | k >= 1', 'ab'],
  ['(ab)^k c', 'abc'],
  ['a b^n a^2 b^n', 'ab'],
  ['(a^n b^m)^2 | n >= 1', 'ab'],
  ['(ab)^n (ba)^n', 'ab'],
  ['a^n (b^n c)^k | n >= 1, k >= 1', 'abc'],
]

const MAX_LENGTH: Record<number, number> = { 2: 10, 3: 7, 4: 6 }

describe('oráculo: el autómata acepta exactamente las cadenas de L', () => {
  it.each(CATALOG)('%s', (language, symbolText) => {
    const symbols = [...symbolText]
    const parsed = parseLanguage(language, { symbols })
    if (!parsed.ok) throw new Error(parsed.errors.map((e) => e.message).join('; '))
    const { automaton } = buildConstruction(parsed.value)
    const maxLength = MAX_LENGTH[symbols.length]
    const reference = enumerateLanguage(parsed.value, maxLength)
    const mismatches = allWords(symbols, maxLength).filter(
      (word) => simulate(automaton, word).accepted !== reference.has(word),
    )
    expect(mismatches).toEqual([])
  })
})
