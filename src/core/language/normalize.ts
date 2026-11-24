// Significado de L: valida contra Σ (RF-04), resuelve igualdades y mínimos,
// separa sumas en bloques y desenrolla grupos con exponente numérico.
import { formatSymbolSet } from '../format'
import type {
  Alphabet,
  BlockItem,
  Count,
  InputError,
  LanguageSpec,
  PatternItem,
  Result,
  VariableInfo,
} from '../types'
import type { AstCondition, AstFactor, Expr, LanguageAst } from './ast'
import { parseSyntax } from './parseSyntax'
import { formatCount, formatNormalizedLanguage } from './pretty'

export const MAX_LANGUAGE_LENGTH = 200
export const MAX_GROUP_UNROLL = 10

const SUPPORTED = 'solo se admiten mínimos (n > 0, n ≥ 1) e igualdades (k = n, m = 2n, n = 3)'
const OP_TEXT: Record<AstCondition['op'], string> = {
  '>': '>',
  '>=': '≥',
  '=': '=',
  '<': '<',
  '<=': '≤',
  '!=': '≠',
}

export function parseLanguage(text: string, alphabet: Alphabet): Result<LanguageSpec> {
  if (text.length > MAX_LANGUAGE_LENGTH) {
    return fail(
      `El lenguaje admite máximo ${MAX_LANGUAGE_LENGTH} caracteres (tiene ${text.length}).`,
    )
  }
  const syntax = parseSyntax(text)
  if (!syntax.ok) return syntax
  return normalize(syntax.value, alphabet, text)
}

/** Valor de una variable: factor·raíz o una constante. */
type Value = { kind: 'var'; factor: number; root: string } | { kind: 'const'; value: number }

function normalize(ast: LanguageAst, alphabet: Alphabet, source: string): Result<LanguageSpec> {
  const structural = checkStructure(ast, alphabet)
  if (structural.errors.length > 0) return { ok: false, errors: structural.errors }

  const solved = solveConditions(ast.conditions)
  if (solved.errors.length > 0) return { ok: false, errors: solved.errors }

  const notes = [...solved.notes]
  const rewritten = rewritePattern(ast.factors, solved.resolve, notes)
  if (rewritten.errors.length > 0) return { ok: false, errors: rewritten.errors }
  const items = rewritten.items
  if (items.length === 0) return fail('El patrón queda vacío: escribe al menos un símbolo.')

  const roots = rootsInOrder(items)
  const variables: VariableInfo[] = roots.map((root) => ({
    name: root,
    lowerBound: solved.bounds.get(root) ?? 0,
    aliases: [...structural.patternVariables].filter((v) => {
      const value = solved.resolve(v)
      return v !== root && value.kind === 'var' && value.root === root
    }),
  }))
  for (const variable of variables) {
    const names = [variable.name, ...variable.aliases]
    if (!names.some((name) => solved.boundedVariables.has(name))) {
      notes.push(`No se indicó un mínimo para ${variable.name}: se asume ${variable.name} ≥ 0.`)
    }
  }

  const zeroErrors = checkZeroRepetitionGroups(items, solved.bounds)
  if (zeroErrors.length > 0) return { ok: false, errors: zeroErrors }
  // Las repeticiones mínimas se construyen desenrolladas, así que se limitan.
  const tooManyRepetitions = items.some(
    (item) =>
      item.kind === 'group' &&
      item.reps.kind === 'var' &&
      (solved.bounds.get(item.reps.variable) ?? 0) > MAX_GROUP_UNROLL,
  )
  if (tooManyRepetitions) {
    return fail(`El mínimo de repeticiones de un grupo puede ser hasta ${MAX_GROUP_UNROLL}.`)
  }

  return {
    ok: true,
    value: {
      source,
      normalized: formatNormalizedLanguage(items, variables),
      alphabet,
      items,
      variables,
      notes,
    },
  }
}

function checkStructure(ast: LanguageAst, alphabet: Alphabet) {
  const errors: InputError[] = []
  const patternVariables = new Set<string>()
  const reported = new Set<string>()

  const visit = (factors: readonly AstFactor[], depth: number) => {
    for (const factor of factors) {
      factor.exponent?.terms.forEach((t) => t.variable && patternVariables.add(t.variable))
      if (factor.kind === 'group') {
        if (depth > 0) {
          errors.push({
            message: 'No se admiten grupos dentro de grupos.',
            position: factor.position,
          })
        }
        visit(factor.factors, depth + 1)
      } else if (!alphabet.symbols.includes(factor.symbol) && !reported.has(factor.symbol)) {
        reported.add(factor.symbol)
        errors.push({
          message: `El símbolo «${factor.symbol}» no pertenece al alfabeto Σ = ${formatSymbolSet(alphabet.symbols)}.`,
          position: factor.position,
        })
      }
    }
  }
  visit(ast.factors, 0)

  for (const condition of ast.conditions) {
    const used = [
      ...condition.variables,
      ...condition.right.terms.flatMap((t) => (t.variable ? [t.variable] : [])),
    ]
    for (const variable of new Set(used)) {
      if (!patternVariables.has(variable)) {
        errors.push({
          message: `La variable «${variable}» aparece en las condiciones pero no en el patrón.`,
          position: condition.position,
        })
      }
    }
    const hasVariables = condition.right.terms.some((t) => t.variable !== null)
    const isBound = condition.op === '>' || condition.op === '>='
    if ((isBound && hasVariables) || (!isBound && condition.op !== '=')) {
      errors.push({
        message: `La condición «${conditionText(condition)}» no está soportada: ${SUPPORTED}.`,
        position: condition.position,
      })
    } else if (condition.op === '=' && condition.right.terms.length > 1) {
      errors.push({
        message: `La igualdad «${conditionText(condition)}» no está soportada: ${SUPPORTED}.`,
        position: condition.position,
      })
    }
  }
  return { errors, patternVariables }
}

