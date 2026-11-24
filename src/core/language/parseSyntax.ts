// Lector descendente recursivo de la notación de conjuntos: L = { patrón | condiciones }.
// Solo revisa la forma del texto; el significado (símbolos de Σ, condiciones soportadas)
// lo valida normalize.ts.
import { RESERVED_CHARACTERS } from '../alphabet'
import type { Result } from '../types'
import type { AstCondition, AstFactor, ComparisonOp, Expr, LanguageAst, Term } from './ast'

// prettier-ignore
const SUPERSCRIPTS: Readonly<Record<string, string>> = {
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
  '⁺': '+', 'ⁿ': 'n', 'ᵐ': 'm', 'ᵏ': 'k', 'ⁱ': 'i', 'ʲ': 'j', 'ᵖ': 'p', 'ʳ': 'r', 'ˢ': 's',
  'ᵗ': 't', 'ᵘ': 'u', 'ᵛ': 'v', 'ʷ': 'w', 'ˣ': 'x', 'ʸ': 'y', 'ᶻ': 'z', 'ᵃ': 'a', 'ᵇ': 'b',
  'ᶜ': 'c', 'ᵈ': 'd', 'ᵉ': 'e', 'ᶠ': 'f', 'ᵍ': 'g', 'ʰ': 'h', 'ˡ': 'l', 'ᵒ': 'o',
}

// prettier-ignore
const OPERATORS: readonly [string, ComparisonOp][] = [
  ['>=', '>='], ['≥', '>='], ['<=', '<='], ['≤', '<='], ['!=', '!='], ['≠', '!='],
  ['>', '>'], ['<', '<'], ['=', '='],
]

class LanguageSyntaxError extends Error {
  readonly position: number

  constructor(message: string, position: number) {
    super(message)
    this.position = position
  }
}

export function parseSyntax(text: string): Result<LanguageAst> {
  try {
    return { ok: true, value: new Parser(text).parseLanguage() }
  } catch (error) {
    if (error instanceof LanguageSyntaxError) {
      return { ok: false, errors: [{ message: error.message, position: error.position }] }
    }
    throw error
  }
}

const isDigit = (ch: string | undefined) => ch !== undefined && ch >= '0' && ch <= '9'
const isVariable = (ch: string | undefined) => ch !== undefined && ch >= 'a' && ch <= 'z'
const isSuperscript = (ch: string | undefined) => ch !== undefined && ch in SUPERSCRIPTS

class Parser {
  private pos = 0
  private readonly text: string
  // Para los superíndices: los errores se reportan en la posición del superíndice original.
  private readonly reportAt: number | null

  constructor(text: string, reportAt: number | null = null) {
    this.text = text
    this.reportAt = reportAt
  }

  parseLanguage(): LanguageAst {
    this.skipSpaces()
    if (this.atEnd()) throw this.error('Escribe el lenguaje, por ejemplo {a^n b^n | n ≥ 0}.', 0)
    const prefix = /^L\s*=\s*/.exec(this.text.slice(this.pos))
    if (prefix) this.pos += prefix[0].length

    let braceAt: number | null = null
    if (this.peek() === '{') {
      braceAt = this.pos
      this.pos++
    }
    const factors = this.parsePattern()
    if (factors.length === 0)
      throw this.error('Falta el patrón del lenguaje antes de «|».', this.pos)

    this.skipSpaces()
    let conditions: AstCondition[] = []
    if (this.peek() === '|' || this.peek() === ':') {
      this.pos++
      conditions = this.parseConditions()
    }
    this.skipSpaces()
    if (braceAt !== null) {
      if (this.peek() !== '}') throw this.error('Falta cerrar la llave «}».', braceAt)
      this.pos++
      this.skipSpaces()
    }
    if (!this.atEnd()) throw this.error(`Carácter inesperado «${this.peek()}».`, this.pos)
    return { factors, conditions }
  }

  private parsePattern(): AstFactor[] {
    const factors: AstFactor[] = []
    for (;;) {
      this.skipSpaces()
      const ch = this.peek()
      if (ch === undefined || ch === '|' || ch === ':' || ch === '}' || ch === ')') return factors
      factors.push(this.parseFactor())
    }
  }

  private parseFactor(): AstFactor {
    const position = this.pos
    const ch = this.peek()!
    if (ch === '(') {
      this.pos++
      const factors = this.parsePattern()
      if (this.peek() !== ')')
        throw this.error('Falta cerrar el paréntesis que se abre aquí.', position)
      if (factors.length === 0) throw this.error('El grupo entre paréntesis está vacío.', position)
      this.pos++
      return { kind: 'group', factors, exponent: this.parseExponent(), position }
    }
    if (ch === '^') throw this.error('Falta el símbolo antes de «^».', position)
    if (RESERVED_CHARACTERS.has(ch)) throw this.error(`Carácter inesperado «${ch}».`, position)
    const symbol = this.next()
    return { kind: 'symbol', symbol, exponent: this.parseExponent(), position }
  }

