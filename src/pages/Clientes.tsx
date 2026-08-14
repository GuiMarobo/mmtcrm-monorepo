import { useEffect, useMemo, useState } from 'react'
import {
  useGridApiRef,
  gridFilteredSortedRowEntriesSelector,
} from '@mui/x-data-grid-premium'
import type { GridRowSelectionModel } from '@mui/x-data-grid-premium'
import { I } from '../icons'
import { ApiError, clientsApi } from '../api'
import { useAuth } from '../contexts/AuthContext'
import { ImportClientesModal } from '../components/clients/ImportClientesModal'
import { ClientFormModal } from '../components/clients/ClientFormModal'
import { ClientsDataGrid } from '../components/clients/ClientsDataGrid'
import { EraseDataDialog } from '../components/lgpd/EraseDataDialog'
import {
  Button,
  ConfirmDialog,
  SearchInput,
  Stat,
  StatGrid,
  TableCard,
  TableError,
  TableToolbar,
} from '../components/ui'
import { downloadClientesXlsx } from '../utils/xlsx'
import { formatCurrency } from '../utils/format'
import type { Client, CreateClientPayload } from '../types'

interface ClientesProps {
  toast: (msg: string, type?: 'success' | 'error') => void
}

const EMPTY_SELECTION: GridRowSelectionModel = { type: 'include', ids: new Set() }

