import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined'
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog, { dialogClasses } from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import Divider from '@mui/material/Divider'
import GlobalStyles from '@mui/material/GlobalStyles'
import IconButton from '@mui/material/IconButton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { backdropClasses } from '@mui/material/Backdrop'
import { formatCurrency, formatDate, formatIsoDate, formatPercent } from '../../utils/format'
import { ToneChip } from '../common/ToneChip'
import { describeCondition, sumInstallments } from './quotationCondition'
import type { CompanySettings, QuotationDetail, QuotationItem } from '../../types'

const PRINT_ROOT_ID = 'quotation-print'

interface QuotationDetailDialogProps {
  quotation: QuotationDetail | null
  company: CompanySettings | null
  error: string | null
  onClose: () => void
}

export function QuotationDetailDialog({
  quotation,
  company,
  error,
  onClose,
}: QuotationDetailDialogProps) {
  return (
    <Dialog
      open
      id={PRINT_ROOT_ID}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-label={quotation ? `Orçamento ${quotation.code}` : 'Orçamento'}
    >
      <GlobalStyles
        styles={{
          '@media print': {
            'html, body': { height: 'auto', overflow: 'visible !important' },
            [`body > *:not(#${PRINT_ROOT_ID})`]: { display: 'none !important' },
            [`#${PRINT_ROOT_ID}`]: { position: 'static !important' },
            [`#${PRINT_ROOT_ID} .${backdropClasses.root}`]: { display: 'none' },
            [`#${PRINT_ROOT_ID} .${dialogClasses.container}`]: {
              display: 'block',
              height: 'auto',
            },
            [`#${PRINT_ROOT_ID} .${dialogClasses.paper}`]: {
              margin: 0,
              maxWidth: 'none',
              maxHeight: 'none',
              width: '100%',
              boxShadow: 'none',
              overflow: 'visible',
            },
          },
        }}
      />
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 1,
          px: 3,
          py: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          displayPrint: 'none',
        }}
      >
        <Button
          variant="contained"
          startIcon={<PrintOutlinedIcon />}
          onClick={() => window.print()}
          disabled={!quotation}
        >
          Imprimir
        </Button>
        <IconButton aria-label="Fechar" onClick={onClose}>
          <CloseOutlinedIcon />
        </IconButton>
      </Box>
      <DialogContent sx={{ p: { xs: 2.5, sm: 4 }, '@media print': { p: 0, overflow: 'visible' } }}>
        {error ? (
          <Alert severity="error">{error}</Alert>
        ) : !quotation ? (
          <Typography sx={{ p: 3, textAlign: 'center', color: 'text.disabled', fontSize: 13 }}>
            Carregando orçamento…
          </Typography>
        ) : (
          <>
            {!company && (
              <Alert severity="warning" sx={{ mb: 3, displayPrint: 'none' }}>
                Dados da loja indisponíveis: o cabeçalho sai sem nome, CNPJ, endereço e telefone.
              </Alert>
            )}
            <QuotationDocument quotation={quotation} company={company} />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function QuotationDocument({
  quotation,
  company,
}: {
  quotation: QuotationDetail
  company: CompanySettings | null
}) {
  const condition = {
    installments: quotation.installments,
    installmentValue: quotation.installmentValue,
    firstInstallment: quotation.firstInstallmentValue,
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <StoreHeader company={company} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
        <Box>
          <Typography variant="h5" component="h2">
            {`Orçamento ${quotation.code}`}
          </Typography>
          <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.5 }}>
            {`Emitido em ${formatDate(quotation.createdAt)}`}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
            {`Válido até ${formatIsoDate(quotation.validUntil)}`}
          </Typography>
          {quotation.expired && <ToneChip tone="red">Vencido</ToneChip>}
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
        <Field label="Cliente" value={quotation.client.name} />
        <Field label="Vendedor responsável" value={quotation.seller?.name ?? '—'} />
      </Box>

      <Table size="small" aria-label="Itens do orçamento">
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
          {quotation.items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{item.product.name}</Typography>
                <Typography sx={{ fontSize: 11.5, color: 'text.disabled' }}>
                  {item.product.sku}
                </Typography>
              </TableCell>
              <TableCell align="right">{item.quantity}</TableCell>
              <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
              <TableCell align="right">{discountLabel(item)}</TableCell>
              <TableCell align="right">{formatCurrency(item.subtotal)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Box
        sx={{
          alignSelf: 'flex-end',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          minWidth: { sm: 320 },
          width: { xs: '100%', sm: 'auto' },
        }}
      >
        <SummaryLine label="Total à vista" value={formatCurrency(quotation.totalValue)} />
        <Divider />
        <SummaryLine
          label={`Cartão de crédito · taxa ${formatPercent(quotation.ratePercent)}`}
          value={describeCondition(condition)}
          strong
        />
        <SummaryLine label="Total parcelado" value={formatCurrency(sumInstallments(condition))} />
      </Box>
    </Box>
  )
}

function StoreHeader({ company }: { company: CompanySettings | null }) {
  const contact = [
    company?.cnpj ? `CNPJ ${company.cnpj}` : null,
    company?.phone ? `Tel. ${company.phone}` : null,
  ].filter(Boolean)

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        pb: 2.5,
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Box
        aria-hidden
        sx={{
          width: 48,
          height: 48,
          borderRadius: 2,
          bgcolor: 'text.primary',
          color: 'background.paper',
          display: 'grid',
          placeItems: 'center',
          fontWeight: 800,
          fontSize: 14,
          letterSpacing: '-0.02em',
          flexShrink: 0,
          printColorAdjust: 'exact',
          WebkitPrintColorAdjust: 'exact',
        }}
      >
        MMT
      </Box>
      <Box>
        {company?.name && (
          <Typography sx={{ fontWeight: 800, fontSize: 16, lineHeight: 1.2 }}>
            {company.name}
          </Typography>
        )}
        {company?.address && (
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{company.address}</Typography>
        )}
        {contact.length > 0 && (
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
            {contact.join(' · ')}
          </Typography>
        )}
      </Box>
    </Box>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography sx={{ fontSize: 11.5, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{value}</Typography>
    </Box>
  )
}

function SummaryLine({
  label,
  value,
  strong = false,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 3 }}>
      <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{label}</Typography>
      <Typography sx={{ fontSize: strong ? 15 : 13.5, fontWeight: strong ? 700 : 600 }}>
        {value}
      </Typography>
    </Box>
  )
}

function discountLabel(item: QuotationItem) {
  if (item.discountAmount === 0) return '—'
  const amount = `-${formatCurrency(item.discountAmount)}`
  return item.discountType === 'PERCENTUAL'
    ? `${formatPercent(item.discountValue)} (${amount})`
    : amount
}
