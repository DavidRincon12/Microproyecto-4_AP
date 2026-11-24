// Construcción por contadores con varias pilas (RF-05) con sus pasos explicados (RF-06).
import { formatSymbolSet } from '../format'
import type { Construction, LanguageSpec, PatternItem } from '../types'
import { analyze } from './analyze'
import { AutomatonBuilder } from './builder'
import { buildBlock, buildGroup, type PieceContext } from './pieces'
import { andList } from './text'

export function buildConstruction(spec: LanguageSpec): Construction {
  const analysis = analyze(spec)
  const b = new AutomatonBuilder()
  const ctx: PieceContext = { b, spec, analysis }
  const stackNames = analysis.stacks.map((s) => s.name)

  b.step(
    'Alfabeto',
    `Σ = ${formatSymbolSet(spec.alphabet.symbols)}. Cada símbolo es un solo carácter y ninguno se repite.`,
  )
  b.step(
    'Lenguaje',
    `Se leyó ${spec.source.trim()}.\nTodos los símbolos del patrón (${symbolsOf(spec.items).join(', ')}) pertenecen a Σ.`,
  )
  b.step('Normalización', [`L queda como ${spec.normalized}.`, ...spec.notes].join('\n'))
  b.step(
    'Variables y pilas',
    [
      ...analysis.variableLines,
      ...analysis.stacks.map((s) => `Pila ${s.name} (fondo ${s.bottom}): ${s.purpose}`),
    ].join('\n'),
    stackNames,
  )

  b.step(
    'Inicio',
    'q0 es el estado inicial y todas las pilas empiezan vacías. La primera transición no lee nada y pone el fondo de cada pila.',
    stackNames,
  )
  const q0 = b.state('Estado inicial: todas las pilas están vacías.')
  let current = b.state('Las pilas ya tienen su fondo; desde aquí empieza la lectura del patrón.')
  b.add(
    q0,
    current,
    null,
    analysis.stacks.map((s) => ({ stack: s.name, top: null, push: [s.bottom] })),
    `Sin leer nada, pone el fondo de cada pila: ${analysis.stacks.map((s) => s.bottom).join(', ')}.`,
  )

  spec.items.forEach((item, index) => {
    current =
      item.kind === 'block'
        ? buildBlock(ctx, index, null, 'def', current, '')
        : buildGroup(ctx, index, current)
  })

  let final = current
  if (analysis.cleanup.length > 0) {
    b.step(
      'Limpieza y aceptación',
      `Al terminar el patrón quedan símbolos sobrantes en ${andList(analysis.cleanup)}, porque esos conteos se devolvieron para usarlos otra vez. Se vacían sin leer nada y, cuando quedan en su fondo, se llega al estado de aceptación.`,
      analysis.cleanup,
    )
    b.describe(current, `Aquí se vacían las pilas que sobraron: ${analysis.cleanup.join(', ')}.`)
    for (const stack of analysis.cleanup) {
      b.add(
        current,
        current,
        null,
        [{ stack, top: stack, push: [] }],
        `Sin leer nada, saca una ${stack} que sobró; ese conteo ya no se necesita.`,
      )
    }
    final = b.state(
      'Estado de aceptación: se leyó todo el patrón y las pilas quedaron en su fondo.',
    )
    b.add(
      current,
      final,
      null,
      analysis.cleanup.map((stack) => ({ stack, top: `${stack}₀`, push: [`${stack}₀`] })),
      `${analysis.cleanup.length === 1 ? 'La pila' : 'Las pilas'} ${andList(analysis.cleanup)} ${analysis.cleanup.length === 1 ? 'quedó' : 'quedaron'} en su fondo: llega al estado de aceptación.`,
    )
  } else {
    b.step(
      'Aceptación',
      `Al terminar el patrón no sobra nada en las pilas, así que ${current} es el estado de aceptación.`,
    )
    b.describe(current, 'Es el estado de aceptación.')
  }

  b.step(
    'Resumen',
    [
      `El autómata tiene ${b.states.length} estados, ${b.transitions.length} transiciones y ${stackNames.length} ${stackNames.length === 1 ? 'pila' : 'pilas'} (${stackNames.join(', ')}).`,
      `Estado inicial: ${q0}. Estado de aceptación: ${final}.`,
      `Una cadena se acepta si, al terminar de leerla, el autómata puede estar en ${final}. En ese momento cada pila tiene solo su fondo.`,
    ].join('\n'),
  )
  b.close()

  return {
    language: spec,
    automaton: {
      states: b.states,
      initial: q0,
      finals: [final],
      inputAlphabet: spec.alphabet.symbols,
      stacks: analysis.stacks,
      transitions: b.transitions,
    },
    steps: b.steps,
  }
}

function symbolsOf(items: readonly PatternItem[]): string[] {
  const blocks = items.flatMap((item) => (item.kind === 'block' ? [item] : item.body))
  return [...new Set(blocks.map((block) => block.symbol))]
}