function solveConditions(conditions: readonly AstCondition[]) {
  const errors: InputError[] = []
  const notes: string[] = []
  const parent = new Map<string, Value>()

  const resolve = (variable: string): Value => {
    let factor = 1
    let current = variable
    for (;;) {
      const next = parent.get(current)
      if (!next) return { kind: 'var', factor, root: current }
      if (next.kind === 'const') return { kind: 'const', value: factor * next.value }
      factor *= next.factor
      current = next.root
    }
  }

  // Une izquierda = derecha; devuelve false si se contradicen.
  const equate = (left: Value, right: Value): boolean => {
    if (left.kind === 'const' && right.kind === 'const') return left.value === right.value
    if (left.kind === 'const') return equate(right, left)
    if (right.kind === 'const') {
      if (right.value % left.factor !== 0) return false
      parent.set(left.root, { kind: 'const', value: right.value / left.factor })
      return true
    }
    if (left.root === right.root) return left.factor === right.factor
    if (right.factor % left.factor === 0) {
      parent.set(left.root, { kind: 'var', factor: right.factor / left.factor, root: right.root })
      return true
    }
    if (left.factor % right.factor === 0) {
      parent.set(right.root, { kind: 'var', factor: left.factor / right.factor, root: left.root })
      return true
    }
    return false
  }

  for (const condition of conditions.filter((c) => c.op === '=')) {
    const [term] = condition.right.terms
    for (const variable of condition.variables) {
      const right: Value = term.variable
        ? scale(resolve(term.variable), term.coefficient)
        : { kind: 'const', value: term.coefficient }
      if (!equate(resolve(variable), right)) {
        errors.push({
          message: `La condición «${conditionText(condition)}» contradice las anteriores.`,
          position: condition.position,
        })
        continue
      }
      const rhs = term.variable
        ? `${term.coefficient === 1 ? '' : term.coefficient}${term.variable}`
        : String(term.coefficient)
      notes.push(`${variable} = ${rhs}: se reemplaza ${variable} por ${rhs}.`)
    }
  }

  const bounds = new Map<string, number>()
  const boundedVariables = new Set<string>()
  for (const condition of conditions.filter((c) => c.op === '>' || c.op === '>=')) {
    const value = condition.right.terms.reduce((sum, t) => sum + t.coefficient, 0)
    const minimum = condition.op === '>' ? value + 1 : value
    for (const variable of condition.variables) {
      boundedVariables.add(variable)
      const resolved = resolve(variable)
      if (resolved.kind === 'const') {
        if (resolved.value < minimum) {
          errors.push({
            message: `La condición «${conditionText(condition)}» contradice ${variable} = ${resolved.value}.`,
            position: condition.position,
          })
        }
        continue
      }
      const rootMinimum = Math.ceil(minimum / resolved.factor)
      bounds.set(resolved.root, Math.max(bounds.get(resolved.root) ?? 0, rootMinimum))
    }
  }
  return { errors, notes, resolve, bounds, boundedVariables }
}

const scale = (value: Value, by: number): Value =>
  value.kind === 'const'
    ? { kind: 'const', value: value.value * by }
    : { ...value, factor: value.factor * by }

/** Exponente → partes ordenadas (2n + m + 1), juntando términos de la misma raíz. */
function exponentParts(expr: Expr | null, resolve: (v: string) => Value): Count[] {
  if (!expr) return [{ kind: 'const', value: 1 }]
  const parts: Count[] = []
  for (const term of expr.terms) {
    const value: Value = term.variable
      ? scale(resolve(term.variable), term.coefficient)
      : { kind: 'const', value: term.coefficient }
    const index = parts.findIndex((p) =>
      value.kind === 'const' ? p.kind === 'const' : p.kind === 'var' && p.variable === value.root,
    )
    const merged: Count =
      value.kind === 'const'
        ? { kind: 'const', value: value.value + (index >= 0 ? constValue(parts[index]) : 0) }
        : {
            kind: 'var',
            variable: value.root,
            factor: value.factor + (index >= 0 ? varFactor(parts[index]) : 0),
          }
    if (index >= 0) parts[index] = merged
    else parts.push(merged)
  }
  return parts.filter((p) => (p.kind === 'const' ? p.value > 0 : p.factor > 0))
}

