import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { buildConstruction, parseAlphabet, parseLanguage } from '../../core'
import { FormalDefinitionView } from './FormalDefinitionView'
import { StepsView } from './StepsView'

afterEach(cleanup)

function buildBoardExample() {
  const sigma = parseAlphabet('0, 1')
  if (!sigma.ok) throw new Error('Alfabeto inválido')
  const lang = parseLanguage('{(0^n 1^m)^k | n > 0, m > 1, k = n}', sigma.value)
  if (!lang.ok) throw new Error('Lenguaje inválido')
  return buildConstruction(lang.value)
}

describe('StepsView y FormalDefinitionView', () => {
  it('muestra el paso Alfabeto y la transición q1 → q2 para el ejemplo del tablero', () => {
    const construction = buildBoardExample()
    render(<StepsView construction={construction} />)

    expect(screen.getByRole('heading', { name: /Alfabeto/ })).toBeInTheDocument()
    expect(screen.getByText(/q1 → q2:/)).toBeInTheDocument()
  })

  it('permite contraer y expandir un paso', async () => {
    const user = userEvent.setup()
    const construction = buildBoardExample()
    render(<StepsView construction={construction} />)

    const buttons = screen.getAllByRole('button', { name: 'Contraer' })
    await user.click(buttons[0])
    expect(screen.getAllByRole('button', { name: 'Expandir' }).length).toBeGreaterThan(0)
  })

  it('presenta la definición formal completa del autómata', () => {
    const construction = buildBoardExample()
    render(<FormalDefinitionView automaton={construction.automaton} />)

    expect(screen.getByRole('heading', { name: /M = \(Q, Σ, Γ, δ, q₀/ })).toBeInTheDocument()
    expect(screen.getByText(/Acepta por estado final/)).toBeInTheDocument()
    expect(screen.getByText(/δ\(q1, 0,/)).toBeInTheDocument()
  })
})
