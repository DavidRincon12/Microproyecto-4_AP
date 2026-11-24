// API pública del núcleo. La interfaz importa solo desde aquí.
export type * from './types'
export { EPSILON, formatStackOp, formatSymbolSet, formatTransition } from './format'
export { MAX_ALPHABET_SIZE, parseAlphabet } from './alphabet'
