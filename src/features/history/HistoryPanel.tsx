// Panel para consultar, reabrir y volver a simular construcciones guardadas (RF-12).
import { EPSILON } from '../../core'
import type { HistoryEntry } from './historyStorage'

interface HistoryPanelProps {
  readonly entries: readonly HistoryEntry[]
  readonly onOpenEntry: (entry: HistoryEntry) => void
  readonly onSimulateAgain: (entry: HistoryEntry, input: string) => void
  readonly onClearHistory: () => void
}

function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('es-CO', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

export function HistoryPanel({
  entries,
  onOpenEntry,
  onSimulateAgain,
  onClearHistory,
}: HistoryPanelProps) {
  return (
    <section className="history-view" aria-label="Historial de construcciones">
      <div className="section-header">
        <h2>Historial guardado</h2>
        {entries.length > 0 && (
          <button type="button" className="btn-secondary" onClick={onClearHistory}>
            Borrar historial
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="empty-state">
          Aún no hay construcciones guardadas. Construye un autómata para guardarlo aquí
          automáticamente.
        </p>
      ) : (
        <ul className="history-list">
          {entries.map((entry) => (
            <li key={entry.id} className="history-card">
              <div className="history-card-top">
                <div className="history-meta">
                  <p className="history-date">{formatDate(entry.savedAt)}</p>
                  <p className="mono">
                    <strong>Σ:</strong> {entry.alphabetText}
                  </p>
                  <p className="mono">
                    <strong>L:</strong> {entry.languageText}
                  </p>
                  <p className="hint-text">
                    {entry.simulations.length}{' '}
                    {entry.simulations.length === 1 ? 'cadena simulada' : 'cadenas simuladas'}
                  </p>
                </div>

                <button type="button" className="btn-primary" onClick={() => onOpenEntry(entry)}>
                  Abrir
                </button>
              </div>

              {entry.simulations.length > 0 && (
                <div className="history-simulations">
                  <p className="hint-text">Cadenas probadas:</p>
                  <ul className="sim-chips">
                    {entry.simulations.map((sim) => (
                      <li key={sim.input} className="sim-chip">
                        <span className="mono">
                          {sim.input === '' ? EPSILON : sim.input} (
                          {sim.accepted ? '✓ Aceptada' : '✗ Rechazada'})
                        </span>
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={() => onSimulateAgain(entry, sim.input)}
                        >
                          Simular otra vez
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
