// Árbol de la notación de conjuntos tal como se escribió (antes de normalizar).

/** Término de un exponente: 2n → { coefficient: 2, variable: 'n' }; 3 → { 3, null }. */
export interface Term {
  readonly coefficient: number
  readonly variable: string | null
}

export interface Expr {
  readonly terms: readonly Term[]
  readonly position: number
}

export type AstFactor =
  | {
      readonly kind: 'symbol'
      readonly symbol: string
      readonly exponent: Expr | null
      readonly position: number
    }
  | {
      readonly kind: 'group'
      readonly factors: readonly AstFactor[]
      readonly exponent: Expr | null
      readonly position: number
    }

export type ComparisonOp = '>' | '>=' | '=' | '<' | '<=' | '!='

export interface AstCondition {
  readonly variables: readonly string[]
  readonly op: ComparisonOp
  readonly right: Expr
  readonly position: number
}

export interface LanguageAst {
  readonly factors: readonly AstFactor[]
  readonly conditions: readonly AstCondition[]
}