const constValue = (count: Count) => (count.kind === 'const' ? count.value : 0)
const varFactor = (count: Count) => (count.kind === 'var' ? count.factor : 0)

function rewritePattern(
  factors: readonly AstFactor[],
  resolve: (v: string) => Value,
  notes: string[],
) {
  const errors: InputError[] = []
  const items: PatternItem[] = []

  const blocksOf = (factor: Extract<AstFactor, { kind: 'symbol' }>): BlockItem[] => {
    const parts = exponentParts(factor.exponent, resolve)
    const blocks = parts.map((count): BlockItem => ({
      kind: 'block',
      symbol: factor.symbol,
      count,
    }))
    if (blocks.length > 1) {
      const written = blocks.map((b) => `${b.symbol}${formatCount(b.count)}`).join('')
      notes.push(
        `El exponente con suma de ${factor.symbol} se separa en bloques seguidos: ${written}.`,
      )
    }
    return blocks
  }

  for (const factor of factors) {
    if (factor.kind === 'symbol') {
      items.push(...blocksOf(factor))
      continue
    }
    const body = factor.factors.flatMap((f) => (f.kind === 'symbol' ? blocksOf(f) : []))
    const reps = exponentParts(factor.exponent, resolve)
    if (reps.length === 0) continue
    if (body.length === 0) {
      errors.push({ message: 'El grupo queda vacío.', position: factor.position })
      continue
    }
    const [count] = reps
    if (reps.length === 1 && count.kind === 'const') {
      if (count.value > MAX_GROUP_UNROLL) {
        errors.push({
          message: `Un grupo con exponente numérico puede repetirse hasta ${MAX_GROUP_UNROLL} veces.`,
          position: factor.position,
        })
        continue
      }
      for (let i = 0; i < count.value; i++) items.push(...body)
      if (count.value > 1) notes.push(`El grupo con exponente ${count.value} se escribe repetido.`)
      continue
    }
    if (reps.length !== 1 || count.kind !== 'var' || count.factor !== 1) {
      errors.push({
        message:
          'El exponente de un grupo debe ser una sola variable (como k) o un número; 2n o sumas no están soportados.',
        position: factor.position,
      })
      continue
    }
    items.push({ kind: 'group', body, reps: count })
  }
  return { errors, items }
}

function rootsInOrder(items: readonly PatternItem[]): string[] {
  const roots: string[] = []
  const add = (count: Count) => {
    if (count.kind === 'var' && !roots.includes(count.variable)) roots.push(count.variable)
  }
  for (const item of items) {
    if (item.kind === 'block') add(item.count)
    else {
      item.body.forEach((b) => add(b.count))
      add(item.reps)
    }
  }
  return roots
}

// Un grupo que puede repetirse 0 veces no garantiza que defina sus variables.
function checkZeroRepetitionGroups(
  items: readonly PatternItem[],
  bounds: ReadonlyMap<string, number>,
): InputError[] {
  const errors: InputError[] = []
  const firstUse = new Map<string, number>()
  const usesByItem = items.map((item) =>
    item.kind === 'block'
      ? variablesOf([item.count])
      : variablesOf([...item.body.map((b) => b.count), item.reps]),
  )
  usesByItem.forEach((variables, index) =>
    variables.forEach((v) => firstUse.has(v) || firstUse.set(v, index)),
  )
  items.forEach((item, index) => {
    if (item.kind !== 'group' || item.reps.kind !== 'var') return
    if ((bounds.get(item.reps.variable) ?? 0) > 0) return
    const definedInside = variablesOf(item.body.map((b) => b.count)).filter(
      (v) => firstUse.get(v) === index,
    )
    for (const variable of definedInside) {
      const usedOutside = usesByItem.some((vars, i) => i !== index && vars.includes(variable))
      if (usedOutside) {
        errors.push({
          message: `La variable «${variable}» se define dentro de un grupo que puede repetirse 0 veces, así que no puede usarse fuera de él. Agrega una condición como ${item.reps.variable} ≥ 1.`,
        })
      }
    }
  })
  return errors
}

const variablesOf = (counts: readonly Count[]) => [
  ...new Set(counts.flatMap((c) => (c.kind === 'var' ? [c.variable] : []))),
]

function conditionText(condition: AstCondition): string {
  const right = condition.right.terms
    .map((t) =>
      t.variable
        ? `${t.coefficient === 1 ? '' : t.coefficient}${t.variable}`
        : String(t.coefficient),
    )
    .join(' + ')
  return `${condition.variables.join(', ')} ${OP_TEXT[condition.op]} ${right}`
}

function fail(message: string): Result<never> {
  return { ok: false, errors: [{ message }] }
}
