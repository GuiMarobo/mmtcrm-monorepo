/* MMT Urbana CRM — Modal de importação de Clientes via CSV */

import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { I } from '../icons'
import { ApiError, clientsApi } from '../api'
import type { ImportReport } from '../types'

type Phase = 'idle' | 'analyzing' | 'reviewing' | 'importing' | 'done'

interface ImportClientesModalProps {
  onClose: () => void
  /** Chamado após uma importação real bem-sucedida (para recarregar a lista). */
  onImported: () => void
}

export function ImportClientesModal({
  onClose,
  onImported,
}: ImportClientesModalProps) {
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

  /** Quando o usuário escolhe um arquivo, já dispara o dry-run automaticamente. */
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

  return (
    <div className="modal-scrim" onClick={phase === 'importing' ? undefined : onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 720 }}>
        <div className="modal-head">
          <div style={{ flex: 1 }}>
            <div className="modal-title">Importar Clientes (CSV)</div>
            <div className="modal-sub">
              Cabeçalho esperado: <code>name, email, phone, cpf, address, status,
              qualification, origin, notes</code>. Apenas <code>name</code> é obrigatório.
            </div>
          </div>
          <div className="row-action" onClick={onClose}>{I.x}</div>
        </div>

        <div className="modal-body">
          {/* ─── Fase 1: escolha do arquivo ─────────────────────────── */}
          {(phase === 'idle' || phase === 'analyzing') && (
            <Dropzone
              fileInputRef={fileInputRef}
              onFileChange={handleFileChange}
              file={file}
              busy={phase === 'analyzing'}
            />
          )}

          {/* ─── Fase 2: revisão do dry-run ─────────────────────────── */}
          {(phase === 'reviewing' || phase === 'importing') && report && (
            <ReportView report={report} importing={phase === 'importing'} />
          )}

          {/* ─── Fase 3: conclusão ──────────────────────────────────── */}
          {phase === 'done' && report && (
            <DoneView report={report} />
          )}

          {error && (
            <div
              role="alert"
              style={{
                marginTop: 12,
                padding: '10px 12px',
                color: 'var(--red)',
                background: 'var(--red-bg)',
                border: '1px solid rgba(220,38,38,0.2)',
                borderRadius: 8,
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}
        </div>

        <div className="modal-foot">
          {phase === 'reviewing' && (
            <>
              <button className="btn" onClick={reset}>Trocar arquivo</button>
              <button
                className="btn primary"
                onClick={confirm}
                disabled={!report || report.toCreate === 0}
              >
                {I.check}
                <span>Confirmar importação ({report?.toCreate ?? 0})</span>
              </button>
            </>
          )}
          {phase === 'done' && (
            <button className="btn primary" onClick={finishAndClose}>
              {I.check}<span>Concluir</span>
            </button>
          )}
          {(phase === 'idle' || phase === 'analyzing' || phase === 'importing') && (
            <button
              className="btn"
              onClick={onClose}
              disabled={phase === 'importing'}
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Subcomponentes ─────────────────────────────────────────────────────

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
          Até 5 MB. UTF-8 recomendado.
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        <SummaryCard label="Total" value={report.totalRows} />
        <SummaryCard label="A criar" value={report.toCreate} tone="green" />
        <SummaryCard label="Já existem" value={report.skipped} tone="amber" />
        <SummaryCard label="Com erro" value={report.failed} tone="red" />
      </div>

      {report.ignoredColumns.length > 0 && (
        <div
          style={{
            marginTop: 12,
            padding: '10px 12px',
            background: 'var(--amber-bg)',
            color: 'var(--amber)',
            borderRadius: 8,
            fontSize: 12.5,
          }}
        >
          <b>Colunas ignoradas:</b> {report.ignoredColumns.join(', ')} — não fazem parte do
          cadastro de clientes e foram descartadas.
        </div>
      )}

      {report.errors.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
            Detalhe dos erros ({report.errors.length})
          </div>
          <div
            style={{
              maxHeight: 240,
              overflow: 'auto',
              border: '1px solid var(--border)',
              borderRadius: 8,
            }}
          >
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
                    <td>{e.field ?? '—'}</td>
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
    <div style={{ textAlign: 'center', padding: '12px 0' }}>
      <div style={{ fontSize: 28, marginBottom: 6 }}>✅</div>
      <div style={{ fontSize: 16, fontWeight: 700 }}>
        Importação concluída
      </div>
      <div className="muted" style={{ marginTop: 4, fontSize: 13 }}>
        {report.toCreate} {report.toCreate === 1 ? 'cliente criado' : 'clientes criados'}
        {report.skipped > 0 && ` · ${report.skipped} já existiam`}
        {report.failed > 0 && ` · ${report.failed} com erro`}
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
    <div
      style={{
        padding: '10px 12px',
        background: c.bg,
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: c.fg }}>{value}</div>
    </div>
  )
}
