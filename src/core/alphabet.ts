import type { Alphabet, InputError, Result } from './types'

export const MAX_ALPHABET_SIZE = 10

// Caracteres que la notación de L usa con otro significado: no pueden ser símbolos.
const SUPERSCRIPTS_AND_SUBSCRIPTS = '⁰¹²³⁴⁵⁶⁷⁸⁹⁺ⁿᵐᵏⁱʲᵖʳˢᵗᵘᵛʷˣʸᶻᵃᵇᶜᵈᵉᶠᵍʰˡᵒ₀₁₂₃₄₅₆₇₈₉ₐₑₒₓ'
export const RESERVED_CHARACTERS: ReadonlySet<string> = new Set([
  ...'(){}^|:,;=<>!+*ελΣ≥≤≠',
  ...SUPERSCRIPTS_AND_SUBSCRIPTS,
])

const isSeparator = (ch: string) => ch === ',' || /\s/.test(ch)

export function parseAlphabet(text: string): Result<Alphabet> {
  let start = 0
  let end = text.length
  const prefix = /^\s*Σ\s*=\s*/.exec(text)
  if (prefix) start = prefix[0].length
  const open = text.indexOf('{', start)
  if (open !== -1 && text.slice(start, open).trim() === '') {
    const close = text.lastIndexOf('}')
    if (close < open) return fail('Falta cerrar la llave del alfabeto.', open)
    const extra = text.slice(close + 1).search(/\S/)
    if (extra !== -1) return fail('Sobra texto después de la llave de cierre.', close + 1 + extra)
    start = open + 1
    end = close
  }

  const tokens: { text: string; position: number }[] = []
  let index = start
  while (index < end) {
    const ch = String.fromCodePoint(text.codePointAt(index)!)
    if (isSeparator(ch)) {
      index += ch.length
      continue
    }
    const position = index
    let token = ''
    while (index < end) {
      const c = String.fromCodePoint(text.codePointAt(index)!)
      if (isSeparator(c)) break
      token += c
      index += c.length
    }
    tokens.push({ text: token, position })
  }

  if (tokens.length === 0) return fail('El alfabeto no puede estar vacío.')

  const errors: InputError[] = []
  const seen = new Set<string>()
  for (const { text: symbol, position } of tokens) {
    if ([...symbol].length !== 1) {
      errors.push({
        message: `«${symbol}» no es válido: cada símbolo debe ser un solo carácter.`,
        position,
      })
    } else if (RESERVED_CHARACTERS.has(symbol)) {
      errors.push({
        message: `«${symbol}» es un carácter reservado de la notación y no puede ser símbolo.`,
        position,
      })
    } else if (seen.has(symbol)) {
      errors.push({ message: `El símbolo «${symbol}» está repetido.`, position })
    }
    seen.add(symbol)
  }
  if (errors.length > 0) return { ok: false, errors }
  if (tokens.length > MAX_ALPHABET_SIZE) {
    return fail(`El alfabeto admite máximo ${MAX_ALPHABET_SIZE} símbolos (tiene ${tokens.length}).`)
  }
  return { ok: true, value: { symbols: tokens.map((t) => t.text) } }
}

function fail(message: string, position?: number): Result<never> {
  return { ok: false, errors: [position === undefined ? { message } : { message, position }] }
}
