import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import { formatCurrency, formatPercent } from '../../utils/format'
import type { NegotiationItem } from '../../types'

interface ItemsSummaryTableProps {
  items: NegotiationItem[]
  totalValue: number
  tradeInTotal: number
  amountDue: number
  tradeInLabel?: string
}

function discountLabel(item: NegotiationItem) {
  if (item.discountAmount <= 0) return '—'
  const amount = `-${formatCurrency(item.discountAmount)}`
  return item.discountType === 'PERCENTUAL'
    ? `${amount} (${formatPercent(item.discountValue)})`
    : amount
}

export function ItemsSummaryTable({
  items,
  totalValue,
  tradeInTotal,
  amountDue,
  tradeInLabel = 'Troca',
}: ItemsSummaryTableProps) {
  const withTradeIn = tradeInTotal > 0
  const lastRow = { borderBottom: 0 }

  return (
    <Paper variant="outlined" sx={{ overflowX: 'auto' }}>
      <Table size="small" aria-label="Itens" sx={{ '& td, & th': { py: 1 } }}>
        <TableHead>
          <TableRow>
            <TableCell>Produto</TableCell>
            <TableCell align="right">Qtd.</TableCell>
            <TableCell align="right">Preço unitário</TableCell>
            <TableCell align="right">Desconto</TableCell>
            <TableCell align="right">Subtotal</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} sx={{ color: 'text.disabled' }}>
                Nenhum item
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    {item.product.name}
                  </Box>
                  <Box component="span" sx={{ ml: 1, color: 'text.disabled', fontSize: 12 }}>
                    {item.product.sku}
                  </Box>
                </TableCell>
                <TableCell align="right">{item.quantity}</TableCell>
                <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                <TableCell align="right">{discountLabel(item)}</TableCell>
                <TableCell align="right">{formatCurrency(item.subtotal)}</TableCell>
              </TableRow>
            ))
          )}
          <TableRow>
            <TableCell rowSpan={withTradeIn ? 3 : 1} colSpan={2} sx={lastRow} />
            <TableCell colSpan={2} sx={withTradeIn ? undefined : { ...lastRow, fontWeight: 700 }}>
              {withTradeIn ? 'Total dos itens' : 'Total'}
            </TableCell>
            <TableCell
              align="right"
              sx={withTradeIn ? undefined : { ...lastRow, fontWeight: 700 }}
            >
              {formatCurrency(totalValue)}
            </TableCell>
          </TableRow>
          {withTradeIn && (
            <>
              <TableRow>
                <TableCell colSpan={2}>{tradeInLabel}</TableCell>
                <TableCell align="right">{formatCurrency(-tradeInTotal)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={2} sx={{ ...lastRow, fontWeight: 700 }}>
                  Saldo a pagar
                </TableCell>
                <TableCell align="right" sx={{ ...lastRow, fontWeight: 700 }}>
                  {formatCurrency(amountDue)}
                </TableCell>
              </TableRow>
            </>
          )}
        </TableBody>
      </Table>
    </Paper>
  )
}

export function DetailNotes({ notes }: { notes: string | null }) {
  if (!notes) return null
  return (
    <Box sx={{ fontSize: 13, color: 'text.secondary', overflowWrap: 'anywhere' }}>
      <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
        Observações:{' '}
      </Box>
      {notes}
    </Box>
  )
}
