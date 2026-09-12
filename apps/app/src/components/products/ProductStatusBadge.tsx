import { ToneChip } from '../common/ToneChip'
import type { BadgeTone } from '../../theme/tones'
import type { ProductStatus } from '../../types'
import { PRODUCT_STATUS_LABELS } from '../../types'

const PRODUCT_TONE: Record<ProductStatus, BadgeTone> = {
  ATIVO: 'green',
  INATIVO: 'gray',
}

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  return <ToneChip tone={PRODUCT_TONE[status]}>{PRODUCT_STATUS_LABELS[status]}</ToneChip>
}
