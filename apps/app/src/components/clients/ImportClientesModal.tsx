import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import Alert from '@mui/material/Alert'
import LinearProgress from '@mui/material/LinearProgress'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Stepper from '@mui/material/Stepper'
import { I } from '../../icons'
import { Button, Modal } from '../ui'
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
    <Modal
      title="Importar Clientes"
      subtitle="Envie a planilha padrão da MMT Urbana em formato .csv. O arquivo é analisado antes de salvar - nada é gravado sem a sua confirmação."
      onClose={onClose}
      width={720}
      closeOnBackdrop={phase !== 'importing'}
      footer={
        <>
          {phase === 'reviewing' && (
            <>
              <Button onClick={reset}>Trocar arquivo</Button>
              <Button
                variant="primary"
                icon={I.check}
                onClick={confirm}
                disabled={!report || report.toCreate === 0}
              >
                Confirmar importação ({report?.toCreate ?? 0})
              </Button>
            </>
          )}
          {phase === 'done' && (
            <Button variant="primary" icon={I.check} onClick={finishAndClose}>
              Concluir
            </Button>
          )}
          {(phase === 'idle' || phase === 'analyzing' || phase === 'importing') && (
            <Button onClick={onClose} disabled={phase === 'importing'}>
              Cancelar
            </Button>
          )}
        </>
      }
    >
      <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
        <Step>
          <StepLabel>Enviar arquivo</StepLabel>
        </Step>
        <Step>
          <StepLabel>Revisar</StepLabel>
        </Step>
        <Step>
          <StepLabel>Concluído</StepLabel>
        </Step>
      </Stepper>

      {(phase === 'analyzing' || phase === 'importing') && (
        <LinearProgress sx={{ mb: 2 }} />
      )}

      {(phase === 'idle' || phase === 'analyzing') && (
        <>
          <Dropzone
            fileInputRef={fileInputRef}
            onFileChange={handleFileChange}
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
    </Modal>
  )
}

