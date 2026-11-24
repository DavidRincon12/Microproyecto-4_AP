// Piezas de la construcción (sección 7.3 del diseño). Cada pieza recibe su estado de
// entrada, que todavía no tiene transiciones de salida, y devuelve su estado de salida.
import { formatCount, formatPattern } from '../language/pretty'
import type { BlockItem, GroupItem, LanguageSpec, StackName, StackOp, StateId } from '../types'
import type { Analysis, Copy } from './analyze'
import type { AutomatonBuilder } from './builder'

export interface PieceContext {
  readonly b: AutomatonBuilder
  readonly spec: LanguageSpec
  readonly analysis: Analysis
}

type Variant = 'bottom' | 'token'

const bottomOf = (stack: StackName) => `${stack}₀`
const pushOp = (stack: StackName, variant: Variant): StackOp =>
  variant === 'bottom'
    ? { stack, top: bottomOf(stack), push: [bottomOf(stack), stack] }
    : { stack, top: stack, push: [stack, stack] }
const popOp = (stack: StackName): StackOp => ({ stack, top: stack, push: [] })
const peekBottomOp = (stack: StackName): StackOp => ({
  stack,
  top: bottomOf(stack),
  push: [bottomOf(stack)],
})

const blockText = (block: BlockItem) => `${block.symbol}${formatCount(block.count)}`
const lowerBound = (ctx: PieceContext, variable: string) =>
  ctx.spec.variables.find((v) => v.name === variable)?.lowerBound ?? 0

/**
 * Una unidad lee c símbolos: el primero hace las operaciones de pila y los demás
 * pasan por estados intermedios sin tocar las pilas.
 */
function unit(
  ctx: PieceContext,
  from: StateId,
  to: StateId,
  symbol: string,
  factor: number,
  ops: readonly StackOp[],
  explanation: string,
) {
  let current = from
  for (let i = 1; i <= factor; i++) {
    const next = i === factor ? to : ctx.b.state(`Leyó ${i} de cada ${factor} ${symbol}.`)
    ctx.b.add(
      current,
      next,
      symbol,
      i === 1 ? ops : [],
      i === 1
        ? explanation
        : `Lee ${symbol} sin tocar las pilas: cada ${factor} ${symbol} cuentan como uno.`,
    )
    current = next
  }
}

export function buildBlock(
  ctx: PieceContext,
  item: number,
  body: number | null,
  copy: Copy,
  entry: StateId,
  label: string,
): StateId {
  const block =
    body === null
      ? (ctx.spec.items[item] as BlockItem)
      : (ctx.spec.items[item] as GroupItem).body[body]
  const role = ctx.analysis.roleOf(item, body, copy)
  const title = `Bloque ${blockText(block)}${label}`
  switch (role.kind) {
    case 'const':
      return constBlock(ctx, block, entry, title)
    case 'free':
      return freeBlock(ctx, block, entry, title)
    case 'define':
      return defineBlock(ctx, block, role.targets, entry, title)
    case 'verifyPop':
      return verifyPopBlock(ctx, block, role.stack, entry, title)
    case 'verifyTransfer':
      return verifyTransferBlock(ctx, block, role.stack, role.aux, entry, title)
  }
}

function constBlock(ctx: PieceContext, block: BlockItem, entry: StateId, title: string) {
  const { b } = ctx
  const k = block.count.kind === 'const' ? block.count.value : 1
  const s = block.symbol
  b.step(
    `${title}: parte fija`,
    `${blockText(block)} siempre tiene ${k} ${s}. Se lee con estados en cadena, sin tocar las pilas.`,
  )
  let current = entry
  for (let i = 1; i <= k; i++) {
    const next = b.state(k === 1 ? `Ya leyó la ${s} fija.` : `Ya leyó ${i} de las ${k} ${s} fijas.`)
    b.add(current, next, s, [], `Lee ${s}, que es parte fija del patrón.`)
    current = next
  }
  return current
}

