import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import type { Example } from '../../core'
import { buildFromTexts } from './buildFromTexts'
import type { BuildState } from './buildFromTexts'
import { InputPanel } from './InputPanel'

afterEach(cleanup)

function InputHarness() {
  const [alphabetText, setAlphabetText] = useState('')
  const [languageText, setLanguageText] = useState('')
  const [selectedExampleId, setSelectedExampleId] = useState('')
  const [buildState, setBuildState] = useState<BuildState>({ status: 'idle' })
  const [lastBuilt, setLastBuilt] = useState<{ alphabet: string; language: string } | null>(null)

  const isStale =
    buildState.status === 'ok' &&
    lastBuilt !== null &&
    (alphabetText !== lastBuilt.alphabet || languageText !== lastBuilt.language)

  const handleSelectExample = (example: Example | null) => {
    if (!example) {
      setSelectedExampleId('')
      return
    }
    setSelectedExampleId(example.id)
    setAlphabetText(example.alphabet)
    setLanguageText(example.language)
  }

  const handleBuild = () => {
    const next = buildFromTexts(alphabetText, languageText)
    setBuildState(next)
    if (next.status === 'ok') {
      setLastBuilt({ alphabet: alphabetText, language: languageText })
    }
  }

  return (
    <InputPanel
      alphabetText={alphabetText}
      languageText={languageText}
      selectedExampleId={selectedExampleId}
      buildState={buildState}
      isStale={isStale}
      onAlphabetChange={(v) => {
        setAlphabetText(v)
        setSelectedExampleId('')
      }}
      onLanguageChange={(v) => {
        setLanguageText(v)
        setSelectedExampleId('')
      }}
      onSelectExample={handleSelectExample}
      onBuild={handleBuild}
    />
  )
}

describe('InputPanel', () => {
  it('muestra el mensaje de error al escribir un L inválido y presionar Construir', async () => {
    const user = userEvent.setup()
    render(<InputHarness />)

    await user.type(screen.getByLabelText('Alfabeto Σ'), 'a, b')
    await user.type(screen.getByLabelText('Lenguaje L'), 'a^n c^n')
    await user.click(screen.getByRole('button', { name: 'Construir' }))

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('c')
  })

  it('llena los campos desde un ejemplo y muestra el lenguaje normalizado al construir', async () => {
    const user = userEvent.setup()
    render(<InputHarness />)

    await user.selectOptions(screen.getByLabelText('Ejemplos'), 'tablero')
    expect(screen.getByLabelText('Alfabeto Σ')).toHaveValue('0, 1')
    expect(screen.getByLabelText('Lenguaje L')).toHaveValue('{(0^n 1^m)^k | n > 0, m > 1, k = n}')

    await user.click(screen.getByRole('button', { name: 'Construir' }))
    expect(screen.getByText('L = {(0ⁿ1ᵐ)ⁿ | n ≥ 1, m ≥ 2}')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Alfabeto Σ'), ', 2')
    expect(screen.getByRole('status')).toHaveTextContent(
      'desactualizada'.replace('desactualizada', 'actualizar'),
    )
  })
})
