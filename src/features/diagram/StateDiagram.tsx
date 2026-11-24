// Renderiza el diagrama de transición con Graphviz compilado a WebAssembly (RF-09).
import { instance } from '@viz-js/viz'
import { useEffect, useRef, useState } from 'react'
import type { Automaton } from '../../core'
import { toDot } from './toDot'

interface StateDiagramProps {
  readonly automaton: Automaton
  readonly activeState?: string
}

export function StateDiagram({ automaton, activeState }: StateDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [renderedDot, setRenderedDot] = useState<string | null>(null)
  const [errorState, setErrorState] = useState<{ dot: string; message: string } | null>(null)
  const dot = toDot(automaton, activeState)

  const hasSvg = renderedDot === dot
  const renderError = errorState?.dot === dot ? errorState.message : null

  useEffect(() => {
    let cancelled = false

    instance()
      .then((viz) => {
        if (cancelled || !containerRef.current) return
        const svg = viz.renderSVGElement(dot)
        containerRef.current.replaceChildren(svg)
        setRenderedDot(dot)
        setErrorState(null)
      })
      .catch(() => {
        if (cancelled) return
        setErrorState({
          dot,
          message: 'No se pudo renderizar el diagrama en este navegador.',
        })
      })

    return () => {
      cancelled = true
    }
  }, [dot])

  const handleDownloadSvg = () => {
    const svg = containerRef.current?.querySelector('svg')
    if (!svg) return
    const serializer = new XMLSerializer()
    const source = serializer.serializeToString(svg)
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'automata-pila.svg'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="diagram-view" aria-label="Diagrama de transición">
      <div className="section-header">
        <h2>Diagrama de transición</h2>
        {hasSvg && (
          <button type="button" className="btn-secondary" onClick={handleDownloadSvg}>
            Descargar SVG
          </button>
        )}
      </div>

      {renderError && (
        <p role="alert" className="error-msg">
          <span aria-hidden="true">⚠ </span>
          {renderError}
        </p>
      )}

      <div ref={containerRef} role="img" aria-label="Diagrama de transición" className="diagram" />

      <p className="table-legend">
        Flecha de entrada: estado inicial ({automaton.initial}). Doble círculo: estado de aceptación
        ({automaton.finals.join(', ')}).
      </p>
    </section>
  )
}
