// Simulación por búsqueda en anchura sobre configuraciones (estado, posición, pilas).
// Los autómatas construidos son no deterministas (salidas por ε), así que se exploran
// todas las alternativas y se devuelve el camino de aceptación más corto.
import { formatSymbolSet } from '../format'
import type {
  Automaton,
  Configuration,
  SimulationLimits,
  SimulationResult,
  StackContents,
  TraceStep,
  Transition,
} from '../types'

export const MAX_INPUT_LENGTH = 100
export const DEFAULT_LIMITS: SimulationLimits = { maxConfigurations: 200_000, maxStackHeight: 0 }

interface Node {
  readonly configuration: Configuration
  readonly parent: number
  readonly transition: Transition | null
  readonly depth: number
}

export function simulate(
  automaton: Automaton,
  rawInput: string,
  limits: Partial<SimulationLimits> = {},
): SimulationResult {
  const input = rawInput === 'ε' || rawInput === 'λ' ? '' : rawInput
  const symbols = [...input]
  const rejected = (reason: string): SimulationResult => ({
    input,
    accepted: false,
    reason,
    trace: [],
    exploredConfigurations: 0,
    limitReached: false,
  })
  if (symbols.length > MAX_INPUT_LENGTH) {
    return rejected(`La cadena admite máximo ${MAX_INPUT_LENGTH} símbolos.`)
  }
  const outside = symbols.findIndex((s) => !automaton.inputAlphabet.includes(s))
  if (outside >= 0) {
    return rejected(
      `El símbolo «${symbols[outside]}» (posición ${outside + 1}) no pertenece a Σ = ${formatSymbolSet(automaton.inputAlphabet)}.`,
    )
  }

  const maxConfigurations = limits.maxConfigurations ?? DEFAULT_LIMITS.maxConfigurations
  const maxStackHeight = limits.maxStackHeight || 2 * symbols.length + 4
  const outgoing = new Map<string, Transition[]>()
  for (const t of automaton.transitions) {
    outgoing.set(t.from, [...(outgoing.get(t.from) ?? []), t])
  }
  const stackNames = automaton.stacks.map((s) => s.name)
  const initial: Configuration = {
    state: automaton.initial,
    position: 0,
    stacks: Object.fromEntries(stackNames.map((name) => [name, []])),
  }

  const nodes: Node[] = [{ configuration: initial, parent: -1, transition: null, depth: 0 }]
  const visited = new Set([keyOf(initial, stackNames)])
  let limitReached = false
  let best = 0
  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index]
    const { configuration } = node
    if (configuration.position > nodes[best].configuration.position) best = index
    if (
      automaton.finals.includes(configuration.state) &&
      configuration.position === symbols.length
    ) {
      return {
        input,
        accepted: true,
        reason: `Se consumió toda la cadena y el autómata llegó a ${configuration.state}, que es de aceptación.`,
        trace: traceTo(nodes, index),
        exploredConfigurations: nodes.length,
        limitReached: false,
      }
    }
    for (const transition of outgoing.get(configuration.state) ?? []) {
      const next = apply(transition, configuration, symbols)
      if (!next) continue
      if (Object.values(next.stacks).some((stack) => stack.length > maxStackHeight + 1)) {
        limitReached = true
        continue
      }
      const key = keyOf(next, stackNames)
      if (visited.has(key)) continue
      if (nodes.length >= maxConfigurations) {
        limitReached = true
        break
      }
      visited.add(key)
      nodes.push({ configuration: next, parent: index, transition, depth: node.depth + 1 })
    }
  }

  return {
    input,
    accepted: false,
    reason: rejectionReason(
      nodes[best].configuration,
      symbols,
      stackNames,
      limitReached,
      maxConfigurations,
    ),
    trace: traceTo(nodes, best),
    exploredConfigurations: nodes.length,
    limitReached,
  }
}

function apply(
  transition: Transition,
  configuration: Configuration,
  symbols: readonly string[],
): Configuration | null {
  if (transition.input !== null && symbols[configuration.position] !== transition.input) return null
  const stacks: Record<string, readonly string[]> = { ...configuration.stacks }
  for (const op of transition.ops) {
    const stack = stacks[op.stack]
    if (op.top === null) {
      stacks[op.stack] = [...stack, ...op.push]
      continue
    }
    if (stack.length === 0 || stack[stack.length - 1] !== op.top) return null
    stacks[op.stack] = [...stack.slice(0, -1), ...op.push]
  }
  return {
    state: transition.to,
    position: configuration.position + (transition.input === null ? 0 : 1),
    stacks,
  }
}

const keyOf = (configuration: Configuration, stackNames: readonly string[]) =>
  [
    configuration.state,
    configuration.position,
    ...stackNames.map((name) => configuration.stacks[name].join('\u0001')),
  ].join('\u0002')

function traceTo(nodes: readonly Node[], index: number): TraceStep[] {
  const trace: TraceStep[] = []
  for (let i = index; i >= 0; i = nodes[i].parent) {
    trace.push({ configuration: nodes[i].configuration, transition: nodes[i].transition })
  }
  return trace.reverse()
}

function rejectionReason(
  configuration: Configuration,
  symbols: readonly string[],
  stackNames: readonly string[],
  limitReached: boolean,
  maxConfigurations: number,
): string {
  if (limitReached) {
    return `Se alcanzó el límite de exploración (${maxConfigurations} configuraciones o la altura máxima de las pilas) sin encontrar un camino de aceptación.`
  }
  if (configuration.position === symbols.length) {
    return 'Se consumió toda la cadena, pero ningún camino llega a un estado de aceptación.'
  }
  const symbol = symbols[configuration.position]
  return `No se pudo leer «${symbol}» (posición ${configuration.position + 1}): desde ${configuration.state} con topes ${tops(configuration.stacks, stackNames)} no hay ninguna transición que lo lea.`
}

const tops = (stacks: StackContents, stackNames: readonly string[]) =>
  stackNames.map((name) => stacks[name].at(-1) ?? `${name} vacía`).join(', ')
