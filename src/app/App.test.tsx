import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from './App'

afterEach(cleanup)

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('muestra el título de la aplicación y el estado inicial de las pestañas', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Autómatas con pilas' })).toBeInTheDocument()
    expect(screen.getByText(/Construye un autómata para ver los pasos/)).toBeVisible()
  })

  it('permite construir un ejemplo, recorrer las pestañas, simular y recuperar desde historial', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.selectOptions(screen.getByLabelText('Ejemplos'), 'tablero')
    await user.click(screen.getByRole('button', { name: 'Construir' }))

    expect(screen.getByText('L = {(0ⁿ1ᵐ)ⁿ | n ≥ 1, m ≥ 2}')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Alfabeto/ })).toBeVisible()

    await user.click(screen.getByRole('tab', { name: 'Definición formal' }))
    expect(screen.getByRole('heading', { name: /M = \(Q, Σ, Γ, δ, q₀/ })).toBeVisible()

    await user.click(screen.getByRole('tab', { name: 'Tabla' }))
    expect(screen.getByRole('rowheader', { name: '* q14' })).toBeVisible()

    await user.click(screen.getByRole('tab', { name: 'Simulación' }))
    await user.type(screen.getByLabelText('Cadena'), '00110011')
    await user.click(screen.getByRole('button', { name: 'Simular' }))
    expect(screen.getByText('ACEPTADA')).toBeVisible()

    await user.click(screen.getByRole('tab', { name: 'Historial' }))
    expect(screen.getByText('1 cadena simulada')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Simular otra vez' }))
    expect(screen.getByRole('tab', { name: 'Simulación' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('ACEPTADA')).toBeVisible()
  })
})
