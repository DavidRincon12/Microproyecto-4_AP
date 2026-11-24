// Análisis de usos (sección 7.1 del diseño): qué bloque define cada variable, cuáles la
// verifican y qué pilas hacen falta (principales, de repeticiones y auxiliares, sección 7.2).
import { formatCount, formatPattern } from '../language/pretty'
import type { BlockItem, GroupItem, LanguageSpec, StackDef, StackName } from '../types'

export type BlockRole =
  | { readonly kind: 'const' }
  | { readonly kind: 'free' }
  | { readonly kind: 'define'; readonly targets: readonly StackName[] }
  | { readonly kind: 'verifyPop'; readonly stack: StackName }
  | { readonly kind: 'verifyTransfer'; readonly stack: StackName; readonly aux: StackName }

/**
 * a: la variable se definió antes del grupo; b: se define en su primera repetición;
 * c: el propio grupo la define; d: solo es el exponente de este grupo.
 */
export type GroupMode = 'a' | 'b' | 'c' | 'd'

export interface GroupInfo {
  readonly mode: GroupMode
  readonly variable: string
  readonly repsStack: StackName | null
  readonly pushTargets: readonly StackName[]
  readonly hasDefinitions: boolean
}

export type Copy = 'def' | 'verif'

export interface Analysis {
  readonly stacks: readonly StackDef[]
  roleOf(item: number, body: number | null, copy: Copy): BlockRole
  groupOf(item: number): GroupInfo
  /** Pilas principales que terminan con símbolos sobrantes y se vacían antes de aceptar. */
  readonly cleanup: readonly StackName[]
  readonly variableLines: readonly string[]
}

const LETTERS = ['X', 'Y', 'Z', 'W', 'V', 'U', 'T', 'S', 'R', 'P', 'O', 'N', 'M', 'L', 'K']

type Use =
  | { readonly kind: 'block'; readonly item: number; readonly body: number | null }
  | { readonly kind: 'reps'; readonly item: number }

