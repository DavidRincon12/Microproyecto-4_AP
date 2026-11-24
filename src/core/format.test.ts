import { describe, expect, it } from 'vitest'
import { formatStackOp, formatSymbolSet, formatTransition } from './format'
import type { Transition } from './types'

const transition = (input: string | null, ops: Transition['ops']): Transition => ({
  id: 't0',
  from: 'q0',
  to: 'q1',
  input,
  ops,
  explanation: '',
})

describe('formatStackOp', () => {
  it('escribe tope, entrada y reemplazo de fondo a tope', () => {
    expect(formatStackOp({ stack: 'X', top: 'X₀', push: ['X₀', 'X'] }, '0')).toBe('X₀, 0, X₀X')
  })

  it('muestra ε cuando se desapila', () => {
    expect(formatStackOp({ stack: 'X', top: 'X', push: [] }, '0')).toBe('X, 0, ε')
  })

  it('muestra la inicialización con tope y entrada ε', () => {
    expect(formatStackOp({ stack: 'X', top: null, push: ['X₀'] }, null)).toBe('ε, ε, X₀')
  })
})

describe('formatTransition', () => {
  it('separa las pilas con punto y coma', () => {
    const t = transition('0', [
      { stack: 'X', top: 'X', push: [] },
      { stack: 'Xₐ', top: 'Xₐ₀', push: ['Xₐ₀', 'Xₐ'] },
    ])
    expect(formatTransition(t)).toBe('X, 0, ε ; Xₐ₀, 0, Xₐ₀Xₐ')
  })

  it('muestra solo la entrada si no toca pilas', () => {
    expect(formatTransition(transition('b', []))).toBe('b')
  })

  it('muestra ε si no lee ni toca pilas', () => {
    expect(formatTransition(transition(null, []))).toBe('ε')
  })
})

describe('formatSymbolSet', () => {
  it('escribe el conjunto entre llaves', () => {
    expect(formatSymbolSet(['a', 'b'])).toBe('{a, b}')
  })

  it('usa ∅ para el conjunto vacío', () => {
    expect(formatSymbolSet([])).toBe('∅')
  })
})
