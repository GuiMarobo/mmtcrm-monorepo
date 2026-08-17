import { useEffect, useMemo, useState } from 'react'
import {
  useGridApiRef,
  gridFilteredSortedRowEntriesSelector,
} from '@mui/x-data-grid-premium'
import { I } from '../icons'
import { ApiError, usersApi } from '../api'
import { UserFormModal } from '../components/users/UserFormModal'
import { UsersDataGrid } from '../components/users/UsersDataGrid'
import { EraseDataDialog } from '../components/lgpd/EraseDataDialog'
import { useAuth } from '../contexts/AuthContext'
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
import { downloadCsv } from '../utils/csv'
import type { CreateUserPayload, UpdateUserPayload, User } from '../types'

interface UsuariosProps {
  toast: (msg: string, type?: 'success' | 'error') => void
}

export function Usuarios({ toast }: UsuariosProps) {
  const { user: currentUser } = useAuth()
  const apiRef = useGridApiRef()
  const [list, setList] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [confirmErase, setConfirmErase] = useState<User | null>(null)
  const [erasing, setErasing] = useState(false)

  const reload = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      setList(await usersApi.list())
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Falha ao carregar usuários.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  const stats = useMemo(() => {
    const total = list.length
    const ativos = list.filter((u) => u.status === 'ATIVO').length
    const pctAtivos = total === 0 ? 0 : Math.round((ativos / total) * 100)
    return { total, ativos, pctAtivos }
  }, [list])

  const upsert = async (target: User | null, payload: CreateUserPayload | UpdateUserPayload) => {
    if (target) {
      const updated = await usersApi.update(target.id, payload as UpdateUserPayload)
      setList((prev) => prev.map((u) => (u.id === target.id ? updated : u)))
      toast(`Usuário "${updated.name}" atualizado`)
    } else {
      const created = await usersApi.create(payload as CreateUserPayload)
      setList((prev) => [created, ...prev])
      toast(`Usuário "${created.name}" criado`)
    }
    setEditing(null)
    setCreating(false)
  }

  const toggleStatus = async (user: User) => {
    try {
      const updated =
        user.status === 'ATIVO'
          ? await usersApi.deactivate(user.id)
          : await usersApi.activate(user.id)
      setList((prev) => prev.map((u) => (u.id === user.id ? updated : u)))
      toast(`${updated.name} ${updated.status === 'ATIVO' ? 'ativado' : 'desativado'}`)
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Erro ao alterar status', 'error')
    }
  }

  const confirmRemove = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      await usersApi.remove(confirmDelete.id)
      setList((prev) => prev.filter((u) => u.id !== confirmDelete.id))
      toast(`"${confirmDelete.name}" removido`)
      setConfirmDelete(null)
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Erro ao excluir usuário', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const eraseData = async (reason: string) => {
    if (!confirmErase) return
    setErasing(true)
    try {
      const result = await usersApi.erase(confirmErase.id, reason)
      toast(
        result.action === 'ELIMINADO'
          ? `Dados de "${confirmErase.name}" eliminados do sistema`
          : `Dados pessoais de "${confirmErase.name}" anonimizados; o histórico de vendas foi preservado`,
      )
      setConfirmErase(null)
      await reload()
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Erro ao eliminar dados', 'error')
    } finally {
      setErasing(false)
    }
  }

  const exportar = () => {
    const visiveis = apiRef.current
      ? gridFilteredSortedRowEntriesSelector(apiRef).map((entry) => entry.model as User)
      : list

    if (visiveis.length === 0) {
      toast('Nada para exportar com os filtros atuais.')
      return
    }

    const today = new Date().toISOString().slice(0, 10)
    downloadCsv<User>({
      rows: visiveis,
      filename: `usuarios-${today}.csv`,
      columns: ['id', 'name', 'email', 'phone', 'role', 'status', { key: 'createdAt', header: 'created_at' }],
    })
    toast(`${visiveis.length} usuários exportados`)
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">Usuários</div>
          <div className="page-sub">Gerencie a equipe, perfis de acesso e disponibilidade.</div>
        </div>
        <div className="page-actions">
          <Button icon={I.download} onClick={exportar}>
            Exportar
          </Button>
          <Button variant="primary" icon={I.plus} onClick={() => setCreating(true)}>
            Novo usuário
          </Button>
        </div>
      </div>

      <StatGrid columns={2}>
        <Stat
          label="Total de Usuários"
          value={stats.total}
          delta={<>{I.spark}<span>equipe cadastrada</span></>}
        />
        <Stat
          label="Usuários Ativos"
          value={stats.ativos}
          delta={<>{I.spark}<span>{stats.pctAtivos}% do total</span></>}
        />
      </StatGrid>

      <TableCard>
        <TableToolbar>
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Buscar por nome ou e-mail…"
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

        <UsersDataGrid
          apiRef={apiRef}
          rows={list}
          loading={loading}
          quickFilter={query}
          currentUserId={currentUser?.id}
          onEdit={setEditing}
          onToggleStatus={(u) => void toggleStatus(u)}
          onDelete={setConfirmDelete}
          onErase={setConfirmErase}
        />
      </TableCard>

      {(creating || editing) && (
        <UserFormModal
          user={editing}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
          onSubmit={upsert}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Excluir usuário?"
          description={
            <>
              Esta ação não pode ser desfeita. O usuário <b>{confirmDelete.name}</b> perderá o acesso
              e será removido permanentemente.
            </>
          }
          confirmLabel="Excluir usuário"
          danger
          loading={deleting}
          onConfirm={confirmRemove}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {confirmErase && (
        <EraseDataDialog
          subject="usuário"
          name={confirmErase.name}
          loading={erasing}
          onConfirm={(reason) => void eraseData(reason)}
          onCancel={() => setConfirmErase(null)}
        />
      )}
    </div>
  )
}
