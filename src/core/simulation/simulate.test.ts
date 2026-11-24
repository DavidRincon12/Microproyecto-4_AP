import { describe, expect, it } from 'vitest'
import { anbnAutomaton } from '../testing/fixtures'
import { simulate } from './simulate'

describe('simulate', () => {
  it('acepta aabb y devuelve el camino completo', () => {
    const result = simulate(anbnAutomaton, 'aabb')
    expect(result.accepted).toBe(true)
    expect(result.trace).toHaveLength(8)
    expect(result.trace.at(-1)!.configuration).toEqual({
      state: 'q3',
      position: 4,
      stacks: { X: ['X₀'] },
    })
    expect(result.reason).toContain('q3')
  })

  it('empieza con las pilas vacías y la inicialización pone los fondos', () => {
    const { trace } = simulate(anbnAutomaton, 'ab')
    expect(trace[0]).toEqual({
      configuration: { state: 'q0', position: 0, stacks: { X: [] } },
      transition: null,
    })
    expect(trace[1].configuration.stacks.X).toEqual(['X₀'])
    expect(trace[1].transition?.id).toBe('t0')
  })

  it('acepta la cadena vacía escrita como vacío, ε o λ', () => {
    for (const input of ['', 'ε', 'λ']) {
      expect(simulate(anbnAutomaton, input).accepted).toBe(true)
    }
  })

  it('explica el rechazo cuando se consume todo sin llegar a aceptación', () => {
    const result = simulate(anbnAutomaton, 'aab')
    expect(result.accepted).toBe(false)
    expect(result.reason).toContain('ningún camino')
  })

  it('explica el rechazo cuando un símbolo no se puede leer', () => {
    const result = simulate(anbnAutomaton, 'abb')
    expect(result.accepted).toBe(false)
    expect(result.reason).toContain('No se pudo leer «b» (posición 3)')
    expect(result.trace.at(-1)!.configuration.position).toBe(2)
  })

  it('rechaza símbolos que no están en Σ', () => {
    const result = simulate(anbnAutomaton, 'abc')
    expect(result.accepted).toBe(false)
    expect(result.reason).toContain('«c» (posición 3) no pertenece a Σ')
  })

  it('rechaza cadenas de más de 100 símbolos', () => {
    expect(simulate(anbnAutomaton, 'a'.repeat(101)).reason).toContain('100')
  })

  it('avisa cuando alcanza el límite de configuraciones', () => {
    const result = simulate(anbnAutomaton, 'aabb', { maxConfigurations: 3 })
    expect(result.accepted).toBe(false)
    expect(result.limitReached).toBe(true)
    expect(result.reason).toContain('límite')
  })
})
