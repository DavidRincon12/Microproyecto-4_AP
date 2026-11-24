// API pública del núcleo. La interfaz importa solo desde aquí.
export type * from './types'
export { EPSILON, formatStackOp, formatSymbolSet, formatTransition } from './format'
export { MAX_ALPHABET_SIZE, parseAlphabet } from './alphabet'
export { MAX_LANGUAGE_LENGTH, parseLanguage } from './language/normalize'
export { formatPattern } from './language/pretty'
export { DEFAULT_LIMITS, MAX_INPUT_LENGTH, simulate } from './simulation/simulate'
export { buildConstruction } from './construction/buildConstruction'
