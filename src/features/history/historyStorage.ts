// Lectura y escritura defensiva del historial de construcciones y simulaciones en localStorage (RF-12).
export const HISTORY_STORAGE_KEY = 'automatas-pila:historial'
export const MAX_HISTORY_ENTRIES = 20

export interface HistorySimulation {
  readonly input: string
  readonly accepted: boolean
}

export interface HistoryEntry {
  readonly id: string
  readonly savedAt: string
  readonly alphabetText: string
  readonly languageText: string
  readonly simulations: readonly HistorySimulation[]
}

function isValidSimulation(value: unknown): value is HistorySimulation {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return typeof record.input === 'string' && typeof record.accepted === 'boolean'
}

function isValidEntry(value: unknown): value is HistoryEntry {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  if (
    typeof record.id !== 'string' ||
    typeof record.savedAt !== 'string' ||
    typeof record.alphabetText !== 'string' ||
    typeof record.languageText !== 'string' ||
    !Array.isArray(record.simulations)
  ) {
    return false
  }
  return record.simulations.every(isValidSimulation)
}

function persistHistory(entries: readonly HistoryEntry[], storage: Storage): void {
  try {
    storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // Se ignora si el almacenamiento está lleno o bloqueado por el navegador.
  }
}

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `hist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function loadHistory(storage: Storage = localStorage): HistoryEntry[] {
  try {
    const raw = storage.getItem(HISTORY_STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isValidEntry).slice(0, MAX_HISTORY_ENTRIES)
  } catch {
    return []
  }
}

export function saveConstruction(
  alphabetText: string,
  languageText: string,
  storage: Storage = localStorage,
): HistoryEntry[] {
  const current = loadHistory(storage)
  const existing = current.find(
    (entry) => entry.alphabetText === alphabetText && entry.languageText === languageText,
  )

  const updatedEntry: HistoryEntry = existing
    ? {
        ...existing,
        savedAt: new Date().toISOString(),
      }
    : {
        id: createId(),
        savedAt: new Date().toISOString(),
        alphabetText,
        languageText,
        simulations: [],
      }

  const remaining = current.filter((entry) => entry.id !== updatedEntry.id)
  const next = [updatedEntry, ...remaining].slice(0, MAX_HISTORY_ENTRIES)
  persistHistory(next, storage)
  return next
}

export function addSimulation(
  id: string,
  input: string,
  accepted: boolean,
  storage: Storage = localStorage,
): HistoryEntry[] {
  const current = loadHistory(storage)
  const next = current.map((entry) => {
    if (entry.id !== id) return entry
    const filtered = entry.simulations.filter((sim) => sim.input !== input)
    return {
      ...entry,
      simulations: [{ input, accepted }, ...filtered],
    }
  })
  persistHistory(next, storage)
  return next
}

export function clearHistory(storage: Storage = localStorage): void {
  try {
    storage.removeItem(HISTORY_STORAGE_KEY)
  } catch {
    // Se ignora si el almacenamiento no permite borrar.
  }
}
