import { beforeEach, describe, expect, it } from 'vitest'
import {
  HISTORY_STORAGE_KEY,
  MAX_HISTORY_ENTRIES,
  addSimulation,
  clearHistory,
  loadHistory,
  saveConstruction,
} from './historyStorage'

describe('historyStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('guarda y lee construcciones y simulaciones', () => {
    const afterSave = saveConstruction('a, b', '{a^n b^n | n >= 0}')
    expect(afterSave).toHaveLength(1)

    const id = afterSave[0].id
    const afterSim = addSimulation(id, 'aabb', true)
    expect(afterSim[0].simulations).toEqual([{ input: 'aabb', accepted: true }])

    const loaded = loadHistory()
    expect(loaded).toHaveLength(1)
    expect(loaded[0].alphabetText).toBe('a, b')
    expect(loaded[0].simulations[0]).toEqual({ input: 'aabb', accepted: true })
  })

  it('mantiene un máximo de 20 entradas sacando la más vieja', () => {
    for (let i = 1; i <= 25; i++) {
      saveConstruction('a', `{a^${i}}`)
    }
    const loaded = loadHistory()
    expect(loaded).toHaveLength(MAX_HISTORY_ENTRIES)
    expect(loaded[0].languageText).toBe('{a^25}')
    expect(loaded.some((e) => e.languageText === '{a^1}')).toBe(false)
  })

  it('actualiza la entrada existente en vez de duplicar la misma pareja Σ y L', () => {
    const first = saveConstruction('0, 1', '{0^n 1^n}')
    addSimulation(first[0].id, '01', true)

    const second = saveConstruction('0, 1', '{0^n 1^n}')
    expect(second).toHaveLength(1)
    expect(second[0].id).toBe(first[0].id)
    expect(second[0].simulations).toEqual([{ input: '01', accepted: true }])
  })

  it('devuelve un arreglo vacío si el JSON está dañado o tiene forma inválida', () => {
    localStorage.setItem(HISTORY_STORAGE_KEY, '{dañado')
    expect(loadHistory()).toEqual([])

    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([{ malo: true }]))
    expect(loadHistory()).toEqual([])
  })

  it('borra el historial completo con clearHistory', () => {
    saveConstruction('a', '{a^n}')
    expect(loadHistory()).toHaveLength(1)
    clearHistory()
    expect(loadHistory()).toEqual([])
  })
})
