import MenuItem from '@mui/material/MenuItem'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, usedDevicesApi } from '../api'
import { PageHeader } from '../components/common/PageHeader'
import { ErrorBanner, SectionCard, SectionToolbar } from '../components/common/SectionCard'
import { UsedDevicesTable } from '../components/usedDevices/UsedDevicesTable'
import { UsedDeviceEvaluationDialog } from '../components/usedDevices/UsedDeviceEvaluationDialog'
import { UsedDeviceStats } from '../components/usedDevices/UsedDeviceStats'
import { useUsedDeviceSummary } from '../hooks/useUsedDeviceSummary'
import { EVALUATION_STATUS_OPTIONS } from '../types'
import type {
  EvaluateUsedDevicePayload,
  QueueUsedDevice,
  RefuseUsedDevicePayload,
  UsedDeviceDetail,
  UsedDeviceQueueFilter,
} from '../types'

interface DispositivosUsadosProps {
  toast: (msg: string, type?: 'success' | 'error') => void
}

const FILTER_OPTIONS: { value: UsedDeviceQueueFilter; label: string }[] = [
  ...EVALUATION_STATUS_OPTIONS,
  { value: 'TODOS', label: 'Todos' },
]

const EMPTY_LABELS: Record<UsedDeviceQueueFilter, string> = {
  AGUARDANDO: 'Nenhum aparelho aguardando avaliação',
  AVALIADO: 'Nenhum aparelho avaliado',
  RECUSADO: 'Nenhum aparelho recusado',
  TODOS: 'Nenhum aparelho cadastrado',
}

export function DispositivosUsados({ toast }: DispositivosUsadosProps) {
  const [filter, setFilter] = useState<UsedDeviceQueueFilter>('AGUARDANDO')
  const [list, setList] = useState<QueueUsedDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selected, setSelected] = useState<QueueUsedDevice | null>(null)
  const [detail, setDetail] = useState<UsedDeviceDetail | null>(null)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const openedId = useRef<number | null>(null)
  const latest = useRef(0)
  const { summary, reload: reloadSummary } = useUsedDeviceSummary()

  const reload = useCallback(async (status: UsedDeviceQueueFilter) => {
    const request = ++latest.current
    setLoading(true)
    setLoadError(null)
    try {
      const result = await usedDevicesApi.listQueue(status)
      if (request === latest.current) setList(result.devices)
    } catch (err) {
      if (request !== latest.current) return
      setLoadError(err instanceof ApiError ? err.message : 'Falha ao carregar os aparelhos.')
    } finally {
      if (request === latest.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload(filter)
  }, [filter, reload])

  const openDetail = async (device: QueueUsedDevice) => {
    openedId.current = device.id
    setSelected(device)
    setDetail(null)
    setHistoryError(null)
    try {
      const result = await usedDevicesApi.findOne(device.id)
      if (openedId.current === device.id) setDetail(result)
    } catch (err) {
      if (openedId.current !== device.id) return
      setHistoryError(
        err instanceof ApiError ? err.message : 'Falha ao carregar o histórico da série.',
      )
    }
  }

  const closeDetail = () => {
    openedId.current = null
    setSelected(null)
  }

  const record = async (action: () => Promise<unknown>, success: string) => {
    await action()
    toast(success)
    void reload(filter)
    void reloadSummary()
  }

  const evaluate = (id: number, payload: EvaluateUsedDevicePayload) =>
    record(() => usedDevicesApi.evaluate(id, payload), 'Aparelho avaliado')

  const refuse = (id: number, payload: RefuseUsedDevicePayload) =>
    record(() => usedDevicesApi.refuse(id, payload), 'Aparelho recusado')

  return (
    <Box>
      <PageHeader
        title="Dispositivos Usados"
        subtitle="A fila de avaliação: confira o iCloud, avalie ou recuse os aparelhos na troca."
      />

      <UsedDeviceStats summary={summary} />

      {loadError ? (
        <SectionCard>
          <ErrorBanner message={loadError} onRetry={() => void reload(filter)} />
        </SectionCard>
      ) : (
        <SectionCard>
          <SectionToolbar>
            <TextField
              select
              label="Situação"
              value={filter}
              onChange={(e) => setFilter(e.target.value as UsedDeviceQueueFilter)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ minWidth: 220, flex: { xs: 1, sm: 'none' } }}
            >
              {FILTER_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>
          </SectionToolbar>

          {!loading && list.length === 0 ? (
            <Typography sx={{ p: 6, textAlign: 'center', color: 'text.disabled', fontSize: 13 }}>
              {EMPTY_LABELS[filter]}
            </Typography>
          ) : (
            <UsedDevicesTable
              rows={list}
              loading={loading}
              onOpen={(device) => void openDetail(device)}
            />
          )}
        </SectionCard>
      )}

      {selected && (
        <UsedDeviceEvaluationDialog
          key={selected.id}
          device={selected}
          detail={detail}
          historyError={historyError}
          onEvaluate={(payload) => evaluate(selected.id, payload)}
          onRefuse={(payload) => refuse(selected.id, payload)}
          onClose={closeDetail}
        />
      )}
    </Box>
  )
}