export function Clientes({ toast }: ClientesProps) {
  const { user } = useAuth()
  const apiRef = useGridApiRef()
  const [list, setList] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [selection, setSelection] = useState<GridRowSelectionModel>(EMPTY_SELECTION)
  const [editing, setEditing] = useState<Client | null>(null)
  const [creating, setCreating] = useState(false)
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<Client | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [confirmErase, setConfirmErase] = useState<Client | null>(null)
  const [erasing, setErasing] = useState(false)

  const reload = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      setList(await clientsApi.list())
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Falha ao carregar clientes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  const selectedIds = useMemo(() => {
    if (selection.type === 'include') return selection.ids
    const all = new Set(list.map((c) => c.id))
    selection.ids.forEach((id) => all.delete(String(id)))
    return all
  }, [selection, list])

  const stats = useMemo(() => {
    const total = list.length
    const leads = list.filter((c) => c.status === 'LEAD').length
    const ativos = list.filter((c) => c.status === 'ATIVO').length
    const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 100))
    return { leads, ativos, pct }
  }, [list])

  const selectionActive = selectedIds.size > 0
  const aggregated = selectionActive
    ? list.filter((c) => selectedIds.has(c.id))
    : list
  const faturamento = aggregated.reduce((sum, c) => sum + (c.revenue ?? 0), 0)
  const pedidos = aggregated.reduce((sum, c) => sum + (c.ordersCount ?? 0), 0)
  const selectionSuffix = selectionActive ? ` (${selectedIds.size} sel.)` : ''
  const selectionHint = selectionActive
    ? 'do(s) cliente(s) selecionado(s)'
    : 'pedidos aprovados'

  const saveClient = async (payload: CreateClientPayload) => {
    if (editing) {
      const updated = await clientsApi.update(editing.id, payload)
      setList((prev) => prev.map((c) => (c.id === editing.id ? { ...c, ...updated } : c)))
      toast(`Cliente "${updated.name}" atualizado`)
    } else {
      const created = await clientsApi.create(payload)
      setList((prev) => [{ ...created, negotiationsCount: 0, ordersCount: 0, revenue: 0 }, ...prev])
      toast(`Cliente "${created.name}" cadastrado`)
    }
    setEditing(null)
    setCreating(false)
  }

  const qualificar = async (client: Client) => {
    try {
      const updated = await clientsApi.qualify(client.id, 'QUALIFICADO')
      setList((prev) => prev.map((c) => (c.id === client.id ? { ...c, ...updated } : c)))
      toast(`Lead "${updated.name}" qualificado`)
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Erro ao qualificar lead', 'error')
    }
  }

  const registrarContato = async (client: Client) => {
    try {
      const updated = await clientsApi.registerContact(client.id)
      setList((prev) => prev.map((c) => (c.id === client.id ? { ...c, ...updated } : c)))
      toast(`Contato registrado com ${updated.name}`)
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Erro ao registrar contato', 'error')
    }
  }

  const confirmRemove = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      await clientsApi.remove(confirmDelete.id)
      setList((prev) => prev.filter((c) => c.id !== confirmDelete.id))
      toast(`"${confirmDelete.name}" removido`)
      setConfirmDelete(null)
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Erro ao excluir cliente', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const eraseData = async (reason: string) => {
    if (!confirmErase) return
    setErasing(true)
    try {
      const result = await clientsApi.erase(confirmErase.id, reason)
      toast(
        result.action === 'ELIMINADO'
          ? `Dados de "${confirmErase.name}" eliminados do sistema`
          : `Dados pessoais de "${confirmErase.name}" anonimizados; o histórico foi preservado`,
      )
      setConfirmErase(null)
      await reload()
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Erro ao eliminar dados', 'error')
    } finally {
      setErasing(false)
    }
  }

  const exportar = async () => {
    const visiveis = apiRef.current
      ? gridFilteredSortedRowEntriesSelector(apiRef).map((entry) => entry.model as Client)
      : list

    if (visiveis.length === 0) {
      toast('Nada para exportar com os filtros atuais.')
      return
    }

    setExporting(true)
    try {
      const filtersApplied: string[] = []
      if (query.trim()) filtersApplied.push(`Busca: "${query.trim()}"`)
      if (visiveis.length !== list.length) {
        filtersApplied.push(`Filtros da grade: ${visiveis.length} de ${list.length} registros`)
      }

      await downloadClientesXlsx(visiveis, {
        exportedAt: new Date(),
        exportedBy: user?.name ?? 'Desconhecido',
        totalInSystem: list.length,
        filtersApplied,
      })
      toast(`${visiveis.length} clientes exportados em XLSX`)
    } catch {
      toast('Erro ao gerar o arquivo XLSX', 'error')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">Clientes &amp; Leads</div>
          <div className="page-sub">
            Gerencie a base de contatos e classifique leads por intenção.
          </div>
        </div>
        <div className="page-actions">
          <Button icon={I.upload} onClick={() => setImporting(true)}>
            Importar
          </Button>
          <Button icon={I.download} onClick={() => void exportar()} disabled={exporting}>
            {exporting ? 'Exportando…' : 'Exportar'}
          </Button>
          <Button variant="primary" icon={I.plus} onClick={() => setCreating(true)}>
            Novo cliente
          </Button>
        </div>
      </div>

      <StatGrid>
        <Stat
          label={`Faturamento${selectionSuffix}`}
          value={formatCurrency(faturamento)}
          delta={<>{I.spark}<span>{selectionHint}</span></>}
        />
        <Stat
          label={`Quantidade de Pedidos${selectionSuffix}`}
          value={pedidos}
          delta={<>{I.spark}<span>{selectionHint}</span></>}
        />
        <Stat
          label="Leads em Aberto"
          value={stats.leads}
          delta={<>{I.spark}<span>{stats.pct(stats.leads)}% do total</span></>}
        />
        <Stat
          label="Clientes Ativos"
          value={stats.ativos}
          delta={<>{I.spark}<span>{stats.pct(stats.ativos)}% do total</span></>}
        />
      </StatGrid>

      <TableCard>
        <TableToolbar>
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Buscar por nome, telefone ou e-mail…"
          />
        </TableToolbar>

        {loadError && (
          <TableError>
            {loadError} -{' '}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                void reload()
              }}
            >
              tentar novamente
            </a>
          </TableError>
        )}

        <ClientsDataGrid
          apiRef={apiRef}
          rows={list}
          loading={loading}
          quickFilter={query}
          selection={selection}
          onSelectionChange={setSelection}
          role={user?.role}
          onEdit={setEditing}
          onQualify={(c) => void qualificar(c)}
          onRegisterContact={(c) => void registrarContato(c)}
          onDelete={setConfirmDelete}
          onErase={setConfirmErase}
        />
      </TableCard>

      {(creating || editing) && (
        <ClientFormModal
          client={editing}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
          onSave={saveClient}
        />
      )}

      {importing && (
        <ImportClientesModal
          onClose={() => setImporting(false)}
          onImported={() => {
            void reload()
          }}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Excluir cliente?"
          description={
            <>
              Esta ação não pode ser desfeita. O cliente <b>{confirmDelete.name}</b> será removido
              permanentemente da base.
            </>
          }
          confirmLabel="Excluir cliente"
          danger
          loading={deleting}
          onConfirm={confirmRemove}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {confirmErase && (
        <EraseDataDialog
          subject="cliente"
          name={confirmErase.name}
          loading={erasing}
          onConfirm={(reason) => void eraseData(reason)}
          onCancel={() => setConfirmErase(null)}
        />
      )}
    </div>
  )
}
