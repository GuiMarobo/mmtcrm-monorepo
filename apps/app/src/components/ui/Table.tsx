import Paper from '@mui/material/Paper'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import type { ReactNode } from 'react'

export function TableCard({ children }: { children: ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ boxShadow: 'none', overflow: 'visible' }}>
      {children}
    </Paper>
  )
}

export function TableToolbar({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        p: '14px 16px',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      {children}
    </Box>
  )
}

export function TableError({ children }: { children: ReactNode }) {
  return (
    <Alert severity="error" square sx={{ borderRadius: 0 }}>
      {children}
    </Alert>
  )
}

export function TableEmpty({
  colSpan,
  children,
}: {
  colSpan: number
  children: ReactNode
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="table-empty">
        {children}
      </td>
    </tr>
  )
}

export function TableResult({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        p: '12px 16px',
        borderTop: 1,
        borderColor: 'divider',
        color: 'text.disabled',
        fontSize: 12.5,
      }}
    >
      {children}
    </Box>
  )
}
