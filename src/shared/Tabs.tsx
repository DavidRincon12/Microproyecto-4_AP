// Pestañas accesibles según el patrón WAI-ARIA (clic y navegación por teclado).
import { useId, useRef } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'

export interface TabItem {
  readonly id: string
  readonly label: string
  readonly content: ReactNode
}

interface TabsProps {
  readonly tabs: readonly TabItem[]
  readonly activeId: string
  readonly onChange: (id: string) => void
  readonly label: string
}

export function Tabs({ tabs, activeId, onChange, label }: TabsProps) {
  const baseId = useId()
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  const selectTab = (index: number) => {
    const next = tabs[index]
    if (!next) return
    onChange(next.id)
    const button = buttonRefs.current.get(next.id)
    button?.focus()
    if (button && typeof button.scrollIntoView === 'function') {
      button.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    if (tabs.length === 0) return
    let nextIndex: number | null = null
    if (event.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % tabs.length
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = tabs.length - 1
    }

    if (nextIndex !== null) {
      event.preventDefault()
      selectTab(nextIndex)
    }
  }

  return (
    <div className="tabs">
      <div role="tablist" aria-label={label} className="tabs-list">
        {tabs.map((tab, index) => {
          const isSelected = tab.id === activeId
          const tabId = `${baseId}-tab-${tab.id}`
          return (
            <button
              key={tab.id}
              ref={(el) => {
                if (el) {
                  buttonRefs.current.set(tab.id, el)
                } else {
                  buttonRefs.current.delete(tab.id)
                }
              }}
              id={tabId}
              type="button"
              role="tab"
              aria-selected={isSelected}
              tabIndex={isSelected ? 0 : -1}
              className="tab-button"
              onClick={() => onChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {tabs.map((tab) => {
        const isSelected = tab.id === activeId
        const tabId = `${baseId}-tab-${tab.id}`
        return (
          <div
            key={tab.id}
            role="tabpanel"
            aria-labelledby={tabId}
            hidden={!isSelected}
            tabIndex={isSelected ? 0 : undefined}
            className="tab-panel"
          >
            <div className="tab-panel-body">{tab.content}</div>
          </div>
        )
      })}
    </div>
  )
}
