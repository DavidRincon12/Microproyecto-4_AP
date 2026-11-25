// Vista de la definición formal del autómata resultante (RF-07).
import { formalDefinition } from '../../core'
import type { Automaton } from '../../core'

interface FormalDefinitionViewProps {
  readonly automaton: Automaton
}

export function FormalDefinitionView({ automaton }: FormalDefinitionViewProps) {
  const def = formalDefinition(automaton)

  return (
    <section className="formal-view" aria-label="Definición formal del autómata">
      <h2 className="mono">{def.tuple}</h2>

      <dl className="formal-list">
        <div className="formal-row">
          <dt>Conjunto de estados (Q)</dt>
          <dd className="mono">{def.states}</dd>
        </div>
        <div className="formal-row">
          <dt>Alfabeto de entrada (Σ)</dt>
          <dd className="mono">{def.inputAlphabet}</dd>
        </div>
        {def.stacks.map((stack) => (
          <div key={stack.name} className="formal-row">
            <dt>
              Pila <span className="mono">{stack.name}</span> (fondo{' '}
              <span className="mono">{stack.bottom}</span>)
            </dt>
            <dd className="mono">{stack.alphabet}</dd>
          </div>
        ))}
        <div className="formal-row">
          <dt>Alfabeto de pila (Γ)</dt>
          <dd className="mono">{def.stackAlphabet}</dd>
        </div>
        <div className="formal-row">
          <dt>Estado inicial (q₀)</dt>
          <dd className="mono">{def.initialState}</dd>
        </div>
        <div className="formal-row">
          <dt>Fondos iniciales</dt>
          <dd className="mono">{def.bottoms}</dd>
        </div>
        <div className="formal-row">
          <dt>Estados de aceptación (F)</dt>
          <dd className="mono">{def.finals}</dd>
        </div>
      </dl>

      <div className="formal-delta">
        <h3>Función de transición (δ)</h3>
        <ul className="delta-list mono">
          {def.transitions.map((line, index) => (
            <li key={index}>{line}</li>
          ))}
        </ul>
      </div>

      <p className="acceptance-box">
        <strong>Criterio de aceptación:</strong> {def.acceptance}
      </p>
    </section>
  )
}
