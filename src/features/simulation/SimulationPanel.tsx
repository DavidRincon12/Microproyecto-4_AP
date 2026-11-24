// Panel de simulación paso a paso y verificación de casos del ejemplo (RF-10, RF-11).
import { useEffect, useId, useState } from 'react'
import type { FormEvent } from 'react'
import { EPSILON, formatTransition, simulate } from '../../core'
import type { Automaton, Example, SimulationResult } from '../../core'
import { StackView } from './StackView'

interface ExampleCaseRow {
  readonly input: string
  readonly expected: boolean
  readonly actual: boolean
  readonly passed: boolean
}

interface SimulationPanelProps {
  readonly automaton: Automaton
  readonly example: Example | null
  readonly inputText: string
  readonly result: SimulationResult | null
  readonly stepIndex: number
  readonly onInputChange: (value: string) => void
  readonly onSimulate: (rawInput: string) => void
  readonly onStepChange: (index: number) => void
}

export function SimulationPanel({
  automaton,
  example,
  inputText,
  result,
  stepIndex,
  onInputChange,
  onSimulate,
  onStepChange,
}: SimulationPanelProps) {
  const inputId = useId()
  const helpId = useId()
  const [playingAutomaton, setPlayingAutomaton] = useState<Automaton | null>(null)
  const [exampleCasesState, setExampleCasesState] = useState<{
    readonly automaton: Automaton
    readonly rows: readonly ExampleCaseRow[]
  } | null>(null)

  const traceLength = result?.trace.length ?? 0
  const maxStep = Math.max(0, traceLength - 1)
  const clampedStep = Math.min(Math.max(0, stepIndex), maxStep)
  const isPlaying = playingAutomaton === automaton && clampedStep < maxStep
  const exampleCases = exampleCasesState?.automaton === automaton ? exampleCasesState.rows : null

  useEffect(() => {
    if (!isPlaying) return
    const timer = window.setTimeout(() => {
      const nextStep = clampedStep + 1
      onStepChange(nextStep)
      if (nextStep >= maxStep) {
        setPlayingAutomaton(null)
      }
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [isPlaying, clampedStep, maxStep, onStepChange])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPlayingAutomaton(null)
    onSimulate(inputText)
  }

  const handleRunExampleCases = () => {
    if (!example) return
    const acceptedRows: ExampleCaseRow[] = example.accepted.map((chain) => {
      const sim = simulate(automaton, chain)
      return { input: chain, expected: true, actual: sim.accepted, passed: sim.accepted }
    })
    const rejectedRows: ExampleCaseRow[] = example.rejected.map((chain) => {
      const sim = simulate(automaton, chain)
      return { input: chain, expected: false, actual: sim.accepted, passed: !sim.accepted }
    })
    setExampleCasesState({ automaton, rows: [...acceptedRows, ...rejectedRows] })
  }

  const currentTrace = result && result.trace.length > 0 ? result.trace[clampedStep] : null
  const pendingInput =
    result && currentTrace
      ? [...result.input].slice(currentTrace.configuration.position).join('') || EPSILON
      : EPSILON

  return (
    <section className="simulation-view" aria-label="Simulación de cadenas">
      <h2>Simulación paso a paso</h2>

      <form onSubmit={handleSubmit} className="simulation-form">
        <div className="field">
          <label htmlFor={inputId}>Cadena</label>
          <span id={helpId} className="hint-text">
            Escribe los símbolos seguidos; deja vacío o escribe ε para la cadena vacía.
          </span>
          <div className="input-with-button">
            <input
              id={inputId}
              name="chain"
              type="text"
              placeholder="00110011"
              value={inputText}
              onChange={(e) => onInputChange(e.target.value)}
              aria-describedby={helpId}
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
            />
            <button type="submit" className="btn-primary">
              Simular
            </button>
          </div>
        </div>
      </form>

      {result && (
        <div className="simulation-result">
          <div
            role="status"
            className={`verdict-banner ${result.accepted ? 'verdict-accepted' : 'verdict-rejected'}`}
          >
            <p className="verdict-title">
              <span aria-hidden="true">{result.accepted ? '✓ ' : '✗ '}</span>
              {result.accepted ? 'ACEPTADA' : 'RECHAZADA'}
            </p>
            <p className="verdict-reason">{result.reason}</p>
            {result.limitReached && (
              <p className="hint-text">
                Se alcanzó el límite de exploración ({result.exploredConfigurations}{' '}
                configuraciones).
              </p>
            )}
          </div>

          {currentTrace && (
            <div className="trace-panel">
              <div className="trace-controls" role="group" aria-label="Controles de la traza">
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={clampedStep === 0}
                  onClick={() => {
                    setPlayingAutomaton(null)
                    onStepChange(0)
                  }}
                >
                  Inicio
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={clampedStep === 0}
                  onClick={() => {
                    setPlayingAutomaton(null)
                    onStepChange(clampedStep - 1)
                  }}
                >
                  Anterior
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={clampedStep >= maxStep}
                  onClick={() => {
                    setPlayingAutomaton(null)
                    onStepChange(clampedStep + 1)
                  }}
                >
                  Siguiente
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={clampedStep >= maxStep}
                  onClick={() => {
                    setPlayingAutomaton(null)
                    onStepChange(maxStep)
                  }}
                >
                  Fin
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  disabled={maxStep === 0}
                  onClick={() => {
                    if (isPlaying) {
                      setPlayingAutomaton(null)
                    } else if (clampedStep >= maxStep) {
                      onStepChange(0)
                      setPlayingAutomaton(automaton)
                    } else {
                      setPlayingAutomaton(automaton)
                    }
                  }}
                >
                  {isPlaying ? 'Pausar' : 'Reproducir'}
                </button>
                <span className="step-counter">
                  Paso {clampedStep} de {maxStep}
                </span>
              </div>

              <div className="trace-state-grid">
                <div className="trace-card">
                  <span className="trace-label">Estado actual</span>
                  <strong className="trace-value mono">{currentTrace.configuration.state}</strong>
                </div>
                <div className="trace-card">
                  <span className="trace-label">Entrada pendiente</span>
                  <strong className="trace-value mono">{pendingInput}</strong>
                </div>
                <div className="trace-card">
                  <span className="trace-label">Transición aplicada</span>
                  <strong className="trace-value mono">
                    {currentTrace.transition ? formatTransition(currentTrace.transition) : 'Inicio'}
                  </strong>
                </div>
              </div>

              {currentTrace.transition && (
                <p className="transition-explanation">{currentTrace.transition.explanation}</p>
              )}

              <div className="stacks-section">
                <h3>Pilas en este paso</h3>
                <StackView
                  stackDefs={automaton.stacks}
                  contents={currentTrace.configuration.stacks}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {example && (
        <div className="example-cases-section">
          <div className="section-header">
            <h3>Casos de prueba del ejemplo</h3>
            <button type="button" className="btn-secondary" onClick={handleRunExampleCases}>
              Probar casos del ejemplo
            </button>
          </div>

          {exampleCases && (
            <div className="table-scroll">
              <table className="cases-table">
                <thead>
                  <tr>
                    <th scope="col">Cadena</th>
                    <th scope="col">Esperado</th>
                    <th scope="col">Obtenido</th>
                    <th scope="col">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {exampleCases.map((row, idx) => (
                    <tr key={`${idx}-${row.input}`}>
                      <td className="mono">{row.input === '' ? EPSILON : row.input}</td>
                      <td>{row.expected ? 'Aceptada' : 'Rechazada'}</td>
                      <td>{row.actual ? 'Aceptada' : 'Rechazada'}</td>
                      <td className={row.passed ? 'case-pass' : 'case-fail'}>
                        {row.passed ? '✓' : '✗'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
