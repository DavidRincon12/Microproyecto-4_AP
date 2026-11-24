import { describe, expect, it } from 'vitest'
import { parseAlphabet } from './alphabet'

const symbolsOf = (text: string) => {
  const result = parseAlphabet(text)
  if (!result.ok) throw new Error(result.errors.map((e) => e.message).join('; '))
  return result.value.symbols
}

const errorsOf = (text: string) => {
  const result = parseAlphabet(text)
  if (result.ok) throw new Error('se esperaba un error')
  return result.errors
}

describe('parseAlphabet', () => {
  it('acepta símbolos separados por comas', () => {
    expect(symbolsOf('0, 1')).toEqual(['0', '1'])
  })

  it('acepta llaves, el prefijo Σ = y espacios como separador', () => {
    expect(symbolsOf('{a, b}')).toEqual(['a', 'b'])
    expect(symbolsOf('Σ = {a, b}')).toEqual(['a', 'b'])
    expect(symbolsOf('a b')).toEqual(['a', 'b'])
  })

  it('rechaza el alfabeto vacío', () => {
    expect(errorsOf('')[0].message).toBe('El alfabeto no puede estar vacío.')
    expect(errorsOf('{ }')[0].message).toBe('El alfabeto no puede estar vacío.')
  })

  it('rechaza símbolos repetidos', () => {
    const [error] = errorsOf('a, a')
    expect(error.message).toContain('«a»')
    expect(error.message).toContain('repetido')
    expect(error.position).toBe(3)
  })

  it('rechaza símbolos de más de un carácter', () => {
    const [error] = errorsOf('ab')
    expect(error.message).toContain('un solo carácter')
    expect(error.position).toBe(0)
  })

  it('rechaza caracteres reservados', () => {
    expect(errorsOf('a, (')[0].message).toContain('reservado')
    expect(errorsOf('ε')[0].message).toContain('reservado')
    expect(errorsOf('a, ⁿ')[0].message).toContain('reservado')
  })

  it('rechaza más de 10 símbolos', () => {
    expect(errorsOf('a b c d e f g h i j k')[0].message).toContain('10')
  })

  it('rechaza llaves sin cerrar', () => {
    expect(errorsOf('{a, b')[0].message).toContain('llave')
  })
})
