/* MMT Urbana CRM — Usuários (integrado à API) */

import { useEffect, useMemo, useState } from 'react'
import { I } from '../icons'
import { ApiError, usersApi } from '../api'
import { displayProfile } from '../utils/avatar'
import { downloadCsv } from '../utils/csv'
import { formatDate } from '../utils/format'
import type {
  CreateUserPayload,
  Role,
  UpdateUserPayload,
  User,
  UserStatus,
} from '../types'
import {
  ROLE_LABELS,
  ROLE_OPTIONS,
  USER_STATUS_LABELS,
  USER_STATUS_OPTIONS,
} from '../types'

// ─── Badges ────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: Role }) {
  const map: Record<Role, string> = {
    ADMIN: 'b-purple',
    VENDEDOR: 'b-blue',
    ATENDENTE: 'b-amber',
    TECNICO: 'b-green',
  }
  return (
    <span className={'badge ' + map[role]}>
      <span className="dotb" />
      {ROLE_LABELS[role]}
    </span>
  )
}

function StatusBadge({ status }: { status: UserStatus }) {
  return status === 'ATIVO' ? (
    <span className="badge b-green"><span className="dotb" />{USER_STATUS_LABELS.ATIVO}</span>
  ) : (
    <span className="badge b-gray"><span className="dotb" />{USER_STATUS_LABELS.INATIVO}</span>
  )
}

// ─── Form Modal ────────────────────────────────────────────────────────────

interface FormState {
  name: string
  email: string
  phone: string
  password: string
  confirm: string
  role: Role
  status: UserStatus
}

const EMPTY_FORM: FormState = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirm: '',
  role: 'VENDEDOR',
  status: 'ATIVO',
}

interface UsuarioFormProps {
  user: User | null
  onClose: () => void
  onSubmit: (
    user: User | null,
    payload: CreateUserPayload | UpdateUserPayload,
  ) => Promise<void>
}

