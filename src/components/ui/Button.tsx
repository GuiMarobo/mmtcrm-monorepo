import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'default' | 'primary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: 'md' | 'sm'
  icon?: ReactNode
}

const VARIANT_CLASS: Record<Variant, string> = {
  default: '',
  primary: 'primary',
  ghost: 'ghost',
  danger: 'danger',
}

export function Button({
  variant = 'default',
  size = 'md',
  icon,
  children,
  className = '',
  ...rest
}: ButtonProps) {
  const classes = ['btn', VARIANT_CLASS[variant], size === 'sm' ? 'sm' : '', className]
    .filter(Boolean)
    .join(' ')
  return (
    <button className={classes} {...rest}>
      {icon}
      {children != null && <span>{children}</span>}
    </button>
  )
}
