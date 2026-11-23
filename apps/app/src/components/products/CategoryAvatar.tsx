import CableIcon from '@mui/icons-material/Cable'
import HeadphonesIcon from '@mui/icons-material/Headphones'
import LaptopMacIcon from '@mui/icons-material/LaptopMac'
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone'
import TabletMacIcon from '@mui/icons-material/TabletMac'
import WatchIcon from '@mui/icons-material/Watch'
import Avatar from '@mui/material/Avatar'
import type { SvgIconComponent } from '@mui/icons-material'
import { TONES } from '../../theme/tones'
import type { BadgeTone } from '../../theme/tones'
import type { ProductCategory } from '../../types'
import { PRODUCT_CATEGORY_LABELS } from '../../types'

const CATEGORY_LOOK: Record<ProductCategory, { Icon: SvgIconComponent; tone: BadgeTone }> = {
  IPHONE: { Icon: PhoneIphoneIcon, tone: 'blue' },
  IPAD: { Icon: TabletMacIcon, tone: 'purple' },
  MAC: { Icon: LaptopMacIcon, tone: 'gray' },
  APPLE_WATCH: { Icon: WatchIcon, tone: 'pink' },
  AUDIO: { Icon: HeadphonesIcon, tone: 'green' },
  ACESSORIOS: { Icon: CableIcon, tone: 'amber' },
}

interface CategoryAvatarProps {
  category: ProductCategory
  size?: number
}

export function CategoryAvatar({ category, size = 40 }: CategoryAvatarProps) {
  const { Icon, tone } = CATEGORY_LOOK[category]
  const { color, bg } = TONES[tone]

  return (
    <Avatar
      variant="rounded"
      aria-label={PRODUCT_CATEGORY_LABELS[category]}
      sx={{ width: size, height: size, color, bgcolor: bg, flexShrink: 0 }}
    >
      <Icon sx={{ fontSize: size / 2 }} />
    </Avatar>
  )
}
