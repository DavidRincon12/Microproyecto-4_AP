import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { HistoryPanel } from './HistoryPanel'
import type { HistoryEntry } from './historyStorage'

afterEach(cleanup)

const SAMPLE_ENTRIES: HistoryEntry[] = [
  {
    id: 'e1',
    savedAt: '2026-11-24T15:30:00.000Z',
    alphabetText: 'a, b',
    languageText: '{a^n b^n | n >= 0}',
    simulations: [
      { input: 'aabb', accepted: true },
      { input: 'aab', accepted: false },
    ],
  },
]

describe('HistoryPanel', () => {
  it('muestra estado vacío cuando no hay entradas', () => {
    render(
      <HistoryPanel
        entries={[]}
        onOpenEntry={vi.fn()}
        onSimulateAgain={vi.fn()}
        onClearHistory={vi.fn()}
      />,
    )

    expect(screen.getByText(/Aún no hay construcciones guardadas/)).toBeInTheDocument()
  })

  it('permite abrir, volver a simular una cadena y borrar el historial', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    const onSimAgain = vi.fn()
    const onClear = vi.fn()

    render(
      <HistoryPanel
        entries={SAMPLE_ENTRIES}
        onOpenEntry={onOpen}
        onSimulateAgain={onSimAgain}
        onClearHistory={onClear}
      />,
    )

    expect(screen.getByText('{a^n b^n | n >= 0}')).toBeInTheDocument()
    expect(screen.getByText('2 cadenas simuladas')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Abrir' }))
    expect(onOpen).toHaveBeenCalledWith(SAMPLE_ENTRIES[0])

    const simButtons = screen.getAllByRole('button', { name: 'Simular otra vez' })
    await user.click(simButtons[0])
    expect(onSimAgain).toHaveBeenCalledWith(SAMPLE_ENTRIES[0], 'aabb')

    await user.click(screen.getByRole('button', { name: 'Borrar historial' }))
    expect(onClear).toHaveBeenCalledOnce()
  })
})
