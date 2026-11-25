// Combina la validación del alfabeto Σ, la lectura del lenguaje L y la construcción del autómata.
import { buildConstruction, parseAlphabet, parseLanguage } from '../../core'
import type { Construction, InputError } from '../../core'

export type BuildState =
  | { readonly status: 'idle' }
  | {
      readonly status: 'error'
      readonly alphabetErrors: readonly InputError[]
      readonly languageErrors: readonly InputError[]
    }
  | { readonly status: 'ok'; readonly construction: Construction }

export function buildFromTexts(alphabetText: string, languageText: string): BuildState {
  const alphabetResult = parseAlphabet(alphabetText)
  if (!alphabetResult.ok) {
    return {
      status: 'error',
      alphabetErrors: alphabetResult.errors,
      languageErrors: [],
    }
  }

  const languageResult = parseLanguage(languageText, alphabetResult.value)
  if (!languageResult.ok) {
    return {
      status: 'error',
      alphabetErrors: [],
      languageErrors: languageResult.errors,
    }
  }

  const construction = buildConstruction(languageResult.value)
  return {
    status: 'ok',
    construction,
  }
}

export function formatInputError(error: InputError): string {
  if (error.position === undefined) return error.message
  return `${error.message} (posición ${error.position + 1})`
}
