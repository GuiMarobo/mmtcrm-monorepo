import MuiButton from '@mui/material/Button'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'default' | 'primary' | 'ghost' | 'danger' | 'destructive'

interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  variant?: Variant
  size?: 'md' | 'sm'
  icon?: ReactNode
}

const MUI_VARIANT = {
  default: 'outlined',
  primary: 'contained',
  ghost: 'text',
  danger: 'text',
  destructive: 'contained',
} as const

const MUI_COLOR = {
  default: 'inherit',
  primary: 'primary',
  ghost: 'inherit',
  danger: 'error',
  destructive: 'error',
} as const

export function Button({
  variant = 'default',
  size = 'md',
  icon,
  children,
  className,
  ...rest
}: ButtonProps) {
  return (
    <MuiButton
      variant={MUI_VARIANT[variant]}
      color={MUI_COLOR[variant]}
      size={size === 'sm' ? 'small' : 'medium'}
      startIcon={icon}
      className={className}
      {...rest}
    >
      {children}
    </MuiButton>
  )
}