export function analyze(spec: LanguageSpec): Analysis {
  const items = spec.items
  const uses = collectUses(spec)
  const usesOf = (v: string) => uses.get(v)!
  const isFirst = (v: string, use: Use) => usesOf(v)[0] === use
  const blockUse = (v: string, item: number, body: number | null) =>
    usesOf(v).find((u) => u.kind === 'block' && u.item === item && u.body === body)!
  const blockAt = (item: number, body: number | null): BlockItem =>
    body === null ? (items[item] as BlockItem) : (items[item] as GroupItem).body[body]

  const letters = [...LETTERS]
  const mainOf = new Map<string, StackName>()
  const repsOf = new Map<number, StackName>()
  const auxOf = new Map<string, StackName>()

  for (const [v, list] of uses) {
    const blocks = list.filter((u) => u.kind === 'block')
    const first = list[0]
    const hasBlockVerifications =
      blocks.length > 1 ||
      (first.kind === 'block' && first.body !== null) ||
      (first.kind === 'reps' && blocks.length > 0)
    if (hasBlockVerifications) mainOf.set(v, letters.shift()!)
  }
  items.forEach((item, index) => {
    if (item.kind !== 'group' || item.reps.kind !== 'var') return
    const v = item.reps.variable
    const repsUse = usesOf(v).find((u) => u.kind === 'reps' && u.item === index)!
    if (!isFirst(v, repsUse)) repsOf.set(index, letters.shift()!)
  })
  for (const [v, main] of mainOf) {
    const list = usesOf(v)
    const needsAux = list.some(
      (u, i) =>
        u.kind === 'block' &&
        (u.body !== null || (i > 0 && list.slice(i + 1).some((later) => later.kind === 'block'))),
    )
    if (needsAux) auxOf.set(v, `${main}ₐ`)
  }

  const defTargets = (v: string): StackName[] => {
    const targets = mainOf.has(v) ? [mainOf.get(v)!] : []
    items.forEach((item, index) => {
      if (item.kind === 'group' && item.reps.kind === 'var' && item.reps.variable === v) {
        const stack = repsOf.get(index)
        if (stack) targets.push(stack)
      }
    })
    return targets
  }

  const roleOf = (item: number, body: number | null, copy: Copy): BlockRole => {
    const block = blockAt(item, body)
    if (block.count.kind === 'const') return { kind: 'const' }
    const v = block.count.variable
    const list = usesOf(v)
    const use = blockUse(v, item, body)
    if (list.length === 1 && body === null) return { kind: 'free' }
    if (isFirst(v, use) && (body === null || copy === 'def')) {
      return { kind: 'define', targets: defTargets(v) }
    }
    const stack = mainOf.get(v)!
    const laterBlock = list.slice(list.indexOf(use) + 1).some((u) => u.kind === 'block')
    if (body !== null || laterBlock) return { kind: 'verifyTransfer', stack, aux: auxOf.get(v)! }
    return { kind: 'verifyPop', stack }
  }

  const groupOf = (item: number): GroupInfo => {
    const group = items[item] as GroupItem
    if (group.reps.kind !== 'var') throw new Error(`El grupo ${item} no tiene exponente variable.`)
    const v = group.reps.variable
    const list = usesOf(v)
    const repsUse = list.find((u) => u.kind === 'reps' && u.item === item)!
    let mode: GroupMode = 'a'
    if (isFirst(v, repsUse)) mode = list.length > 1 ? 'c' : 'd'
    else if (list[0].kind === 'block' && list[0].item === item) mode = 'b'
    const hasDefinitions = group.body.some(
      (b, j) =>
        b.count.kind === 'var' && isFirst(b.count.variable, blockUse(b.count.variable, item, j)),
    )
    return {
      mode,
      variable: v,
      repsStack: repsOf.get(item) ?? null,
      pushTargets: mode === 'c' ? defTargets(v) : [],
      hasDefinitions,
    }
  }

  const cleanup = [...mainOf]
    .filter(([v]) => {
      const blocks = usesOf(v).filter((u) => u.kind === 'block')
      return blocks.length > 0 && blocks[blocks.length - 1].body !== null
    })
    .map(([, stack]) => stack)

  const groupText = (item: number) => formatPattern([items[item]])
  const blockText = (use: Use) => {
    if (use.kind === 'reps') return groupText(use.item)
    const block = blockAt(use.item, use.body)
    return `${block.symbol}${formatCount(block.count)}`
  }
  const stacks: StackDef[] = [
    ...[...mainOf].map(([v, name]) => stackDef(name, `Cuenta ${v}.`)),
    ...[...repsOf].map(([item, name]) =>
      stackDef(name, `Cuenta las repeticiones que faltan de ${groupText(item)}.`),
    ),
    ...[...auxOf].map(([v, name]) =>
      stackDef(
        name,
        `Auxiliar de ${mainOf.get(v)}: guarda el conteo de ${v} mientras se verifica.`,
      ),
    ),
  ]
  if (stacks.length === 0) {
    stacks.push(stackDef('X', 'El lenguaje no necesita contar: la pila solo guarda su fondo.'))
  }

  const variableLines = spec.variables.map((variable) => {
    const v = variable.name
    const list = usesOf(v)
    const first = list[0]
    if (list.length === 1 && first.kind === 'block' && first.body === null) {
      return `${v}: solo aparece en ${blockText(first)}, así que no necesita pila; se exige ${v} ≥ ${variable.lowerBound}.`
    }
    if (list.length === 1 && first.kind === 'reps') {
      return `${v}: solo indica cuántas veces se repite ${groupText(first.item)}, así que no necesita pila.`
    }
    const parts = [
      first.kind === 'block'
        ? `se define contando ${blockText(first)}${first.body !== null ? ' en la primera repetición' : ''}`
        : `se define contando las repeticiones de ${groupText(first.item)}`,
    ]
    if (first.kind === 'block' && first.body !== null) {
      parts.push(`se verifica otra vez en cada repetición siguiente`)
    }
    for (const use of list.slice(1)) {
      parts.push(
        use.kind === 'block'
          ? `se verifica en ${blockText(use)}`
          : `controla las repeticiones de ${groupText(use.item)}`,
      )
    }
    const own = [
      mainOf.has(v) ? `${mainOf.get(v)} (conteo)` : null,
      ...[...repsOf]
        .filter(([item]) => groupVar(item) === v)
        .map(([, name]) => `${name} (repeticiones)`),
      auxOf.has(v) ? `${auxOf.get(v)} (auxiliar)` : null,
    ].filter((s): s is string => s !== null)
    return `${v}: ${parts.join('; ')}. Pilas: ${own.join(', ')}.`
  })

  function groupVar(item: number) {
    const reps = (items[item] as GroupItem).reps
    return reps.kind === 'var' ? reps.variable : null
  }

  return { stacks, roleOf, groupOf, cleanup, variableLines }
}

function collectUses(spec: LanguageSpec): Map<string, Use[]> {
  const uses = new Map<string, Use[]>()
  const add = (variable: string, use: Use) =>
    uses.set(variable, [...(uses.get(variable) ?? []), use])
  spec.items.forEach((item, index) => {
    if (item.kind === 'block') {
      if (item.count.kind === 'var')
        add(item.count.variable, { kind: 'block', item: index, body: null })
      return
    }
    item.body.forEach((block, body) => {
      if (block.count.kind === 'var')
        add(block.count.variable, { kind: 'block', item: index, body })
    })
    if (item.reps.kind === 'var') add(item.reps.variable, { kind: 'reps', item: index })
  })
  return uses
}

const stackDef = (name: StackName, purpose: string): StackDef => ({
  name,
  token: name,
  bottom: `${name}₀`,
  purpose,
})
