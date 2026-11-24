// Acumula estados, transiciones y pasos en el orden en que se crean.
// Toda transición nace dentro de un paso abierto, así cada una queda explicada una sola vez.
import type { ConstructionStep, StackName, StackOp, State, StateId, Transition } from '../types'

interface OpenStep {
  title: string
  explanation: string
  states: StateId[]
  transitions: string[]
  stacks: StackName[]
}

export class AutomatonBuilder {
  readonly states: State[] = []
  readonly transitions: Transition[] = []
  readonly steps: ConstructionStep[] = []
  private open: OpenStep | null = null

  step(title: string, explanation: string, stacks: readonly StackName[] = []): void {
    this.close()
    this.open = { title, explanation, states: [], transitions: [], stacks: [...stacks] }
  }

  close(): void {
    if (this.open) this.steps.push(this.open)
    this.open = null
  }

  state(description: string): StateId {
    const id = `q${this.states.length}`
    this.states.push({ id, description })
    this.current().states.push(id)
    return id
  }

  /** Agrega a la descripción de un estado lo que pasa en él desde la pieza actual. */
  describe(id: StateId, extra: string): void {
    const index = this.states.findIndex((s) => s.id === id)
    const state = this.states[index]
    this.states[index] = { ...state, description: `${state.description} ${extra}` }
  }

  add(
    from: StateId,
    to: StateId,
    input: string | null,
    ops: readonly StackOp[],
    explanation: string,
  ): string {
    const id = `t${this.transitions.length}`
    this.transitions.push({ id, from, to, input, ops, explanation })
    this.current().transitions.push(id)
    return id
  }

  private current(): OpenStep {
    if (!this.open) throw new Error('Toda transición o estado debe crearse dentro de un paso.')
    return this.open
  }
}
