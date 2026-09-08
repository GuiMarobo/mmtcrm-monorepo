import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined'
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'
import Paper from '@mui/material/Paper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Stepper from '@mui/material/Stepper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { useRef, useState } from 'react'
import type { ChangeEvent, RefObject } from 'react'
import { FormDialog } from '../common/FormDialog'
import { TONES } from '../../theme/tones'
import { ApiError, clientsApi } from '../../api'
import type { ImportReport } from '../../types'

type Phase = 'idle' | 'analyzing' | 'reviewing' | 'importing' | 'done'

interface ImportClientesModalProps {
  onClose: () => void
  onImported: () => void
}

const REQUIRED_COLUMNS = ['Nome', 'Telefone ou CPF']

const OPTIONAL_COLUMNS = [
  'LTV',
  'Endereço',
  'Numero',
  'Complemento',
  'Bairro',
  'Cidade',
  'Estado',
  'CEP',
  'Data de Nascimento',
  'Quem Indicou',
  'Qtd Indicações',
]

const STEPS = ['Enviar arquivo', 'Revisar', 'Concluído']

export function ImportClientesModal({ onClose, onImported }: ImportClientesModalProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [report, setReport] = useState<ImportReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setPhase('idle')
    setFile(null)
    setReport(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null
    if (!selected) return

    setFile(selected)
    setError(null)
    setReport(null)
    setPhase('analyzing')

    try {
      const result = await clientsApi.importCsv(selected, true)
      setReport(result)
      setPhase('reviewing')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao analisar o arquivo.')
      setPhase('idle')
    }
  }

  const confirm = async () => {
    if (!file) return
    setPhase('importing')
    setError(null)
    try {
      const result = await clientsApi.importCsv(file, false)
      setReport(result)
      setPhase('done')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao importar.')
      setPhase('reviewing')
    }
  }

  const finishAndClose = () => {
    onImported()
    onClose()
  }

  const activeStep =
    phase === 'idle' || phase === 'analyzing'
      ? 0
      : phase === 'reviewing' || phase === 'importing'
        ? 1
        : 2

  return (
    <FormDialog
      title="Importar Clientes"
      subtitle="Envie a planilha padrão da MMT Urbana em formato .csv. O arquivo é analisado antes de salvar - nada é gravado sem a sua confirmação."
      onClose={onClose}
      width={720}
      closeOnBackdrop={phase !== 'importing'}
      footer={
        <>
          {phase === 'reviewing' && (
            <>
              <Button variant="outlined" color="inherit" onClick={reset}>
                Trocar arquivo
              </Button>
              <Button
                variant="contained"
                startIcon={<CheckOutlinedIcon />}
                onClick={() => void confirm()}
                disabled={!report || report.toCreate === 0}
              >
                Confirmar importação ({report?.toCreate ?? 0})
              </Button>
            </>
          )}
          {phase === 'done' && (
            <Button
              variant="contained"
              startIcon={<CheckOutlinedIcon />}
              onClick={finishAndClose}
            >
              Concluir
            </Button>
          )}
          {(phase === 'idle' || phase === 'analyzing' || phase === 'importing') && (
            <Button
              variant="outlined"
              color="inherit"
              onClick={onClose}
              disabled={phase === 'importing'}
            >
              Cancelar
            </Button>
          )}
        </>
      }
    >
      <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {(phase === 'analyzing' || phase === 'importing') && <LinearProgress sx={{ mb: 2 }} />}

      {(phase === 'idle' || phase === 'analyzing') && (
        <>
          <Dropzone
            fileInputRef={fileInputRef}
            onFileChange={(e) => void handleFileChange(e)}
            file={file}
            busy={phase === 'analyzing'}
          />
          <ColumnGuide />
        </>
      )}
      {(phase === 'reviewing' || phase === 'importing') && report && (
        <ReportView report={report} importing={phase === 'importing'} />
      )}
      {phase === 'done' && report && <DoneView report={report} />}
      {error && (
        <Alert severity="error" sx={{ mt: 1.5 }}>
          {error}
        </Alert>
      )}
    </FormDialog>
  )
}

interface DropzoneProps {
  fileInputRef: RefObject<HTMLInputElement | null>
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void
  file: File | null
  busy: boolean
}

function Dropzone({ fileInputRef, onFileChange, file, busy }: DropzoneProps) {
  return (
    <Box>
      <Box
        component="label"
        htmlFor="import-file"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          p: '36px 16px',
          border: '2px dashed',
          borderColor: 'divider',
          borderRadius: 3,
          backgroundColor: 'action.hover',
          cursor: busy ? 'wait' : 'pointer',
        }}
      >
        <FileUploadOutlinedIcon sx={{ color: 'text.disabled' }} />
        <Typography sx={{ fontWeight: 600 }}>
          {file ? file.name : 'Clique para selecionar um arquivo .csv'}
        </Typography>
        <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>
          Até 5 MB. Codificação UTF-8 recomendada.
        </Typography>
      </Box>
      <Box
        component="input"
        ref={fileInputRef}
        id="import-file"
        type="file"
        accept=".csv,text/csv"
        onChange={onFileChange}
        disabled={busy}
        sx={{ display: 'none' }}
      />
      {busy && (
        <Typography sx={{ mt: 1.5, textAlign: 'center', color: 'text.disabled', fontSize: 13 }}>
          Analisando arquivo…
        </Typography>
      )}
    </Box>
  )
}