function freeBlock(ctx: PieceContext, block: BlockItem, entry: StateId, title: string) {
  const { b } = ctx
  if (block.count.kind !== 'var') return entry
  const { variable: v, factor: c } = block.count
  const s = block.symbol
  const minimum = lowerBound(ctx, v) * c
  b.step(
    `${title}: ${v} no necesita pila`,
    `${v} aparece una sola vez, así que no hay nada que comparar: basta leer ${
      minimum > 0 ? `al menos ${minimum} ${s}` : `cualquier cantidad de ${s}`
    }${c > 1 ? ` en grupos de ${c}` : ''}.`,
  )
  let current = entry
  for (let i = 1; i <= minimum; i++) {
    const next = b.state(`Lleva ${i} de las ${minimum} ${s} mínimas de ${blockText(block)}.`)
    b.add(current, next, s, [], `Lee ${s}; todavía falta completar el mínimo de ${v}.`)
    current = next
  }
  b.describe(current, `Aquí se pueden seguir leyendo ${s}.`)
  unit(ctx, current, current, s, c, [], `Lee otra ${s}; ${v} puede crecer libremente.`)
  const exit = b.state(`Terminó ${blockText(block)}.`)
  b.add(
    current,
    exit,
    null,
    [],
    `Sin leer nada, termina ${blockText(block)} y pasa a lo siguiente.`,
  )
  return exit
}

function defineBlock(
  ctx: PieceContext,
  block: BlockItem,
  targets: readonly StackName[],
  entry: StateId,
  title: string,
) {
  const { b } = ctx
  if (block.count.kind !== 'var') return entry
  const { variable: v, factor: c } = block.count
  const s = block.symbol
  const minimum = lowerBound(ctx, v)
  const tokens = targets.join(' y ')
  const purposes = targets
    .map((t) => `${t}: ${ctx.analysis.stacks.find((st) => st.name === t)?.purpose ?? ''}`)
    .join(' ')
  const ops = (variant: Variant) => targets.map((t) => pushOp(t, variant))
  b.step(
    `${title}: define ${v}`,
    `Cada ${c > 1 ? `grupo de ${c} ` : ''}${s} suma 1 a ${v}, y por cada una se apila ${tokens}. ${purposes}\n${
      minimum > 0
        ? `Como ${v} ≥ ${minimum}, ${minimum === 1 ? `la primera ${s} se lee` : `las primeras ${minimum} se leen`} con estados en cadena y luego viene un lazo.`
        : `Como ${v} puede ser 0, el lazo está en el mismo estado de entrada y tiene dos variantes: con la pila en el fondo y con la pila ya cargada.`
    }`,
    targets,
  )
  let current = entry
  for (let u = 1; u <= minimum; u++) {
    const next = b.state(
      u === minimum
        ? `Ya contó ${minimum} ${s} (el mínimo de ${v}); aquí sigue contando.`
        : `Lleva ${u} ${s} contadas para ${v}.`,
    )
    unit(
      ctx,
      current,
      next,
      s,
      c,
      ops(u === 1 ? 'bottom' : 'token'),
      u === 1
        ? `Lee ${s} con ${targets.map(bottomOf).join(' y ')} en el tope: apila ${tokens}, el primer conteo de ${v}.`
        : `Lee otra ${s}: apila otra ${tokens}.`,
    )
    current = next
  }
  if (minimum === 0) {
    b.describe(entry, `Aquí se cuentan las ${s} de ${blockText(block)}.`)
    unit(
      ctx,
      entry,
      entry,
      s,
      c,
      ops('bottom'),
      `Lee la primera ${s}: apila ${tokens} sobre el fondo.`,
    )
  }
  unit(ctx, current, current, s, c, ops('token'), `Lee otra ${s}: apila otra ${tokens}.`)
  const exit = b.state(`Terminó de contar ${v} con ${blockText(block)}.`)
  b.add(current, exit, null, [], `Sin leer nada, termina de contar ${v} y pasa a lo siguiente.`)
  return exit
}

