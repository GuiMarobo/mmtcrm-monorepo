import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { formatCurrency } from '../../utils/format'
import type { AmountDueSummary } from './amountDue'

export function AmountDueLines({ summary }: { summary: AmountDueSummary }) {
  const rows: [string, number][] = [
    ['Total da negociação', summary.totalValue],
    ['Total das trocas', summary.tradeInTotal],
    ['Saldo a pagar', summary.amountDue],
  ]

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
      {rows.map(([label, value], index) => {
        const last = index === rows.length - 1
        return (
          <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            <Typography sx={{ fontSize: 13, fontWeight: last ? 600 : 400 }}>{label}</Typography>
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: last ? 700 : 400,
                color: last && summary.negative ? 'error.main' : undefined,
              }}
            >
              {formatCurrency(value)}
            </Typography>
          </Box>
        )
      })}
    </Box>
  )
}
