// Panel de entrada para el alfabeto Σ, el lenguaje L, los ejemplos y la ayuda de sintaxis.
import { useId } from 'react'
import type { FormEvent } from 'react'
import { EXAMPLES } from '../../core'
import type { Example } from '../../core'
import { formatInputError } from './buildFromTexts'
import type { BuildState } from './buildFromTexts'

interface InputPanelProps {
  readonly alphabetText: string
  readonly languageText: string
  readonly selectedExampleId: string
  readonly buildState: BuildState
  readonly isStale: boolean
  readonly onAlphabetChange: (value: string) => void
  readonly onLanguageChange: (value: string) => void
  readonly onSelectExample: (example: Example | null) => void
  readonly onBuild: () => void
}

export function InputPanel({
  alphabetText,
  languageText,
  selectedExampleId,
  buildState,
  isStale,
  onAlphabetChange,
  onLanguageChange,
  onSelectExample,
  onBuild,
}: InputPanelProps) {
  const exampleId = useId()
  const alphabetId = useId()
  const alphabetErrorId = useId()
  const languageId = useId()
  const languageErrorId = useId()

  const alphabetErrors = buildState.status === 'error' ? buildState.alphabetErrors : []
  const languageErrors = buildState.status === 'error' ? buildState.languageErrors : []

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onBuild()
  }

  const handleExampleChange = (id: string) => {
    const found = EXAMPLES.find((ex) => ex.id === id) ?? null
    onSelectExample(found)
  }

  return (
    <section className="panel input-panel" aria-label="Configuración del lenguaje">
      <form onSubmit={handleSubmit} className="input-form" noValidate>
        <div className="form-row-top">
          <div className="field">
            <label htmlFor={exampleId}>Ejemplos</label>
            <select
              id={exampleId}
              name="example"
              value={selectedExampleId}
              onChange={(e) => handleExampleChange(e.target.value)}
            >
              <option value="">Selecciona un ejemplo…</option>
              {EXAMPLES.map((example) => (
                <option key={example.id} value={example.id}>
                  {example.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-grid">
          <div className="field">
            <label htmlFor={alphabetId}>Alfabeto Σ</label>
            <input
              id={alphabetId}
              name="alphabet"
              type="text"
              placeholder="0, 1"
              value={alphabetText}
              onChange={(e) => onAlphabetChange(e.target.value)}
              aria-invalid={alphabetErrors.length > 0 ? 'true' : undefined}
              aria-describedby={alphabetErrors.length > 0 ? alphabetErrorId : undefined}
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
            />
            {alphabetErrors.length > 0 && (
              <div id={alphabetErrorId} role="alert" className="error-list">
                {alphabetErrors.map((err, idx) => (
                  <p key={idx} className="error-msg">
                    <span aria-hidden="true">⚠ </span>
                    {formatInputError(err)}
                  </p>
                ))}
              </div>
            )}
          </div>

          <div className="field">
            <label htmlFor={languageId}>Lenguaje L</label>
            <input
              id={languageId}
              name="language"
              type="text"
              placeholder="{(0^n 1^m)^k | n > 0, m > 1, k = n}"
              value={languageText}
              onChange={(e) => onLanguageChange(e.target.value)}
              aria-invalid={languageErrors.length > 0 ? 'true' : undefined}
              aria-describedby={languageErrors.length > 0 ? languageErrorId : undefined}
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
            />
            {languageErrors.length > 0 && (
              <div id={languageErrorId} role="alert" className="error-list">
                {languageErrors.map((err, idx) => (
                  <p key={idx} className="error-msg">
                    <span aria-hidden="true">⚠ </span>
                    {formatInputError(err)}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            Construir
          </button>
          {isStale && (
            <p role="status" className="status-badge status-stale">
              <span aria-hidden="true">ℹ </span>
              Editaste Σ o L. Presiona «Construir» para actualizar el autómata.
            </p>
          )}
        </div>
      </form>

      {buildState.status === 'ok' && (
        <div className="normalized-box" aria-live="polite">
          <p className="normalized-title">
            <strong>Lenguaje normalizado:</strong>{' '}
            <span className="mono">{buildState.construction.language.normalized}</span>
          </p>
          {buildState.construction.language.notes.length > 0 && (
            <ul className="notes-list">
              {buildState.construction.language.notes.map((note, idx) => (
                <li key={idx}>{note}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <details className="syntax-help">
        <summary>Ayuda de sintaxis para escribir L</summary>
        <div className="syntax-help-body">
          <p>
            Formato general: <code>L = {'{ patrón | condiciones }'}</code>. Tanto <code>L =</code>{' '}
            como las llaves son opcionales, y en lugar de <code>|</code> también sirve{' '}
            <code>:</code>.
          </p>
          <div className="table-scroll">
            <table className="help-table">
              <thead>
                <tr>
                  <th scope="col">Se escribe</th>
                  <th scope="col">Significa</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>a^n b^n | n &gt;= 0</code>
                  </td>
                  <td>aⁿbⁿ con n ≥ 0</td>
                </tr>
                <tr>
                  <td>
                    <code>a^n b^(2n)</code> o <code>a^n b^2n</code>
                  </td>
                  <td>aⁿb²ⁿ</td>
                </tr>
                <tr>
                  <td>
                    <code>a^n b^m c^(n+m) | n, m &gt;= 1</code>
                  </td>
                  <td>aⁿbᵐcⁿ⁺ᵐ con n, m ≥ 1</td>
                </tr>
                <tr>
                  <td>
                    <code>(0^n 1^m)^k | n &gt; 0, m &gt; 1, k = n</code>
                  </td>
                  <td>(0ⁿ1ᵐ)ᵏ con k = n</td>
                </tr>
                <tr>
                  <td>
                    <code>(0ⁿ1ᵐ)ᵏ : n&gt;0, m&gt;1, k=n</code>
                  </td>
                  <td>lo mismo, escrito con superíndices</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="hint-text">
            Se admiten mínimos (<code>n &gt; 0</code>, <code>n &gt;= 1</code>, <code>n ≥ 1</code>) e
            igualdades entre variables (<code>k = n</code>, <code>m = 2n</code>). Una variable sin
            condición vale ≥ 0.
          </p>
        </div>
      </details>
    </section>
  )
}
