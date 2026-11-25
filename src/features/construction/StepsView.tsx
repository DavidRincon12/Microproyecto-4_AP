// Vista paso a paso de la construcción del autómata a pila (RF-06).
import { useState } from 'react'
import { formatTransition } from '../../core'
import type { Construction } from '../../core'

interface StepsViewProps {
  readonly construction: Construction
}

export function StepsView({ construction }: StepsViewProps) {
  const { automaton, steps } = construction
  const [collapsedSteps, setCollapsedSteps] = useState<ReadonlySet<number>>(() => new Set())

  const stateMap = new Map(automaton.states.map((s) => [s.id, s]))
  const transitionMap = new Map(automaton.transitions.map((t) => [t.id, t]))
  const stackMap = new Map(automaton.stacks.map((s) => [s.name, s]))

  const toggleStep = (index: number) => {
    setCollapsedSteps((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const allCollapsed = collapsedSteps.size === steps.length && steps.length > 0

  const toggleAll = () => {
    if (allCollapsed) {
      setCollapsedSteps(new Set())
    } else {
      setCollapsedSteps(new Set(steps.map((_, idx) => idx)))
    }
  }

  return (
    <section className="steps-view" aria-label="Pasos de construcción">
      <div className="section-header">
        <h2>Construcción paso a paso</h2>
        <button type="button" className="btn-secondary" onClick={toggleAll}>
          {allCollapsed ? 'Expandir todos' : 'Contraer todos'}
        </button>
      </div>

      <ol className="steps-list">
        {steps.map((step, index) => {
          const isExpanded = !collapsedSteps.has(index)
          const stepNumber = index + 1

          return (
            <li key={`${stepNumber}-${step.title}`} className="step-card">
              <div className="step-header">
                <h3>
                  Paso {stepNumber}: {step.title}
                </h3>
                <button
                  type="button"
                  className="btn-ghost"
                  aria-expanded={isExpanded}
                  onClick={() => toggleStep(index)}
                >
                  {isExpanded ? 'Contraer' : 'Expandir'}
                </button>
              </div>

              {isExpanded && (
                <div className="step-body">
                  <div className="step-explanation">
                    {step.explanation.split('\n').map((line, lineIdx) => (
                      <p key={lineIdx}>{line}</p>
                    ))}
                  </div>

                  {step.stacks.length > 0 && (
                    <div className="step-subsection">
                      <h4>Pilas creadas</h4>
                      <ul className="detail-list">
                        {step.stacks.map((stackName) => {
                          const stackDef = stackMap.get(stackName)
                          return (
                            <li key={stackName}>
                              <strong className="mono">{stackName}</strong>
                              {stackDef
                                ? ` (fondo ${stackDef.bottom}, marca ${stackDef.token}): ${stackDef.purpose}`
                                : ''}
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}

                  {step.states.length > 0 && (
                    <div className="step-subsection">
                      <h4>Estados creados</h4>
                      <ul className="detail-list">
                        {step.states.map((stateId) => {
                          const stateDef = stateMap.get(stateId)
                          return (
                            <li key={stateId}>
                              <strong className="mono">{stateId}</strong>
                              {stateDef ? `: ${stateDef.description}` : ''}
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}

                  {step.transitions.length > 0 && (
                    <div className="step-subsection">
                      <h4>Transiciones creadas</h4>
                      <ul className="transitions-step-list">
                        {step.transitions.map((trId) => {
                          const transition = transitionMap.get(trId)
                          if (!transition) return null
                          return (
                            <li key={trId} className="transition-step-item">
                              <p className="mono transition-signature">
                                {transition.from} → {transition.to}: {formatTransition(transition)}
                              </p>
                              <p className="transition-explanation">{transition.explanation}</p>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
