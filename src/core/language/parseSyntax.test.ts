import { describe, expect, it } from 'vitest'
import type { AstFactor, Expr, LanguageAst } from './ast'
import { parseSyntax } from './parseSyntax'

const astOf = (text: string): LanguageAst => {
  const result = parseSyntax(text)
  if (!result.ok) throw new Error(result.errors.map((e) => e.message).join('; '))
  return result.value
}

const errorOf = (text: string) => {
  const result = parseSyntax(text)
  if (result.ok) throw new Error('se esperaba un error')
  return result.errors[0]
}

// Quita posiciones para comparar solo la estructura.
const exprShape = (e: Expr | null) => (e ? e.terms.map((t) => [t.coefficient, t.variable]) : null)
const factorShape = (f: AstFactor): unknown =>
  f.kind === 'symbol'
    ? [f.symbol, exprShape(f.exponent)]
    : [f.factors.map(factorShape), exprShape(f.exponent)]
const shape = (ast: LanguageAst) => ({
  factors: ast.factors.map(factorShape),
  conditions: ast.conditions.map((c) => [c.variables, c.op, exprShape(c.right)]),
})

describe('parseSyntax', () => {
  it('lee el ejercicio del tablero', () => {
    expect(shape(astOf('{(0^n 1^m)^k | n > 0, m > 1, k = n}'))).toEqual({
      factors: [
        [
          [
            ['0', [[1, 'n']]],
            ['1', [[1, 'm']]],
          ],
          [[1, 'k']],
        ],
      ],
      conditions: [
        [['n'], '>', [[0, null]]],
        [['m'], '>', [[1, null]]],
        [['k'], '=', [[1, 'n']]],
      ],
    })
  })

  it('entiende superíndices y los dos puntos como separador', () => {
    expect(shape(astOf('(0ⁿ1ᵐ)ᵏ : n>0, m>1, k=n'))).toEqual(
      shape(astOf('{(0^n 1^m)^k | n > 0, m > 1, k = n}')),
    )
  })

  it('lee múltiplos y sumas en el exponente', () => {
    expect(exprShape(astOf('a^2n b^n').factors[0].exponent)).toEqual([[2, 'n']])
    expect(exprShape(astOf('a^(2*n)').factors[0].exponent)).toEqual([[2, 'n']])
    expect(exprShape(astOf('c^(n+m)').factors[0].exponent)).toEqual([
      [1, 'n'],
      [1, 'm'],
    ])
    expect(exprShape(astOf('b²ⁿ').factors[0].exponent)).toEqual([[2, 'n']])
  })

  it('deja sin exponente un símbolo suelto', () => {
    expect(shape(astOf('a b^n')).factors).toEqual([
      ['a', null],
      ['b', [[1, 'n']]],
    ])
  })

  it('acepta el prefijo L = y el operador >=', () => {
    expect(shape(astOf('L = a^n b^n | n >= 0')).conditions).toEqual([[['n'], '>=', [[0, null]]]])
  })

  it('trata como símbolos las letras en posición de base', () => {
    expect(shape(astOf('n^k m^k | k >= 1')).factors).toEqual([
      ['n', [[1, 'k']]],
      ['m', [[1, 'k']]],
    ])
  })

  it('une una lista de variables a la condición siguiente', () => {
    expect(shape(astOf('a^n b^m | n, m ≥ 1')).conditions).toEqual([[['n', 'm'], '>=', [[1, null]]]])
  })

  it('señala la llave sin cerrar', () => {
    const error = errorOf('{a^n b^n')
    expect(error.message).toContain('llave')
    expect(error.position).toBe(0)
  })

  it('señala el paréntesis sin cerrar', () => {
    const error = errorOf('(a^n')
    expect(error.message).toContain('paréntesis')
    expect(error.position).toBe(0)
  })

  it('señala el exponente que falta', () => {
    const error = errorOf('a^')
    expect(error.message).toContain('exponente')
    expect(error.position).toBe(1)
  })

  it('señala el valor que falta en una condición', () => {
    expect(errorOf('a^n | n >').message).toContain('valor')
  })

  it('pide escribir algo cuando el texto está vacío', () => {
    expect(errorOf('   ').message).toContain('Escribe')
  })
})