  private parseExponent(): Expr | null {
    const save = this.pos
    this.skipSpaces()
    if (this.peek() === '^') {
      const caret = this.pos
      this.pos++
      this.skipSpaces()
      if (this.peek() === '(') {
        const open = this.pos
        this.pos++
        this.skipSpaces()
        const expr = this.parseSum(caret)
        this.skipSpaces()
        if (this.peek() !== ')') throw this.error('Falta cerrar el paréntesis del exponente.', open)
        this.pos++
        return expr
      }
      if (!isDigit(this.peek()) && !isVariable(this.peek())) {
        throw this.error('Falta el exponente después de «^».', caret)
      }
      return this.parseSum(caret)
    }
    if (isSuperscript(this.peek())) {
      const start = this.pos
      let plain = ''
      while (isSuperscript(this.peek())) plain += SUPERSCRIPTS[this.next()]
      const inner = new Parser(plain, start)
      const expr = inner.parseSum(start)
      if (!inner.atEnd()) throw this.error('El exponente en superíndice no es válido.', start)
      return expr
    }
    this.pos = save
    return null
  }

  private parseSum(position: number): Expr {
    const terms: Term[] = [this.parseTerm()]
    for (;;) {
      const save = this.pos
      this.skipSpaces()
      if (this.peek() !== '+') {
        this.pos = save
        return { terms, position }
      }
      this.pos++
      this.skipSpaces()
      terms.push(this.parseTerm())
    }
  }

  private parseTerm(): Term {
    const start = this.pos
    if (isDigit(this.peek())) {
      let digits = ''
      while (isDigit(this.peek())) digits += this.next()
      const coefficient = Number(digits)
      const save = this.pos
      this.skipSpaces()
      if (this.peek() === '*') {
        this.pos++
        this.skipSpaces()
        if (!isVariable(this.peek()))
          throw this.error('Falta la variable después de «*».', this.pos)
        return { coefficient, variable: this.next() }
      }
      this.pos = save
      // "2n" sin espacios es 2·n; "2 n" deja la n como siguiente símbolo del patrón.
      if (isVariable(this.peek())) return { coefficient, variable: this.next() }
      return { coefficient, variable: null }
    }
    if (isVariable(this.peek())) return { coefficient: 1, variable: this.next() }
    throw this.error('Se esperaba un número o una variable.', start)
  }

  private parseConditions(): AstCondition[] {
    const conditions: AstCondition[] = []
    for (;;) {
      this.skipSpaces()
      if (this.atEnd() || this.peek() === '}') return conditions
      conditions.push(this.parseCondition())
      this.skipSpaces()
      if (this.peek() !== ',' && this.peek() !== ';') return conditions
      this.pos++
    }
  }

  private parseCondition(): AstCondition {
    const position = this.pos
    if (!isVariable(this.peek())) {
      throw this.error('Se esperaba una variable al inicio de la condición.', position)
    }
    const variables = [this.next()]
    // "n, m ≥ 1": una variable sola seguida de coma se une a la condición siguiente.
    for (;;) {
      const save = this.pos
      this.skipSpaces()
      if (this.peek() !== ',') {
        this.pos = save
        break
      }
      this.pos++
      this.skipSpaces()
      if (!isVariable(this.peek())) {
        this.pos = save
        break
      }
      const variable = this.next()
      const afterVariable = this.pos
      this.skipSpaces()
      if (this.peek() !== ',' && this.peekOperator() === null) {
        this.pos = save
        break
      }
      this.pos = afterVariable
      variables.push(variable)
    }

    this.skipSpaces()
    const operatorAt = this.pos
    const operator = this.peekOperator()
    if (operator === null) {
      throw this.error(
        `Falta el operador en la condición de «${variables.join(', ')}» (usa >, ≥ o =).`,
        operatorAt,
      )
    }
    this.pos += operator[0].length
    this.skipSpaces()
    if (!isDigit(this.peek()) && !isVariable(this.peek())) {
      throw this.error(`Falta el valor de la condición después de «${operator[0]}».`, operatorAt)
    }
    return { variables, op: operator[1], right: this.parseSum(this.pos), position }
  }

  private peekOperator(): readonly [string, ComparisonOp] | null {
    return OPERATORS.find(([text]) => this.text.startsWith(text, this.pos)) ?? null
  }

  private peek(): string | undefined {
    const code = this.text.codePointAt(this.pos)
    return code === undefined ? undefined : String.fromCodePoint(code)
  }

  private next(): string {
    const ch = this.peek()!
    this.pos += ch.length
    return ch
  }

  private skipSpaces() {
    while (this.peek() !== undefined && /\s/.test(this.peek()!)) this.pos++
  }

  atEnd(): boolean {
    return this.pos >= this.text.length
  }

  private error(message: string, position: number) {
    return new LanguageSyntaxError(message, this.reportAt ?? position)
  }
}
