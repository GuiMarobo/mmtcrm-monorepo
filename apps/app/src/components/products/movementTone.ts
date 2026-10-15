import type { BadgeTone } from '../../theme/tones'
import type { StockMovementType } from '../../types'

export const MOVEMENT_TONE: Record<StockMovementType, BadgeTone> = {
  ENTRADA: 'green',
  SAIDA: 'amber',
}
