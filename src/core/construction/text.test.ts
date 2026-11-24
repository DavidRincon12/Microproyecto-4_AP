import { describe, expect, it } from 'vitest'
import { andList, symbolCount } from './text'

describe('symbolCount', () => {
  it('usa singular y plural según la cantidad', () => {
    expect(symbolCount(1, '0')).toBe('1 símbolo 0')
    expect(symbolCount(2, 'a')).toBe('2 símbolos a')
  })
})

describe('andList', () => {
  it('une con comas y con «y»', () => {
    expect(andList(['X'])).toBe('X')
    expect(andList(['X', 'Z'])).toBe('X y Z')
    expect(andList(['X', 'Z', 'W'])).toBe('X, Z y W')
  })

  it('usa «e» antes de una palabra que suena a i', () => {
    expect(andList(['X', 'Y'])).toBe('X e Y')
    expect(andList(['otra X', 'otra Y'])).toBe('otra X y otra Y')
  })
})