function verifyPopBlock(
  ctx: PieceContext,
  block: BlockItem,
  stack: StackName,
  entry: StateId,
  title: string,
) {
  const { b } = ctx
  if (block.count.kind !== 'var') return entry
  const { variable: v, factor: c } = block.count
  const s = block.symbol
  b.step(
    `${title}: verifica ${v}`,
    `Cada ${c > 1 ? `grupo de ${c} ` : ''}${s} desapila una ${stack}. Al final ${stack} debe quedar en su fondo ${bottomOf(stack)}: así se comprueba que hay exactamente las ${s} que pide ${v}. Es el último uso de ${v}, por eso se desapila.`,
    [stack],
  )
  b.describe(entry, `Aquí se leen las ${s} de ${blockText(block)} desapilando ${stack}.`)
  unit(ctx, entry, entry, s, c, [popOp(stack)], `Lee ${s} y desapila una ${stack}.`)
  const exit = b.state(`Terminó ${blockText(block)}: la cuenta de ${v} coincidió.`)
  b.add(
    entry,
    exit,
    null,
    [peekBottomOp(stack)],
    `Sin leer nada, comprueba que ${stack} quedó en su fondo ${bottomOf(stack)}: se leyeron exactamente las ${s} de ${v}.`,
  )
  return exit
}

function verifyTransferBlock(
  ctx: PieceContext,
  block: BlockItem,
  stack: StackName,
  aux: StackName,
  entry: StateId,
  title: string,
) {
  const { b } = ctx
  if (block.count.kind !== 'var') return entry
  const { variable: v, factor: c } = block.count
  const s = block.symbol
  b.step(
    `${title}: verifica ${v} sin perder el conteo`,
    `Como ${v} se vuelve a usar, cada ${c > 1 ? `grupo de ${c} ` : ''}${s} pasa una ${stack} de la pila ${stack} a ${aux} en vez de descartarla. Al final ${stack} debe quedar en su fondo ${bottomOf(stack)}: así se comprueba que la cantidad de ${s} coincide con ${v}.`,
    [stack, aux],
  )
  b.describe(entry, `Aquí se leen las ${s} de ${blockText(block)} pasando ${stack} a ${aux}.`)
  unit(
    ctx,
    entry,
    entry,
    s,
    c,
    [popOp(stack), pushOp(aux, 'bottom')],
    `Lee ${s}: saca una ${stack} y la pone en ${aux}, que estaba vacía.`,
  )
  unit(
    ctx,
    entry,
    entry,
    s,
    c,
    [popOp(stack), pushOp(aux, 'token')],
    `Lee ${s}: pasa otra ${stack} a ${aux}.`,
  )
  const restore = b.state(`Devuelve las ${aux} a ${stack} para recuperar el conteo de ${v}.`)
  b.add(
    entry,
    restore,
    null,
    [peekBottomOp(stack)],
    `Sin leer nada, comprueba que ${stack} quedó en su fondo: la cantidad de ${s} coincide con ${v}.`,
  )

  b.step(
    `Devolución de ${aux} a ${stack}`,
    `Sin leer entrada, cada ${aux} vuelve a ${stack}. Cuando ${aux} queda en su fondo, el conteo de ${v} está otra vez completo en ${stack} para el siguiente uso.`,
    [stack, aux],
  )
  b.add(
    restore,
    restore,
    null,
    [popOp(aux), pushOp(stack, 'bottom')],
    `Sin leer nada, devuelve la primera ${aux} a ${stack}.`,
  )
  b.add(
    restore,
    restore,
    null,
    [popOp(aux), pushOp(stack, 'token')],
    `Sin leer nada, devuelve otra ${aux} a ${stack}.`,
  )
  const exit = b.state(`Terminó ${blockText(block)}: ${stack} tiene otra vez el conteo de ${v}.`)
  b.add(
    restore,
    exit,
    null,
    [peekBottomOp(aux)],
    `${aux} quedó en su fondo ${bottomOf(aux)}: el conteo de ${v} está completo en ${stack}.`,
  )
  return exit
}

