import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'center' },
        gap: 2,
        mb: 2.5,
      }}
    >
      <Box>
        <Typography component="h1" variant="h5" sx={{ fontSize: { xs: 19, sm: 22 } }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography sx={{ fontSize: 13, color: 'text.disabled', mt: '2px' }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && (
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            flexWrap: 'wrap',
            ml: { sm: 'auto' },
            '& > *': { flex: { xs: '1 1 auto', sm: '0 0 auto' } },
          }}
        >
          {actions}
        </Box>
      )}
    </Box>
  )
}
