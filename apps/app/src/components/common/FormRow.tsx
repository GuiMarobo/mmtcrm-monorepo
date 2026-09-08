import Box from '@mui/material/Box'
import type { ReactNode } from 'react'

export function FormRow({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        columnGap: 2,
        rowGap: { xs: 1.25, sm: 0 },
        alignItems: 'start',
      }}
    >
      {children}
    </Box>
  )
}
