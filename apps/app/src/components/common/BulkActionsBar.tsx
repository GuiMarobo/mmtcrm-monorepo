import CloseIcon from '@mui/icons-material/Close'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'

export interface BulkAction {
  key: string
  label: string
  icon?: ReactNode
  danger?: boolean
  onClick: () => void
}

interface BulkActionsBarProps {
  count: number
  actions: BulkAction[]
  onClear: () => void
}

export function BulkActionsBar({ count, actions, onClear }: BulkActionsBarProps) {
  return (
    <Paper
      role="region"
      aria-label="Ações em massa"
      elevation={8}
      sx={{
        position: 'absolute',
        left: '50%',
        bottom: (theme) => theme.spacing(1),
        transform: 'translateX(-50%)',
        zIndex: (theme) => theme.zIndex.appBar,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 2,
        py: 1,
        maxWidth: (theme) => `calc(100% - ${theme.spacing(2)})`,
        flexWrap: 'wrap',
        borderRadius: 3,
      }}
    >
      <Typography
        variant="subtitle1"
        role="status"
        aria-live="polite"
        sx={{ whiteSpace: 'nowrap', pr: 1 }}
      >
        {count === 1 ? '1 selecionado' : `${count} selecionados`}
      </Typography>
      <Divider orientation="vertical" flexItem />
      {actions.map((action) => (
        <Button
          key={action.key}
          size="small"
          color={action.danger ? 'error' : 'inherit'}
          startIcon={action.icon}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      ))}
      <IconButton size="small" aria-label="Limpar seleção" onClick={onClear}>
        <CloseIcon fontSize="small" />
      </IconButton>
    </Paper>
  )
}