function UsuarioForm({ user, onClose, onSubmit }: UsuarioFormProps) {
  const [form, setForm] = useState<FormState>(
    user
      ? {
          name: user.name,
          email: user.email,
          phone: user.phone ?? '',
          password: '',
          confirm: '',
          role: user.role,
          status: user.status,
        }
      : EMPTY_FORM,
  )
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const isEdit = !!user

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }))
  }

  const submit = async () => {
    setError(null)

    if (!form.name.trim()) return setError('Informe o nome.')
    if (!form.email.trim()) return setError('Informe o e-mail.')

    if (!isEdit) {
      if (form.password.length < 8) {
        return setError('A senha deve ter ao menos 8 caracteres.')
      }
      if (form.password !== form.confirm) {
        return setError('As senhas não conferem.')
      }
    } else if (form.password) {
      // Em edição, a senha é opcional; se preenchida precisa bater com a confirmação.
      if (form.password.length < 8) {
        return setError('A nova senha deve ter ao menos 8 caracteres.')
      }
      if (form.password !== form.confirm) {
        return setError('As senhas não conferem.')
      }
    }

    setSaving(true)
    try {
      if (isEdit) {
        const payload: UpdateUserPayload = {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          role: form.role,
          status: form.status,
        }
        if (form.password) payload.password = form.password
        await onSubmit(user, payload)
      } else {
        const payload: CreateUserPayload = {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          phone: form.phone.trim() || null,
          role: form.role,
          status: form.status,
        }
        await onSubmit(null, payload)
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao salvar usuário.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 640 }}>
        <div className="modal-head">
          <div style={{ flex: 1 }}>
            <div className="modal-title">{isEdit ? 'Editar Usuário' : 'Novo Usuário'}</div>
            <div className="modal-sub">Defina credenciais, perfil de acesso e status.</div>
          </div>
          <div className="row-action" onClick={onClose}>{I.x}</div>
        </div>
        <div className="modal-body">
          <div className="field">
            <label>Nome Completo</label>
            <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ex: Fernanda Costa" />
          </div>
          <div className="field-row">
            <div className="field">
              <label>E-mail corporativo</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="nome@mmturbana.com.br"
              />
            </div>
            <div className="field">
              <label>Telefone</label>
              <input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="(11) 90000-0000" />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>{isEdit ? 'Nova senha (opcional)' : 'Senha'}</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                placeholder="Mín. 8 caracteres"
                autoComplete="new-password"
              />
            </div>
            <div className="field">
              <label>Confirmar Senha</label>
              <input
                type="password"
                value={form.confirm}
                onChange={(e) => set('confirm', e.target.value)}
                placeholder="Repita a senha"
                autoComplete="new-password"
              />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Perfil</label>
              <select value={form.role} onChange={(e) => set('role', e.target.value as Role)}>
                {ROLE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Status</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value as UserStatus)}>
                {USER_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          {error && <div style={{ color: 'var(--red)', fontSize: 12.5 }}>{error}</div>}
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="btn primary" onClick={submit} disabled={saving}>
            {I.check}
            <span>{saving ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Criar usuário'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Página ────────────────────────────────────────────────────────────────

interface UsuariosProps {
  toast: (msg: string) => void
}

export function Usuarios({ toast }: UsuariosProps) {
  const [list, setList] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [fRole, setFRole] = useState<'ALL' | Role>('ALL')
  const [fStatus, setFStatus] = useState<'ALL' | UserStatus>('ALL')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [menuFor, setMenuFor] = useState<number | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)

  /** Contagem de filtros ativos — exibida como badge no botão Filtros. */
  const activeFiltersCount =
    (fRole !== 'ALL' ? 1 : 0) + (fStatus !== 'ALL' ? 1 : 0)

  const clearFilters = () => {
    setFRole('ALL')
    setFStatus('ALL')
  }

  const reload = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await usersApi.list()
      setList(data)
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Falha ao carregar usuários.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  // Fecha o dropdown de ações ao clicar fora dele.
  useEffect(() => {
    if (menuFor === null) return
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target?.closest('[data-row-menu]')) setMenuFor(null)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [menuFor])

  // Fecha o popover de filtros ao clicar fora.
  useEffect(() => {
    if (!filtersOpen) return
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target?.closest('[data-filter-menu]')) setFiltersOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [filtersOpen])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return list.filter((u) => {
      const matchesTerm =
        !term ||
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
      const matchesRole = fRole === 'ALL' || u.role === fRole
      const matchesStatus = fStatus === 'ALL' || u.status === fStatus
      return matchesTerm && matchesRole && matchesStatus
    })
  }, [list, q, fRole, fStatus])

  const stats = useMemo(() => {
    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const total = list.length
    const ativos = list.filter((u) => u.status === 'ATIVO').length
    const novosNoMes = list.filter((u) => {
      const created = new Date(u.createdAt)
      return !Number.isNaN(created.getTime()) && created >= firstOfMonth
    }).length
    const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 100))
    return {
      total,
      ativos,
      novosNoMes,
      pctAtivos: pct(ativos),
    }
  }, [list])

  const upsert = async (
    target: User | null,
    payload: CreateUserPayload | UpdateUserPayload,
  ) => {
    if (target) {
      const updated = await usersApi.update(target.id, payload as UpdateUserPayload)
      setList((L) => L.map((u) => (u.id === target.id ? updated : u)))
      toast(`Usuário "${updated.name}" atualizado`)
    } else {
      const created = await usersApi.create(payload as CreateUserPayload)
      setList((L) => [created, ...L])
      toast(`Usuário "${created.name}" criado`)
    }
    setEditing(null)
    setCreating(false)
  }

  const toggleStatus = async (u: User) => {
    setMenuFor(null)
    try {
      const updated = u.status === 'ATIVO'
        ? await usersApi.deactivate(u.id)
        : await usersApi.activate(u.id)
      setList((L) => L.map((x) => (x.id === u.id ? updated : x)))
      toast(`${updated.name} ${updated.status === 'ATIVO' ? 'ativado' : 'desativado'}`)
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Erro ao alterar status')
    }
  }

  const remover = async (u: User) => {
    setMenuFor(null)
    if (!window.confirm(`Excluir "${u.name}"? Esta ação não pode ser desfeita.`)) return
    try {
      await usersApi.remove(u.id)
      setList((L) => L.filter((x) => x.id !== u.id))
      toast(`"${u.name}" removido`)
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Erro ao excluir usuário')
    }
  }

  /**
   * Exporta a lista FILTRADA para CSV. Inclui o id (numérico, legível) e
   * NUNCA inclui password (que já não vem da API por causa do userSelect,
   * mas a fixação explícita das colunas é defesa em profundidade).
   */
  const exportar = () => {
    if (filtered.length === 0) {
      toast('Nada para exportar com os filtros atuais.')
      return
    }
    const today = new Date().toISOString().slice(0, 10)
    downloadCsv<User>({
      rows: filtered,
      filename: `usuarios-${today}.csv`,
      columns: [
        'id',
        'name',
        'email',
        'phone',
        'role',
        'status',
        { key: 'createdAt', header: 'created_at' },
      ],
    })
    toast(`${filtered.length} usuários exportados`)
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">Usuários</div>
          <div className="page-sub">
            Gerencie a equipe, perfis de acesso e disponibilidade.
          </div>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={exportar}>{I.download}<span>Exportar</span></button>
          <button className="btn primary" onClick={() => setCreating(true)}>
            {I.plus}<span>Novo usuário</span>
          </button>
        </div>
      </div>

      <div className="stats-row" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <div className="stat">
          <div className="stat-label">Total de Usuários</div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-delta delta-up">
            {I.arrowUp}
            <span>
              {stats.novosNoMes === 0
                ? 'Sem novos este mês'
                : `+${stats.novosNoMes} ${stats.novosNoMes === 1 ? 'novo' : 'novos'} este mês`}
            </span>
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">Usuários Ativos</div>
          <div className="stat-value">{stats.ativos}</div>
          <div className="stat-delta delta-up">
            {I.spark}<span>{stats.pctAtivos}% da equipe</span>
          </div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <div className="input grow">
            <span style={{ color: 'var(--text-3)' }}>{I.search}</span>
            <input
              placeholder="Buscar por nome ou e-mail…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div style={{ position: 'relative' }} data-filter-menu>
            <button
              className="btn"
              onClick={() => setFiltersOpen((v) => !v)}
            >
              {I.filter}
              <span>Filtros</span>
              {activeFiltersCount > 0 && (
                <span
                  style={{
                    background: 'var(--primary)',
                    color: '#fff',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                    minWidth: 18,
                    height: 18,
                    padding: '0 6px',
                    display: 'inline-grid',
                    placeItems: 'center',
                  }}
                >
                  {activeFiltersCount}
                </span>
              )}
            </button>
            {filtersOpen && (
              <div
                data-filter-menu
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  background: '#fff',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 10,
                  boxShadow: 'var(--shadow-md)',
                  zIndex: 10,
                  padding: 14,
                  minWidth: 280,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div className="field" style={{ margin: 0 }}>
                  <label>Perfil</label>
                  <select
                    value={fRole}
                    onChange={(e) => setFRole(e.target.value as 'ALL' | Role)}
                  >
                    <option value="ALL">Todos</option>
                    {ROLE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label>Status</label>
                  <select
                    value={fStatus}
                    onChange={(e) => setFStatus(e.target.value as 'ALL' | UserStatus)}
                  >
                    <option value="ALL">Todos</option>
                    {USER_STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <button
                    className="btn"
                    onClick={clearFilters}
                    disabled={activeFiltersCount === 0}
                  >
                    Limpar
                  </button>
                  <button
                    className="btn primary"
                    onClick={() => setFiltersOpen(false)}
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {loadError && (
          <div
            style={{
              padding: '12px 16px',
              color: 'var(--red)',
              background: 'var(--red-bg)',
              borderBottom: '1px solid var(--border)',
              fontSize: 13,
            }}
          >
            {loadError} —{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); void reload() }}>tentar novamente</a>
          </div>
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
            {loading && (
              <tr>
                <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)' }}>
                  Carregando usuários…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)' }}>
                  Nenhum usuário encontrado.
                </td>
              </tr>
            )}
            {!loading && filtered.map((u) => {
              const profile = displayProfile(u.name, u.id)
              return (
                <tr key={u.id}>
                  <td>
                    <div className="cell-user">
                      <div className="avatar-sm" style={{ background: profile.color, color: '#fff' }}>
                        {profile.initials}
                      </div>
                      <div>
                        <div className="name">{u.name}</div>
                        <div className="sub">{u.phone ?? '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td><RoleBadge role={u.role} /></td>
                  <td><StatusBadge status={u.status} /></td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td style={{ position: 'relative', width: 48 }}>
                    <div
                      className="row-action"
                      data-row-menu
                      onClick={() => setMenuFor(menuFor === u.id ? null : u.id)}
                    >
                      {I.more}
                    </div>
                    {menuFor === u.id && (
                      <div
                        data-row-menu
                        style={{
                          position: 'absolute',
                          right: 8,
                          top: 38,
                          background: '#fff',
                          border: '1px solid var(--border-strong)',
                          borderRadius: 10,
                          boxShadow: 'var(--shadow-md)',
                          zIndex: 10,
                          minWidth: 200,
                          padding: 6,
                        }}
                      >
                        <div className="nav-item" onClick={() => { setEditing(u); setMenuFor(null) }}>
                          <span className="nav-ico">{I.edit}</span><span>Editar</span>
                        </div>
                        <div className="nav-item" onClick={() => toggleStatus(u)}>
                          <span className="nav-ico">{I.power}</span>
                          <span>{u.status === 'ATIVO' ? 'Desativar' : 'Ativar'} usuário</span>
                        </div>
                        <div
                          className="nav-item"
                          style={{ color: 'var(--red)' }}
                          onClick={() => remover(u)}
                        >
                          <span className="nav-ico">{I.trash}</span><span>Excluir</span>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="pagination">
          <div className="result">
            {filtered.length === 0
              ? '0 usuários'
              : `Mostrando 1–${filtered.length} de ${list.length} usuários`}
          </div>
        </div>
      </div>

      {(creating || editing) && (
        <UsuarioForm
          user={editing}
          onClose={() => { setCreating(false); setEditing(null) }}
          onSubmit={upsert}
        />
      )}
    </div>
  )
}
