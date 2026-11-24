// Contrato de datos entre el núcleo y la interfaz.
// Cambios solo de común acuerdo: agregar campos opcionales no rompe nada.

export type StateId = string // "q0", "q1", …
export type StackName = string // "X", "Xₐ", …

export interface Alphabet {
  readonly symbols: readonly string[]
}

/** Error de entrada con mensaje en español; position es el índice (base 0) en el texto. */
export interface InputError {
  readonly message: string
  readonly position?: number
}

export type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly errors: readonly InputError[] }

/** Exponente normalizado: constante, o factor·variable (2n → { variable: 'n', factor: 2 }). */
export type Count =
  | { readonly kind: 'const'; readonly value: number }
  | { readonly kind: 'var'; readonly variable: string; readonly factor: number }

export interface BlockItem {
  readonly kind: 'block'
  readonly symbol: string
  readonly count: Count
}

export interface GroupItem {
  readonly kind: 'group'
  readonly body: readonly BlockItem[]
  readonly reps: Count
}

export type PatternItem = BlockItem | GroupItem

export interface VariableInfo {
  readonly name: string
  readonly lowerBound: number
  /** Variables que se reemplazaron por esta (k = n → n tiene alias ['k']). */
  readonly aliases: readonly string[]
}

export interface LanguageSpec {
  readonly source: string
  /** L normalizado con superíndices, p. ej. "L = {(0ⁿ1ᵐ)ⁿ | n ≥ 1, m ≥ 2}". */
  readonly normalized: string
  readonly alphabet: Alphabet
  readonly items: readonly PatternItem[]
  readonly variables: readonly VariableInfo[]
  /** Aclaraciones de la normalización (mínimos asumidos, igualdades aplicadas). */
  readonly notes: readonly string[]
}

export interface StackDef {
  readonly name: StackName
  /** Símbolo de conteo de la pila (X). */
  readonly token: string
  /** Símbolo de fondo (X₀). */
  readonly bottom: string
  readonly purpose: string
}

/**
 * Operación sobre una pila dentro de una transición.
 * push va de fondo a tope: ['X₀', 'X'] deja la X encima.
 * top null solo aparece en la inicialización: no se lee ni se saca nada.
 */
export interface StackOp {
  readonly stack: StackName
  readonly top: string | null
  readonly push: readonly string[]
}

export interface Transition {
  readonly id: string
  readonly from: StateId
  readonly to: StateId
  /** Símbolo leído, o null para ε. */
  readonly input: string | null
  readonly ops: readonly StackOp[]
  readonly explanation: string
}

export interface State {
  readonly id: StateId
  readonly description: string
}

export interface Automaton {
  readonly states: readonly State[]
  readonly initial: StateId
  readonly finals: readonly StateId[]
  readonly inputAlphabet: readonly string[]
  readonly stacks: readonly StackDef[]
  readonly transitions: readonly Transition[]
}

export interface ConstructionStep {
  readonly title: string
  /** Puede tener varias líneas separadas por \n; cada una se muestra como párrafo. */
  readonly explanation: string
  readonly states: readonly StateId[]
  /** Ids de las transiciones creadas en este paso. */
  readonly transitions: readonly string[]
  readonly stacks: readonly StackName[]
}

export interface Construction {
  readonly language: LanguageSpec
  readonly automaton: Automaton
  readonly steps: readonly ConstructionStep[]
}

/** Contenido de cada pila, de fondo a tope. */
export type StackContents = Readonly<Record<StackName, readonly string[]>>

export interface Configuration {
  readonly state: StateId
  /** Cantidad de símbolos ya leídos. */
  readonly position: number
  readonly stacks: StackContents
}

export interface TraceStep {
  readonly configuration: Configuration
  /** Transición que llevó a esta configuración (null en la inicial). */
  readonly transition: Transition | null
}

export interface SimulationLimits {
  readonly maxConfigurations: number
  /** Máximo de símbolos de conteo por pila; 0 = 2·|w| + 4. */
  readonly maxStackHeight: number
}

export interface SimulationResult {
  readonly input: string
  readonly accepted: boolean
  readonly reason: string
  readonly trace: readonly TraceStep[]
  readonly exploredConfigurations: number
  readonly limitReached: boolean
}

export interface FormalDefinition {
  readonly tuple: string
  readonly states: string
  readonly inputAlphabet: string
  readonly stacks: readonly { name: StackName; alphabet: string; bottom: string }[]
  readonly stackAlphabet: string
  readonly initialState: string
  readonly bottoms: string
  readonly finals: string
  readonly transitions: readonly string[]
  readonly acceptance: string
}

export interface Example {
  readonly id: string
  readonly title: string
  readonly alphabet: string
  readonly language: string
  readonly accepted: readonly string[]
  readonly rejected: readonly string[]
}
