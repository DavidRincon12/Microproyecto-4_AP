import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { Tabs } from './Tabs'
import type { TabItem } from './Tabs'

afterEach(cleanup)

const SAMPLE_TABS: TabItem[] = [
  { id: 'pasos', label: 'Pasos', content: <p>Contenido de pasos</p> },
  { id: 'tabla', label: 'Tabla', content: <p>Contenido de tabla</p> },
  { id: 'diagrama', label: 'Diagrama', content: <p>Contenido de diagrama</p> },
]

function TabsHarness() {
  const [active, setActive] = useState('pasos')
  return <Tabs tabs={SAMPLE_TABS} activeId={active} onChange={setActive} label="Vistas" />
}

describe('Tabs', () => {
  it('al hacer clic en la pestaña Tabla, se muestra su panel', async () => {
    const user = userEvent.setup()
    render(<TabsHarness />)

    expect(screen.getByText('Contenido de pasos')).toBeVisible()
    expect(screen.getByText('Contenido de tabla')).not.toBeVisible()

    await user.click(screen.getByRole('tab', { name: 'Tabla' }))

    expect(screen.getByRole('tab', { name: 'Tabla' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Contenido de tabla')).toBeVisible()
    expect(screen.getByText('Contenido de pasos')).not.toBeVisible()
  })

  it('cambia de pestaña con las flechas del teclado, Home y End', async () => {
    const user = userEvent.setup()
    render(<TabsHarness />)

    const firstTab = screen.getByRole('tab', { name: 'Pasos' })
    firstTab.focus()

    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Tabla' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Contenido de tabla')).toBeVisible()

    await user.keyboard('{End}')
    expect(screen.getByRole('tab', { name: 'Diagrama' })).toHaveAttribute('aria-selected', 'true')

    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('tab', { name: 'Tabla' })).toHaveAttribute('aria-selected', 'true')

    await user.keyboard('{Home}')
    expect(screen.getByRole('tab', { name: 'Pasos' })).toHaveAttribute('aria-selected', 'true')
  })
})
