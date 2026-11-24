// Autómata de aⁿbⁿ (n ≥ 0) armado a mano, igual al de la sección 7.5 del diseño.
// Sirve para probar el simulador sin depender de la construcción.
import type { Automaton } from '../types'

export const anbnAutomaton: Automaton = {
  states: [
    { id: 'q0', description: 'Estado inicial.' },
    { id: 'q1', description: 'Lee las a y las cuenta en X.' },
    { id: 'q2', description: 'Lee las b y descuenta una X por cada una.' },
    { id: 'q3', description: 'Aceptación.' },
  ],
  initial: 'q0',
  finals: ['q3'],
  inputAlphabet: ['a', 'b'],
  stacks: [{ name: 'X', token: 'X', bottom: 'X₀', purpose: 'Cuenta n.' }],
  transitions: [
    {
      id: 't0',
      from: 'q0',
      to: 'q1',
      input: null,
      ops: [{ stack: 'X', top: null, push: ['X₀'] }],
      explanation: '',
    },
    {
      id: 't1',
      from: 'q1',
      to: 'q1',
      input: 'a',
      ops: [{ stack: 'X', top: 'X₀', push: ['X₀', 'X'] }],
      explanation: '',
    },
    {
      id: 't2',
      from: 'q1',
      to: 'q1',
      input: 'a',
      ops: [{ stack: 'X', top: 'X', push: ['X', 'X'] }],
      explanation: '',
    },
    { id: 't3', from: 'q1', to: 'q2', input: null, ops: [], explanation: '' },
    {
      id: 't4',
      from: 'q2',
      to: 'q2',
      input: 'b',
      ops: [{ stack: 'X', top: 'X', push: [] }],
      explanation: '',
    },
    {
      id: 't5',
      from: 'q2',
      to: 'q3',
      input: null,
      ops: [{ stack: 'X', top: 'X₀', push: ['X₀'] }],
      explanation: '',
    },
  ],
}
