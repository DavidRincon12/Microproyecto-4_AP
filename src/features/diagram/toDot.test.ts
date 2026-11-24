// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { buildConstruction, parseAlphabet, parseLanguage } from '../../core'
import { toDot } from './toDot'

function buildFrom(alphabet: string, language: string) {
  const sigma = parseAlphabet(alphabet)
  if (!sigma.ok) throw new Error('Alfabeto inválido')
  const lang = parseLanguage(language, sigma.value)
  if (!lang.ok) throw new Error('Lenguaje inválido')
  return buildConstruction(lang.value).automaton
}

describe('toDot', () => {
  it('genera el grafo DOT agrupando aristas paralelas de aⁿbⁿ', () => {
    const automaton = buildFrom('a, b', '{a^n b^n | n >= 0}')
    const dot = toDot(automaton)

    expect(dot).toContain('rankdir=LR;')
    expect(dot).toContain('inicio -> q0;')
    expect(dot).toContain('q3 [shape=doublecircle];')
    expect(dot).toContain('q1 -> q1 [label="X₀, a, X₀X\\nX, a, XX"];')
  })

  it('escapa comillas y barras invertidas en símbolos del alfabeto', () => {
    const automaton = buildFrom('", a', '{"^n a^n | n >= 1}')
    const dot = toDot(automaton)

    expect(dot).toContain('\\"')
  })
})