function ColumnGuide() {
  return (
    <div
      style={{
        marginTop: 16,
        border: '1px solid var(--border)',
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '10px 14px',
          background: 'var(--gray-bg)',
          fontSize: 12.5,
          fontWeight: 600,
          color: 'var(--text-2)',
        }}
      >
        Colunas reconhecidas
      </div>
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <ColumnGroup
          title="Obrigatórias"
          hint="cada linha precisa do Nome e de ao menos um contato"
          columns={REQUIRED_COLUMNS}
          tone="required"
        />
        <ColumnGroup title="Opcionais" columns={OPTIONAL_COLUMNS} tone="optional" />
      </div>
      <div
        style={{
          padding: '10px 14px',
          borderTop: '1px solid var(--border)',
          fontSize: 12,
          color: 'var(--text-3)',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <span>Linhas sem Telefone e sem CPF são ignoradas automaticamente.</span>
        <span>Quando o LTV está preenchido, o cliente entra como Ativo com uma negociação fechada.</span>
        <span>Colunas fora desta lista são descartadas e listadas no relatório.</span>
      </div>
    </div>
  )
}

function ColumnGroup({
  title,
  hint,
  columns,
  tone,
}: {
  title: string
  hint?: string
  columns: string[]
  tone: 'required' | 'optional'
}) {
  const chipStyle =
    tone === 'required'
      ? { background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid transparent' }
      : { background: '#fff', color: 'var(--text-2)', border: '1px solid var(--border)' }
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
        {title}
        {hint && <span style={{ fontWeight: 400, color: 'var(--text-3)' }}> - {hint}</span>}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {columns.map((col) => (
          <span
            key={col}
            style={{
              ...chipStyle,
              padding: '3px 9px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}
          >
            {col}
          </span>
        ))}
      </div>
    </div>
  )
}

interface DropzoneProps {
  fileInputRef: React.RefObject<HTMLInputElement>
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void
  file: File | null
  busy: boolean
}

function Dropzone({ fileInputRef, onFileChange, file, busy }: DropzoneProps) {
  return (
    <div>
      <label
        htmlFor="import-file"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '36px 16px',
          border: '2px dashed var(--border-strong)',
          borderRadius: 12,
          background: '#fafbfc',
          cursor: busy ? 'wait' : 'pointer',
          gap: 8,
        }}
      >
        <div style={{ color: 'var(--text-3)' }}>{I.upload}</div>
        <div style={{ fontWeight: 600 }}>
          {file ? file.name : 'Clique para selecionar um arquivo .csv'}
        </div>
        <div className="muted" style={{ fontSize: 12 }}>
          Até 5 MB. Codificação UTF-8 recomendada.
        </div>
      </label>
      <input
        ref={fileInputRef}
        id="import-file"
        type="file"
        accept=".csv,text/csv"
        onChange={onFileChange}
        disabled={busy}
        style={{ display: 'none' }}
      />
      {busy && (
        <div style={{ marginTop: 12, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
          Analisando arquivo…
        </div>
      )}
    </div>
  )
}

function ReportView({ report, importing }: { report: ImportReport; importing: boolean }) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
        <SummaryCard label="Linhas lidas" value={report.totalRows} />
        <SummaryCard label="A criar" value={report.toCreate} tone="green" />
        <SummaryCard label="Já cadastrados" value={report.skipped} tone="amber" />
        <SummaryCard label="Com erro" value={report.failed} tone="red" />
      </div>

      {report.negotiationsCreated > 0 && (
        <div
          style={{
            marginTop: 8,
            padding: '10px 12px',
            background: 'var(--green-bg)',
            color: 'var(--green)',
            borderRadius: 8,
            fontSize: 12.5,
          }}
        >
          <b>{report.negotiationsCreated}</b>{' '}
          {report.negotiationsCreated === 1
            ? 'cliente com LTV vira negociação fechada'
            : 'clientes com LTV viram negociações fechadas'}
          .
        </div>
      )}

      {report.ignoredColumns.length > 0 && (
        <div
          style={{
            marginTop: 8,
            padding: '10px 12px',
            background: 'var(--amber-bg)',
            color: 'var(--amber)',
            borderRadius: 8,
            fontSize: 12.5,
          }}
        >
          <b>Colunas ignoradas:</b> {report.ignoredColumns.join(', ')} - não fazem parte do cadastro
          de clientes e foram descartadas.
        </div>
      )}

      {report.errors.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
            Detalhe dos erros ({report.errors.length})
          </div>
          <div style={{ maxHeight: 240, overflow: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
            <table className="tbl" style={{ fontSize: 12.5 }}>
              <thead>
                <tr>
                  <th style={{ width: 70 }}>Linha</th>
                  <th style={{ width: 110 }}>Campo</th>
                  <th>Mensagem</th>
                </tr>
              </thead>
              <tbody>
                {report.errors.map((e, i) => (
                  <tr key={i}>
                    <td>{e.rowNumber}</td>
                    <td>{e.field ?? '-'}</td>
                    <td>{e.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {importing && (
        <div style={{ marginTop: 12, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
          Importando…
        </div>
      )}
    </div>
  )
}

function DoneView({ report }: { report: ImportReport }) {
  return (
    <div style={{ textAlign: 'center', padding: '16px 0' }}>
      <div
        style={{
          width: 48,
          height: 48,
          margin: '0 auto 10px',
          borderRadius: '50%',
          background: 'var(--green-bg)',
          color: 'var(--green)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {I.check}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700 }}>Importação concluída</div>
      <div className="muted" style={{ marginTop: 4, fontSize: 13 }}>
        {report.toCreate} {report.toCreate === 1 ? 'cliente criado' : 'clientes criados'}
        {report.skipped > 0 && ` - ${report.skipped} já existiam`}
        {report.failed > 0 && ` - ${report.failed} com erro`}
      </div>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone?: 'green' | 'amber' | 'red'
}) {
  const colors: Record<NonNullable<typeof tone>, { bg: string; fg: string }> = {
    green: { bg: 'var(--green-bg)', fg: 'var(--green)' },
    amber: { bg: 'var(--amber-bg)', fg: 'var(--amber)' },
    red: { bg: 'var(--red-bg)', fg: 'var(--red)' },
  }
  const c = tone ? colors[tone] : { bg: 'var(--gray-bg)', fg: 'var(--text-2)' }
  return (
    <div style={{ padding: '10px 12px', background: c.bg, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: c.fg }}>{value}</div>
    </div>
  )
}
