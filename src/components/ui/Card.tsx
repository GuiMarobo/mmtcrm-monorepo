import Paper from '@mui/material/Paper'
import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  pad?: boolean
}

export function Card({ pad = false, className, children, ...rest }: CardProps) {
  return (
    <Paper
      variant="outlined"
      className={className}
      sx={{ boxShadow: 'none', p: pad ? '18px 20px' : 0 }}
      {...rest}
    >
      {children}
    </Paper>
  )
}
