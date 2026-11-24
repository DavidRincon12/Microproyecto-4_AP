// Tabla de transición accesible y adaptable (RF-08).
import { useId } from 'react'
import type { Automaton } from '../../core'
import { buildTransitionTable } from './transitionTable'

interface TransitionTableProps {
  readonly automaton: Automaton
}

export function TransitionTable({ automaton }: TransitionTableProps) {
  const captionId = useId()
  const model = buildTransitionTable(automaton)

  return (
    <section className="table-view" aria-label="Tabla de transición">
      <h2>Tabla de transición</h2>

      <div tabIndex={0} role="region" aria-labelledby={captionId} className="table-wrapper">
        <table className="transition-table">
          <caption id={captionId} className="visually-hidden">
            Transiciones del autómata por estado y símbolo de entrada
          </caption>
          <thead>
            <tr>
              <th scope="col">Estado</th>
              {model.columns.map((col) => (
                <th key={col} scope="col" className="mono">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {model.rows.map((row) => (
              <tr key={row.state}>
                <th scope="row" className="mono state-cell">
                  {row.label}
                </th>
                {row.cells.map((lines, cellIdx) => (
                  <td key={model.columns[cellIdx]} className="mono">
                    {lines.length === 0 ? (
                      <span className="empty-cell" aria-label="Sin transición">
                        —
                      </span>
                    ) : (
                      <ul className="cell-lines">
                        {lines.map((line, lineIdx) => (
                          <li key={lineIdx}>{line}</li>
                        ))}
                      </ul>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="table-legend">→ estado inicial, * estado de aceptación</p>
    </section>
  )
}
