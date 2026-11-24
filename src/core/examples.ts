// Ejemplos precargados: el del enunciado, el del tablero y lenguajes típicos de clase.
// Cada uno trae cadenas que deben aceptarse y otras que deben rechazarse.
import type { Example } from './types'

export const EXAMPLES: readonly Example[] = [
  {
    id: 'anbn',
    title: 'aⁿbⁿ (ejemplo del enunciado)',
    alphabet: 'a, b',
    language: '{a^n b^n | n >= 0}',
    accepted: ['', 'ab', 'aabb', 'aaabbb'],
    rejected: ['a', 'ba', 'aab', 'abab'],
  },
  {
    id: 'tablero',
    title: '(0ⁿ1ᵐ)ᵏ con k = n (ejercicio de clase)',
    alphabet: '0, 1',
    language: '{(0^n 1^m)^k | n > 0, m > 1, k = n}',
    accepted: ['011', '0111', '00110011', '0011100111', '000110001100011'],
    rejected: ['01', '0011', '011011', '0011001', '00110111'],
  },
  {
    id: 'anbmcn',
    title: 'aⁿbᵐcⁿ',
    alphabet: 'a, b, c',
    language: '{a^n b^m c^n | n >= 1, m >= 1}',
    accepted: ['abc', 'abbc', 'aabcc', 'aabbbcc'],
    rejected: ['ac', 'abcc', 'aabc', 'bc'],
  },
  {
    id: 'anbmcmdn',
    title: 'aⁿbᵐcᵐdⁿ',
    alphabet: 'a, b, c, d',
    language: '{a^n b^m c^m d^n | n, m >= 1}',
    accepted: ['abcd', 'aabcdd', 'abbccd'],
    rejected: ['abd', 'abccd', 'aabcd', 'abcdd'],
  },
  {
    id: 'anb2n',
    title: 'aⁿb²ⁿ',
    alphabet: 'a, b',
    language: '{a^n b^(2n) | n >= 0}',
    accepted: ['', 'abb', 'aabbbb'],
    rejected: ['ab', 'abbb', 'aabb', 'b'],
  },
  {
    id: 'anbncn',
    title: 'aⁿbⁿcⁿ',
    alphabet: 'a, b, c',
    language: '{a^n b^n c^n | n >= 1}',
    accepted: ['abc', 'aabbcc', 'aaabbbccc'],
    rejected: ['ab', 'aabbc', 'abcc', 'abbc', 'acb'],
  },
  {
    id: 'anbmcnm',
    title: 'aⁿbᵐcⁿ⁺ᵐ',
    alphabet: 'a, b, c',
    language: '{a^n b^m c^(n+m) | n, m >= 1}',
    accepted: ['abcc', 'aabccc', 'abbccc'],
    rejected: ['abc', 'abccc', 'aabcc', 'acc'],
  },
  {
    id: 'abncn',
    title: '(ab)ⁿcⁿ',
    alphabet: 'a, b, c',
    language: '{(ab)^n c^n | n >= 1}',
    accepted: ['abc', 'ababcc', 'abababccc'],
    rejected: ['ab', 'abcc', 'ababc', 'abac'],
  },
]
