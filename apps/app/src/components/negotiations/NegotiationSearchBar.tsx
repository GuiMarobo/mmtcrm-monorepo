import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { SearchField } from '../common/SearchField'

interface NegotiationSearchBarProps {
  query: string
  onChange: (query: string) => void
  found: number
  total: number
}

export function NegotiationSearchBar({ query, onChange, found, total }: NegotiationSearchBarProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.25, mb: 2 }}>
      <SearchField
        value={query}
        onChange={onChange}
        placeholder="Buscar por cliente, vendedor ou pedido…"
      />
      {query.trim() !== '' && (
        <Typography role="status" sx={{ fontSize: 12.5, color: 'text.secondary' }}>
          {found} de {total} negociações
        </Typography>
      )}
    </Box>
  )
}