function ColumnGuide() {
  return (
    <Paper variant="outlined" sx={{ mt: 2, overflow: 'hidden', boxShadow: 'none' }}>
      <Typography
        sx={{
          p: '10px 14px',
          backgroundColor: TONES.gray.bg,
          fontSize: 12.5,
          fontWeight: 600,
          color: 'text.secondary',
        }}
      >
        Colunas reconhecidas
      </Typography>
      <Box sx={{ p: '12px 14px', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <ColumnGroup
          title="Obrigatórias"
          hint="cada linha precisa do Nome e de ao menos um contato"
          columns={REQUIRED_COLUMNS}
          required
        />
        <ColumnGroup title="Opcionais" columns={OPTIONAL_COLUMNS} />
      </Box>
      <Box
        sx={{
          p: '10px 14px',
          borderTop: 1,
          borderColor: 'divider',
          fontSize: 12,
          color: 'text.disabled',
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
        }}
      >
        <span>Linhas sem Telefone e sem CPF são ignoradas automaticamente.</span>
        <span>
          Quando o LTV está preenchido, o cliente entra como Ativo com uma negociação fechada.
        </span>
        <span>Colunas fora desta lista são descartadas e listadas no relatório.</span>
      </Box>
    </Paper>
  )
}

interface ColumnGroupProps {
  title: string
  hint?: string
  columns: string[]
  required?: boolean
}

function ColumnGroup({ title, hint, columns, required = false }: ColumnGroupProps) {
  return (
    <Box>
      <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary', mb: 0.75 }}>
        {title}
        {hint && (
          <Box component="span" sx={{ fontWeight: 400, color: 'text.disabled' }}>
            {' '}
            - {hint}
          </Box>
        )}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
        {columns.map((col) => (
          <Chip
            key={col}
            size="small"
            label={col}
            variant={required ? 'filled' : 'outlined'}
            sx={
              required
                ? { color: TONES.green.color, backgroundColor: TONES.green.bg }
                : { color: 'text.secondary' }
            }
          />
        ))}
      </Box>
    </Box>
  )
}

function ReportView({ report, importing }: { report: ImportReport; importing: boolean }) {
  return (
    <Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 1,
        }}
      >
        <SummaryCard label="Linhas lidas" value={report.totalRows} />
        <SummaryCard label="A criar" value={report.toCreate} tone="green" />
        <SummaryCard label="Já cadastrados" value={report.skipped} tone="amber" />
        <SummaryCard label="Com erro" value={report.failed} tone="red" />
      </Box>

      {report.negotiationsCreated > 0 && (
        <Alert severity="success" sx={{ mt: 1 }}>
          <b>{report.negotiationsCreated}</b>{' '}
          {report.negotiationsCreated === 1
            ? 'cliente com LTV vira negociação fechada'
            : 'clientes com LTV viram negociações fechadas'}
          .
        </Alert>
      )}

      {report.ignoredColumns.length > 0 && (
        <Alert severity="warning" sx={{ mt: 1 }}>
          <AlertTitle sx={{ fontSize: 13, fontWeight: 700, mb: 0 }}>Colunas ignoradas</AlertTitle>
          {report.ignoredColumns.join(', ')} - não fazem parte do cadastro de clientes e foram
          descartadas.
        </Alert>
      )}

      {report.errors.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>
            Detalhe dos erros ({report.errors.length})
          </Typography>
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{ maxHeight: 240, boxShadow: 'none' }}
          >
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 70 }}>Linha</TableCell>
                  <TableCell sx={{ width: 110 }}>Campo</TableCell>
                  <TableCell>Mensagem</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.errors.map((e, i) => (
                  <TableRow key={`${e.rowNumber}-${i}`}>
                    <TableCell>{e.rowNumber}</TableCell>
                    <TableCell>{e.field ?? '-'}</TableCell>
                    <TableCell>{e.message}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {importing && (
        <Typography sx={{ mt: 1.5, textAlign: 'center', color: 'text.disabled', fontSize: 13 }}>
          Importando…
        </Typography>
      )}
    </Box>
  )
}

function DoneView({ report }: { report: ImportReport }) {
  return (
    <Box sx={{ textAlign: 'center', py: 2 }}>
      <Box
        sx={{
          width: 48,
          height: 48,
          margin: '0 auto 10px',
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          backgroundColor: TONES.green.bg,
          color: TONES.green.color,
        }}
      >
        <CheckOutlinedIcon />
      </Box>
      <Typography sx={{ fontSize: 16, fontWeight: 700 }}>Importação concluída</Typography>
      <Typography sx={{ mt: 0.5, fontSize: 13, color: 'text.disabled' }}>
        {report.toCreate} {report.toCreate === 1 ? 'cliente criado' : 'clientes criados'}
        {report.skipped > 0 && ` - ${report.skipped} já existiam`}
        {report.failed > 0 && ` - ${report.failed} com erro`}
      </Typography>
    </Box>
  )
}

interface SummaryCardProps {
  label: string
  value: number
  tone?: 'green' | 'amber' | 'red'
}

function SummaryCard({ label, value, tone }: SummaryCardProps) {
  const palette = tone ? TONES[tone] : { color: '#4b5563', bg: TONES.gray.bg }
  return (
    <Box
      sx={{
        p: '10px 12px',
        borderRadius: 2,
        backgroundColor: palette.bg,
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
      }}
    >
      <Typography sx={{ fontSize: 11.5, color: 'text.disabled' }}>{label}</Typography>
      <Typography sx={{ fontSize: 20, fontWeight: 700, color: palette.color }}>{value}</Typography>
    </Box>
  )
}
