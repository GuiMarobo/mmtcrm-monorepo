import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CategoryAvatar } from './CategoryAvatar'
import type { ProductCategory } from '../../types'

describe('CategoryAvatar', () => {
  it.each<[ProductCategory, string]>([
    ['IPHONE', 'PhoneIphoneIcon'],
    ['IPAD', 'TabletMacIcon'],
    ['MAC', 'LaptopMacIcon'],
    ['APPLE_WATCH', 'WatchIcon'],
    ['AUDIO', 'HeadphonesIcon'],
    ['ACESSORIOS', 'CableIcon'],
  ])('%s mostra o ícone %s', (category, icon) => {
    render(<CategoryAvatar category={category} />)

    expect(screen.getByTestId(icon)).toBeInTheDocument()
  })

  it('tem 40px por padrão e aceita outro tamanho', () => {
    const { rerender } = render(<CategoryAvatar category="MAC" />)
    expect(screen.getByLabelText('Mac')).toHaveStyle({ width: '40px', height: '40px' })

    rerender(<CategoryAvatar category="MAC" size={64} />)
    expect(screen.getByLabelText('Mac')).toHaveStyle({ width: '64px', height: '64px' })
  })

  it('cada categoria tem o seu tom', () => {
    render(
      <>
        <CategoryAvatar category="IPHONE" />
        <CategoryAvatar category="AUDIO" />
      </>,
    )

    const iphone = getComputedStyle(screen.getByLabelText('iPhone')).backgroundColor
    const audio = getComputedStyle(screen.getByLabelText('Áudio')).backgroundColor
    expect(iphone).not.toBe(audio)
  })
})
