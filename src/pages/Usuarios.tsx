import { useEffect, useMemo, useState } from 'react'
import { I } from '../icons'
import { ApiError, usersApi } from '../api'
import { UserFormModal } from '../components/users/UserFormModal'
import { UserRoleBadge, UserStatusBadge } from '../components/users/UserBadges'
import {
  Button,
  ConfirmDialog,
  Field,
  FilterPopover,
  Menu,
  MenuItem,
  Pagination,
  SearchInput,
  Stat,
  StatGrid,
  TableCard,
  TableEmpty,
  TableError,
  TableToolbar,
} from '../components/ui'
import { downloadCsv } from '../utils/csv'
import { formatDate, maskPhone } from '../utils/format'
import type { CreateUserPayload, Role, UpdateUserPayload, User, UserStatus } from '../types'
import { ROLE_OPTIONS, USER_STATUS_OPTIONS } from '../types'

const COLUMN_COUNT = 6

interface UsuariosProps {
  toast: (msg: string, type?: 'success' | 'error') => void
}

export function Usuarios({ toast }: UsuariosProps) {
  const [list, setList] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'ALL' | Role>('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | UserStatus>('ALL')
  const [draftRole, setDraftRole] = useState<'ALL' | Role>('ALL')
  const [draftStatus, setDraftStatus] = useState<'ALL' | UserStatus>('ALL')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [menuFor, setMenuFor] = useState<number | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const activeFiltersCount = (roleFilter !== 'ALL' ? 1 : 0) + (statusFilter !== 'ALL' ? 1 : 0)

  const openFilters = () => {
    setDraftRole(roleFilter)
    setDraftStatus(statusFilter)
    setFiltersOpen(true)
  }

  const applyFilters = () => {
    setRoleFilter(draftRole)
    setStatusFilter(draftStatus)
    setFiltersOpen(false)
  }

  const clearFilters = () => {
    setDraftRole('ALL')
    setDraftStatus('ALL')
  }

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

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return list.filter((u) => {
      const matchesTerm =
        !term || u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter
      const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter
      return matchesTerm && matchesRole && matchesStatus
    })
  }, [list, query, roleFilter, statusFilter])

  useEffect(() => {
    setPage(1)
  }, [query, roleFilter, statusFilter, pageSize])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

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
    setMenuFor(null)
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

  const exportar = () => {
    if (filtered.length === 0) {
      toast('Nada para exportar com os filtros atuais.')
      return
    }
    const today = new Date().toISOString().slice(0, 10)
    downloadCsv<User>({
      rows: filtered,
      filename: `usuarios-${today}.csv`,
      columns: ['id', 'name', 'email', 'phone', 'role', 'status', { key: 'createdAt', header: 'created_at' }],
    })
    toast(`${filtered.length} usuários exportados`)
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
        <Stat label="Total de Usuários" value={stats.total} />
        <Stat
          label="Usuários Ativos"
          value={stats.ativos}
          delta={<>{I.spark}<span>{stats.pctAtivos}% da equipe</span></>}
        />
      </StatGrid>

      <TableCard>
        <TableToolbar>
          <SearchInput value={query} onChange={setQuery} placeholder="Buscar por nome ou e-mail…" />
          <FilterPopover
            open={filtersOpen}
            activeCount={activeFiltersCount}
            onToggle={() => (filtersOpen ? setFiltersOpen(false) : openFilters())}
            onClose={() => setFiltersOpen(false)}
            onClear={clearFilters}
            onApply={applyFilters}
          >
            <Field label="Perfil" inline>
              <select value={draftRole} onChange={(e) => setDraftRole(e.target.value as 'ALL' | Role)}>
                <option value="ALL">Todos</option>
                {ROLE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status" inline>
              <select
                value={draftStatus}
                onChange={(e) => setDraftStatus(e.target.value as 'ALL' | UserStatus)}
              >
                <option value="ALL">Todos</option>
                {USER_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
          </FilterPopover>
        </TableToolbar>

        {loadError && (
          <TableError>
            {loadError} —{' '}
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

        <table className="tbl">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Perfil</th>
              <th>Status</th>
              <th>Cadastro</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading && <TableEmpty colSpan={COLUMN_COUNT}>Carregando usuários…</TableEmpty>}
            {!loading && filtered.length === 0 && (
              <TableEmpty colSpan={COLUMN_COUNT}>Nenhum usuário encontrado.</TableEmpty>
            )}
            {!loading &&
              filtered.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="cell-user">
                        <div>
                          <div className="name">{u.name}</div>
                          <div className="sub">{maskPhone(u.phone) || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <UserRoleBadge role={u.role} />
                    </td>
                    <td>
                      <UserStatusBadge status={u.status} />
                    </td>
                    <td>{formatDate(u.createdAt)}</td>
                    <td style={{ position: 'relative', width: 48 }}>
                      <Menu
                        open={menuFor === u.id}
                        onToggle={() => setMenuFor((m) => (m === u.id ? null : u.id))}
                        onClose={() => setMenuFor(null)}
                      >
                        <MenuItem
                          icon={I.edit}
                          onClick={() => {
                            setEditing(u)
                            setMenuFor(null)
                          }}
                        >
                          Editar
                        </MenuItem>
                        <MenuItem icon={I.power} onClick={() => toggleStatus(u)}>
                          {u.status === 'ATIVO' ? 'Desativar' : 'Ativar'} usuário
                        </MenuItem>
                        <MenuItem
                          icon={I.trash}
                          danger
                          onClick={() => {
                            setConfirmDelete(u)
                            setMenuFor(null)
                          }}
                        >
                          Excluir
                        </MenuItem>
                      </Menu>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>

        <TableResult>
          {filtered.length === 0
            ? '0 usuários'
            : `Mostrando 1–${filtered.length} de ${list.length} usuários`}
        </TableResult>
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
    </div>
  )
}
