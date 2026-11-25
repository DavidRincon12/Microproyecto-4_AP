import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { EXAMPLES, buildConstruction, parseAlphabet, parseLanguage, simulate } from '../../core'
import type { SimulationResult } from '../../core'
import { SimulationPanel } from './SimulationPanel'

afterEach(cleanup)

function SimulationHarness() {
  const sigma = parseAlphabet('a, b')
  if (!sigma.ok) throw new Error('Alfabeto inválido')
  const lang = parseLanguage('{a^n b^n | n >= 0}', sigma.value)
  if (!lang.ok) throw new Error('Lenguaje inválido')
  const { automaton } = buildConstruction(lang.value)
  const example = EXAMPLES.find((e) => e.id === 'anbn') ?? null

  const [inputText, setInputText] = useState('')
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [stepIndex, setStepIndex] = useState(0)

  const handleSimulate = (raw: string) => {
    setResult(simulate(automaton, raw))
    setStepIndex(0)
  }

  return (
    <SimulationPanel
      automaton={automaton}
      example={example}
      inputText={inputText}
      result={result}
      stepIndex={stepIndex}
      onInputChange={setInputText}
      onSimulate={handleSimulate}
      onStepChange={setStepIndex}
    />
  )
}

describe('SimulationPanel', () => {
  it('acepta aabb, avanza el estado con Siguiente de q0 a q1 y rechaza aab', async () => {
    const user = userEvent.setup()
    render(<SimulationHarness />)

    const input = screen.getByLabelText('Cadena')
    await user.type(input, 'aabb')
    await user.click(screen.getByRole('button', { name: 'Simular' }))

    expect(screen.getByText('ACEPTADA')).toBeInTheDocument()
    expect(screen.getByText('q0')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Siguiente' }))
    expect(screen.getByText('q1')).toBeInTheDocument()

    await user.clear(input)
    await user.type(input, 'aab')
    await user.click(screen.getByRole('button', { name: 'Simular' }))

    expect(screen.getByText('RECHAZADA')).toBeInTheDocument()
  })

  it('ejecuta los casos de prueba del ejemplo al presionar el botón', async () => {
    const user = userEvent.setup()
    render(<SimulationHarness />)

    await user.click(screen.getByRole('button', { name: 'Probar casos del ejemplo' }))
    expect(screen.getByRole('columnheader', { name: 'Esperado' })).toBeInTheDocument()
    expect(screen.getAllByText('✓').length).toBeGreaterThanOrEqual(8)
  })
})
