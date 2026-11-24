// Visualización de las pilas del autómata (de fondo a tope) en cada paso de la simulación (RF-10).
import type { StackContents, StackDef } from '../../core'

interface StackViewProps {
  readonly stackDefs: readonly StackDef[]
  readonly contents: StackContents
}

export function StackView({ stackDefs, contents }: StackViewProps) {
  if (stackDefs.length === 0) {
    return <p className="hint-text">Este autómata no requiere pilas auxiliares ni de conteo.</p>
  }

  return (
    <div className="stacks-grid" role="group" aria-label="Contenido de las pilas">
      {stackDefs.map((stack) => {
        const items = contents[stack.name] ?? []
        return (
          <div key={stack.name} className="stack-column">
            <div className="stack-title mono">{stack.name}</div>
            {items.length === 0 ? (
              <div className="stack-empty">vacía</div>
            ) : (
              <div
                className="stack-boxes"
                aria-label={`Pila ${stack.name}, tope ${items[items.length - 1]}`}
              >
                {items.map((symbol, index) => (
                  <div
                    key={`${index}-${symbol}`}
                    className={`stack-cell mono${index === items.length - 1 ? ' stack-top' : ''}`}
                  >
                    {symbol}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
