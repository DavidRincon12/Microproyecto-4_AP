// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { parseAlphabet } from './alphabet'
import { buildConstruction } from './construction/buildConstruction'
import { EXAMPLES } from './examples'
import { parseLanguage } from './language/normalize'
import { simulate } from './simulation/simulate'

describe('EXAMPLES', () => {
  it('incluye el ejemplo del enunciado y el del tablero', () => {
    expect(EXAMPLES.map((e) => e.id)).toEqual(expect.arrayContaining(['anbn', 'tablero']))
    expect(EXAMPLES.length).toBeGreaterThanOrEqual(8)
  })

  it.each(EXAMPLES)('$title cumple sus casos de prueba', (example) => {
    const alphabet = parseAlphabet(example.alphabet)
    if (!alphabet.ok) throw new Error(alphabet.errors[0].message)
    const language = parseLanguage(example.language, alphabet.value)
    if (!language.ok) throw new Error(language.errors[0].message)
    const { automaton } = buildConstruction(language.value)
    for (const word of example.accepted) expect(simulate(automaton, word).accepted, word).toBe(true)
    for (const word of example.rejected)
      expect(simulate(automaton, word).accepted, word).toBe(false)
  })
})
