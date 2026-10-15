import Box from '@mui/material/Box'
import { ToneChip } from './ToneChip'

interface PersonCellProps {
  name: string
  secondary: string
  anonymized: boolean
}

export function PersonCell({ name, secondary, anonymized }: PersonCellProps) {
  return (
    <Box sx={{ display: 'grid', gap: 0.25 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: 22, fontWeight: 600 }}>
        {name}
        {anonymized && <ToneChip tone="gray">Anonimizado</ToneChip>}
      </Box>
      <Box sx={{ color: 'text.disabled', fontSize: 12 }}>{secondary}</Box>
    </Box>
  )
}
