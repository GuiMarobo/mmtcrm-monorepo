import type { NegotiationStatus } from '../../types'

export const ALLOWED_TRANSITIONS: Record<
  NegotiationStatus,
  NegotiationStatus[]
> = {
  ABERTA: ['GANHA', 'PERDIDA'],
  GANHA: ['ABERTA'],
  PERDIDA: ['ABERTA'],
}

export function canTransition(
  from: NegotiationStatus,
  to: NegotiationStatus,
): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to)
}

export const TRANSITION_REFUSAL =
  'Reabra a negociação antes de mudá-la para esta situação.'
