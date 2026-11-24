// Aplicación principal: coordina las entradas, las seis vistas por pestañas y el historial (RF-01 a RF-12).
import { useState } from 'react'
import { EXAMPLES, simulate } from '../core'
import type { Example, SimulationResult } from '../core'
import { FormalDefinitionView } from '../features/construction/FormalDefinitionView'
import { StepsView } from '../features/construction/StepsView'
import { StateDiagram } from '../features/diagram/StateDiagram'
import { HistoryPanel } from '../features/history/HistoryPanel'
import {
  addSimulation,
  clearHistory,
  loadHistory,
  saveConstruction,
} from '../features/history/historyStorage'
import type { HistoryEntry } from '../features/history/historyStorage'
import { InputPanel } from '../features/input/InputPanel'
import { buildFromTexts } from '../features/input/buildFromTexts'
import type { BuildState } from '../features/input/buildFromTexts'
import { SimulationPanel } from '../features/simulation/SimulationPanel'
import { TransitionTable } from '../features/table/TransitionTable.tsx'
import { Tabs } from '../shared/Tabs'
import type { TabItem } from '../shared/Tabs'

type TabId = 'pasos' | 'definicion' | 'tabla' | 'diagrama' | 'simulacion' | 'historial'

export default function App() {
  const [alphabetText, setAlphabetText] = useState('')
  const [languageText, setLanguageText] = useState('')
  const [selectedExampleId, setSelectedExampleId] = useState('')
  const [buildState, setBuildState] = useState<BuildState>({ status: 'idle' })
  const [lastBuilt, setLastBuilt] = useState<{ alphabet: string; language: string } | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('pasos')
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory())
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null)
  const [simulationInput, setSimulationInput] = useState('')
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null)
  const [simulationStep, setSimulationStep] = useState(0)

  const construction = buildState.status === 'ok' ? buildState.construction : null
  const isStale =
    construction !== null &&
    lastBuilt !== null &&
    (alphabetText !== lastBuilt.alphabet || languageText !== lastBuilt.language)

  const matchedExample =
    lastBuilt === null
      ? null
      : (EXAMPLES.find(
          (ex) =>
            ex.alphabet.trim() === lastBuilt.alphabet.trim() &&
            ex.language.trim() === lastBuilt.language.trim(),
        ) ?? null)

  const activeDiagramState =
    simulationResult && simulationResult.trace.length > 0
      ? simulationResult.trace[
          Math.min(Math.max(0, simulationStep), simulationResult.trace.length - 1)
        ]?.configuration.state
      : undefined

  const runBuild = (nextAlphabet: string, nextLanguage: string, targetTab?: TabId) => {
    const result = buildFromTexts(nextAlphabet, nextLanguage)
    setBuildState(result)
    if (result.status === 'ok') {
      setLastBuilt({ alphabet: nextAlphabet, language: nextLanguage })
      const updated = saveConstruction(nextAlphabet, nextLanguage)
      setHistory(updated)
      setActiveHistoryId(updated[0]?.id ?? null)
      setSimulationResult(null)
      setSimulationStep(0)
      if (targetTab) {
        setActiveTab(targetTab)
      }
    }
    return result
  }

  const handleSelectExample = (example: Example | null) => {
    if (!example) {
      setSelectedExampleId('')
      return
    }
    setSelectedExampleId(example.id)
    setAlphabetText(example.alphabet)
    setLanguageText(example.language)
    if (buildState.status === 'error') {
      setBuildState({ status: 'idle' })
    }
  }

  const handleSimulate = (rawInput: string) => {
    if (!construction) return
    const result = simulate(construction.automaton, rawInput)
    setSimulationResult(result)
    setSimulationStep(0)
    if (activeHistoryId) {
      setHistory(addSimulation(activeHistoryId, rawInput, result.accepted))
    }
  }

  const handleOpenHistoryEntry = (entry: HistoryEntry) => {
    setAlphabetText(entry.alphabetText)
    setLanguageText(entry.languageText)
    const matchingExample = EXAMPLES.find(
      (ex) =>
        ex.alphabet.trim() === entry.alphabetText.trim() &&
        ex.language.trim() === entry.languageText.trim(),
    )
    setSelectedExampleId(matchingExample?.id ?? '')
    runBuild(entry.alphabetText, entry.languageText, 'pasos')
  }

  const handleSimulateHistoryChain = (entry: HistoryEntry, rawInput: string) => {
    setAlphabetText(entry.alphabetText)
    setLanguageText(entry.languageText)
    const matchingExample = EXAMPLES.find(
      (ex) =>
        ex.alphabet.trim() === entry.alphabetText.trim() &&
        ex.language.trim() === entry.languageText.trim(),
    )
    setSelectedExampleId(matchingExample?.id ?? '')

    const built = runBuild(entry.alphabetText, entry.languageText, 'simulacion')
    if (built.status === 'ok') {
      setSimulationInput(rawInput)
      const sim = simulate(built.construction.automaton, rawInput)
      setSimulationResult(sim)
      setSimulationStep(0)
      setHistory(addSimulation(entry.id, rawInput, sim.accepted))
    }
  }

  const handleClearHistory = () => {
    clearHistory()
    setHistory([])
    setActiveHistoryId(null)
  }

  const tabs: TabItem[] = [
    {
      id: 'pasos',
      label: 'Pasos',
      content: construction ? (
        <StepsView construction={construction} />
      ) : (
        <p className="empty-state">Construye un autómata para ver los pasos de construcción.</p>
      ),
    },
    {
      id: 'definicion',
      label: 'Definición formal',
      content: construction ? (
        <FormalDefinitionView automaton={construction.automaton} />
      ) : (
        <p className="empty-state">Construye un autómata para ver la definición formal.</p>
      ),
    },
    {
      id: 'tabla',
      label: 'Tabla',
      content: construction ? (
        <TransitionTable automaton={construction.automaton} />
      ) : (
        <p className="empty-state">Construye un autómata para ver la tabla de transición.</p>
      ),
    },
    {
      id: 'diagrama',
      label: 'Diagrama',
      content: construction ? (
        <StateDiagram automaton={construction.automaton} activeState={activeDiagramState} />
      ) : (
        <p className="empty-state">Construye un autómata para ver el diagrama de transición.</p>
      ),
    },
    {
      id: 'simulacion',
      label: 'Simulación',
      content: construction ? (
        <SimulationPanel
          automaton={construction.automaton}
          example={matchedExample}
          inputText={simulationInput}
          result={simulationResult}
          stepIndex={simulationStep}
          onInputChange={setSimulationInput}
          onSimulate={handleSimulate}
          onStepChange={setSimulationStep}
        />
      ) : (
        <p className="empty-state">Construye un autómata para simular cadenas.</p>
      ),
    },
    {
      id: 'historial',
      label: 'Historial',
      content: (
        <HistoryPanel
          entries={history}
          onOpenEntry={handleOpenHistoryEntry}
          onSimulateAgain={handleSimulateHistoryChain}
          onClearHistory={handleClearHistory}
        />
      ),
    },
  ]

  return (
    <main className="app">
      <header className="app-header">
        <h1>Autómatas con pilas</h1>
        <p className="app-subtitle">
          Construcción paso a paso, definición formal, tabla, diagrama y simulación de cadenas a
          partir de un alfabeto Σ y un lenguaje L.
        </p>
      </header>

      <InputPanel
        alphabetText={alphabetText}
        languageText={languageText}
        selectedExampleId={selectedExampleId}
        buildState={buildState}
        isStale={isStale}
        onAlphabetChange={(value) => {
          setAlphabetText(value)
          setSelectedExampleId('')
        }}
        onLanguageChange={(value) => {
          setLanguageText(value)
          setSelectedExampleId('')
        }}
        onSelectExample={handleSelectExample}
        onBuild={() => runBuild(alphabetText, languageText)}
      />

      <section className="workspace" aria-label="Resultados del autómata">
        <Tabs
          tabs={tabs}
          activeId={activeTab}
          onChange={(id) => setActiveTab(id as TabId)}
          label="Vistas del autómata"
        />
      </section>
    </main>
  )
}
