import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { buildConstruction, parseAlphabet, parseLanguage } from '../../core'
import { TransitionTable } from './TransitionTable.tsx'

afterEach(cleanup)

describe('TransitionTable', () => {
  it('muestra la tabla con sus encabezados, celdas monoespaciadas y leyenda', () => {
    const sigma = parseAlphabet('a, b')
    if (!sigma.ok) throw new Error('Alfabeto inválido')
    const lang = parseLanguage('{a^n b^n | n >= 0}', sigma.value)
    if (!lang.ok) throw new Error('Lenguaje inválido')
    const { automaton } = buildConstruction(lang.value)

    render(<TransitionTable automaton={automaton} />)

    expect(screen.getByRole('columnheader', { name: 'Estado' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'a' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'b' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'ε' })).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: '→ q0' })).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: '* q3' })).toBeInTheDocument()
    expect(screen.getByText('X₀, a, X₀X → q1')).toBeInTheDocument()
    expect(screen.getByText('→ estado inicial, * estado de aceptación')).toBeInTheDocument()
  })
})