function buildCopy(ctx: PieceContext, item: number, copy: Copy, entry: StateId, label: string) {
  const group = ctx.spec.items[item] as GroupItem
  let current = entry
  group.body.forEach((_, body) => {
    current = buildBlock(ctx, item, body, copy, current, label)
  })
  return current
}

export function buildGroup(ctx: PieceContext, item: number, entry: StateId): StateId {
  const { b, analysis } = ctx
  const info = analysis.groupOf(item)
  const text = formatPattern([ctx.spec.items[item]])
  const v = info.variable
  const minimum = lowerBound(ctx, v)
  const R = info.repsStack
  const hasDefs = info.hasDefinitions
  const mode = info.mode
  const unrolled =
    mode === 'c' || mode === 'd' ? Math.max(minimum, hasDefs ? 1 : 0) : hasDefs ? 1 : 0
  const skip = unrolled >= 1 && (mode === 'a' || minimum === 0)

  const enterOps = (repetition: number, variant: Variant): StackOp[] => {
    if (mode === 'a' || (mode === 'b' && repetition > 1)) return [popOp(R!)]
    if (mode === 'c') return info.pushTargets.map((t) => pushOp(t, variant))
    return []
  }
  const enterExplanation = (variant: Variant) => {
    if (mode === 'a' || mode === 'b') {
      return `Sin leer nada, descuenta una repetición desapilando una ${R} y empieza otra repetición de ${text}.`
    }
    if (mode === 'c') {
      return `Sin leer nada, empieza una repetición de ${text} y la cuenta apilando ${info.pushTargets.join(' y ')}${variant === 'bottom' ? ' sobre el fondo' : ''}.`
    }
    return `Sin leer nada, empieza otra repetición de ${text}.`
  }
  // Si el estado ofrece otras opciones (saltar o salir), la repetición empieza en un estado nuevo.
  const enter = (
    from: StateId,
    repetition: number,
    variants: readonly Variant[],
    hasOptions: boolean,
  ) => {
    const opsList = variants.map((variant) => enterOps(repetition, variant))
    if (opsList.every((ops) => ops.length === 0) && !hasOptions) return from
    const to = b.state(
      `Empieza ${repetition === 1 ? 'la primera repetición' : 'otra repetición'} de ${text}.`,
    )
    const used = mode === 'c' ? variants : variants.slice(0, 1)
    used.forEach((variant) =>
      b.add(from, to, null, enterOps(repetition, variant), enterExplanation(variant)),
    )
    return to
  }

  b.step(
    `Repeticiones de ${text}`,
    groupExplanation(mode, text, v, minimum, R, unrolled, skip),
    R ? [R] : [],
  )
  let current = entry
  for (let repetition = 1; repetition <= unrolled; repetition++) {
    if (repetition > 1) {
      b.step(
        `Repetición ${repetition} de ${text}`,
        `Para cumplir ${v} ≥ ${minimum}, la repetición ${repetition} también es obligatoria.`,
      )
    }
    const copy: Copy = repetition === 1 && hasDefs ? 'def' : 'verif'
    const copyEntry = enter(
      current,
      repetition,
      [repetition === 1 ? 'bottom' : 'token'],
      repetition === 1 && skip,
    )
    const label = repetition === 1 ? ' (primera repetición)' : ` (repetición ${repetition})`
    current = buildCopy(ctx, item, copy, copyEntry, label)
  }

  let decision = current
  if (mode === 'b') {
    b.step(
      `Fin de la primera repetición de ${text}`,
      `La primera repetición ya ocurrió: se descuenta desapilando una ${R}. Lo que queda en ${R} son las repeticiones que faltan.`,
      [R!],
    )
    decision = b.state(
      `Decide si hay otra repetición de ${text}: depende de si quedan ${R} en la pila.`,
    )
    b.add(
      current,
      decision,
      null,
      [popOp(R!)],
      `Sin leer nada, descuenta la primera repetición: desapila una ${R}.`,
    )
  } else {
    b.describe(decision, `Aquí se decide si hay otra repetición de ${text}.`)
  }

  b.step(
    `Decisión: ¿otra repetición de ${text}?`,
    R
      ? `Si queda alguna ${R}, se desapila y empieza otra repetición. Si ${R} está en su fondo ${bottomOf(R)}, ya no quedan repeticiones.`
      : `${v} no tiene una pila de repeticiones: el autómata puede repetir o salir sin leer nada, y la simulación prueba ambos caminos.`,
    R ? [R] : [],
  )
  const loopVariants: Variant[] = mode === 'c' && unrolled === 0 ? ['bottom', 'token'] : ['token']
  const loopEntry = enter(decision, 2, loopVariants, true)
  const loopExit = buildCopy(
    ctx,
    item,
    hasDefs ? 'verif' : 'def',
    loopEntry,
    unrolled >= 1 ? ' (repeticiones siguientes)' : '',
  )

  b.step(
    `Fin de una repetición de ${text}`,
    `Al terminar una repetición se vuelve a ${decision} para decidir si hay otra.`,
  )
  b.add(
    loopExit,
    decision,
    null,
    [],
    `Sin leer nada, vuelve a ${decision} para decidir si hay otra repetición.`,
  )

  b.step(
    `Salida de ${text}`,
    R
      ? `Se sale de ${text} cuando ${R} queda en su fondo: se hicieron exactamente las repeticiones que pide ${v}.`
      : `Se sale de ${text} sin leer nada; si sale antes o después de tiempo, el resto de la cadena no encaja y ese camino se descarta.`,
    R ? [R] : [],
  )
  const exit = b.state(`Terminó ${text}.`)
  b.add(
    decision,
    exit,
    null,
    R ? [peekBottomOp(R)] : [],
    R
      ? `${R} está en su fondo ${bottomOf(R)}: ya no quedan repeticiones; sale de ${text}.`
      : `Sin leer nada, deja de repetir ${text}.`,
  )
  if (skip) {
    b.add(
      entry,
      exit,
      null,
      mode === 'a' ? [peekBottomOp(R!)] : [],
      mode === 'a'
        ? `${R} está en su fondo: ${v} = 0, así que ${text} no se repite.`
        : `Sin leer nada, se salta ${text}: ${v} puede ser 0.`,
    )
  }
  return exit
}

function groupExplanation(
  mode: string,
  text: string,
  v: string,
  minimum: number,
  R: StackName | null,
  unrolled: number,
  skip: boolean,
): string {
  const lines = [
    mode === 'a'
      ? `${text} se repite ${v} veces, y ${v} ya se contó antes en la pila ${R}: cada repetición desapila una ${R}.`
      : mode === 'b'
        ? `${text} se repite ${v} veces, pero ${v} se cuenta dentro de la primera repetición. Mientras se cuenta, también se llena la pila ${R}, que lleva las repeticiones que faltan.`
        : mode === 'c'
          ? `Las repeticiones de ${text} definen ${v}: cada repetición apila un símbolo para usarlo después.`
          : `${v} solo indica cuántas veces se repite ${text}, así que no necesita pila.`,
  ]
  if (unrolled >= 1) {
    lines.push(
      unrolled === 1
        ? 'La primera repetición se construye aparte, porque es la que define las variables del grupo.'
        : `Las primeras ${unrolled} repeticiones se construyen aparte para cumplir ${v} ≥ ${minimum}.`,
    )
  }
  if (skip) lines.push(`Como ${v} puede ser 0, también hay un camino que se salta el grupo.`)
  return lines.join('\n')
}
