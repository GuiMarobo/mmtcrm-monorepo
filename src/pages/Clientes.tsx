/* MMT Urbana CRM — Clientes & Leads (integrado à API) */

import { useEffect, useMemo, useState } from 'react'
import { I } from '../icons'
import { ApiError, clientsApi } from '../api'
import { ImportClientesModal } from '../components/ImportClientesModal'
import { displayProfile } from '../utils/avatar'
import { downloadCsv } from '../utils/csv'
import { formatDate } from '../utils/format'
import type {
  Client,
  ClientStatus,
  CreateClientPayload,
  LeadOrigin,
  LeadQualification,
} from '../types'
import {
  CLIENT_STATUS_LABELS,
  CLIENT_STATUS_OPTIONS,
  LEAD_ORIGIN_LABELS,
  LEAD_ORIGIN_OPTIONS,
  LEAD_QUALIFICATION_LABELS,
  LEAD_QUALIFICATION_OPTIONS,
} from '../types'

// ─── Badges ────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ClientStatus }) {
  const map: Record<ClientStatus, string> = {
    LEAD: 'b-blue',
    ATIVO: 'b-green',
    INATIVO: 'b-gray',
  }
  return (
    <span className={'badge ' + map[status]}>
      <span className="dotb" />
      {CLIENT_STATUS_LABELS[status]}
    </span>
  )
}

function QualifBadge({ q }: { q: LeadQualification }) {
  const map: Record<LeadQualification, string> = {
    ALTA_INTENCAO: 'b-purple',
    QUALIFICADO: 'b-amber',
    NAO_QUALIFICADO: 'b-gray',
  }
  return <span className={'badge ' + map[q]}>{LEAD_QUALIFICATION_LABELS[q]}</span>
}

// ─── Form Modal ────────────────────────────────────────────────────────────

interface ClienteFormProps {
  client: Client | null
  onClose: () => void
  onSave: (payload: CreateClientPayload) => Promise<void>
}

const EMPTY_FORM: CreateClientPayload = {
  name: '',
  email: '',
  phone: '',
  cpf: '',
  address: '',
  origin: 'WHATSAPP',
  status: 'LEAD',
  qualification: 'NAO_QUALIFICADO',
  notes: '',
}

function ClienteForm({ client, onClose, onSave }: ClienteFormProps) {
  const [form, setForm] = useState<CreateClientPayload>(
    client
      ? {
          name: client.name,
          email: client.email ?? '',
          phone: client.phone ?? '',
          cpf: client.cpf ?? '',
          address: client.address ?? '',
          origin: client.origin ?? 'WHATSAPP',
          status: client.status,
          qualification: client.qualification,
          notes: client.notes ?? '',
        }
      : EMPTY_FORM,
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = <K extends keyof CreateClientPayload>(k: K, v: CreateClientPayload[K]) => {
    setForm((f) => ({ ...f, [k]: v }))
  }
  const isEdit = !!client

  const submit = async () => {
    setError(null)
    if (!form.name.trim()) {
      setError('Informe o nome do cliente.')
      return
    }
    setSaving(true)
    try {
      // Limpa strings vazias para que o backend trate como ausência (campos opcionais).
      const payload: CreateClientPayload = {
        ...form,
        email: form.email?.trim() ? form.email.trim() : null,
        phone: form.phone?.trim() ? form.phone.trim() : null,
        cpf: form.cpf?.trim() ? form.cpf.trim() : null,
        address: form.address?.trim() ? form.address.trim() : null,
        notes: form.notes?.trim() ? form.notes.trim() : null,
      }
      await onSave(payload)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao salvar cliente.')
    } finally {
      setSaving(false)
    }
  }


  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 640 }}>
        <div className="modal-head">
          <div style={{ flex: 1 }}>
            <div className="modal-title">{isEdit ? 'Editar Cliente' : 'Novo Cliente / Lead'}</div>
            <div className="modal-sub">Preencha os dados de contato e classificação.</div>
          </div>
          <div className="row-action" onClick={onClose}>{I.x}</div>
        </div>
        <div className="modal-body">
          <div className="field">
            <label>Nome Completo</label>
            <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ex: Mariana Souza" />
          </div>
          <div className="field-row">
            <div className="field">
              <label>E-mail</label>
              <input
                type="email"
                value={form.email ?? ''}
                onChange={(e) => set('email', e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="field">
              <label>Telefone</label>
              <input
                value={form.phone ?? ''}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="(11) 90000-0000"
              />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>CPF</label>
              <input
                value={form.cpf ?? ''}
                onChange={(e) => set('cpf', e.target.value)}
                placeholder="000.000.000-00"
              />
            </div>
            <div className="field">
              <label>Canal de Origem</label>
              <select
                value={form.origin ?? 'WHATSAPP'}
                onChange={(e) => set('origin', e.target.value as LeadOrigin)}
              >
                {LEAD_ORIGIN_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="field">
            <label>Endereço</label>
            <input
              value={form.address ?? ''}
              onChange={(e) => set('address', e.target.value)}
              placeholder="Rua, número — Cidade/UF"
            />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Status</label>
              <select
                value={form.status ?? 'LEAD'}
                onChange={(e) => set('status', e.target.value as ClientStatus)}
              >
                {CLIENT_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Qualificação</label>
              <select
                value={form.qualification ?? 'NAO_QUALIFICADO'}
                onChange={(e) => set('qualification', e.target.value as LeadQualification)}
              >
                {LEAD_QUALIFICATION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          {error && (
            <div style={{ color: 'var(--red)', fontSize: 12.5 }}>{error}</div>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="btn primary" onClick={submit} disabled={saving}>
            {I.check}
            <span>{saving ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Cadastrar cliente'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Página ────────────────────────────────────────────────────────────────

interface ClientesProps {
  toast: (msg: string) => void
}

export function Clientes({ toast }: ClientesProps) {
  const [list, setList] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [fStatus, setFStatus] = useState<'ALL' | ClientStatus>('ALL')
  const [fQualif, setFQualif] = useState<'ALL' | LeadQualification>('ALL')
  const [editing, setEditing] = useState<Client | null>(null)
  const [creating, setCreating] = useState(false)
  const [menuFor, setMenuFor] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [importing, setImporting] = useState(false)

  /** Contagem de filtros ativos — exibida como badge no botão Filtros. */
  const activeFiltersCount =
    (fStatus !== 'ALL' ? 1 : 0) + (fQualif !== 'ALL' ? 1 : 0)

  const clearFilters = () => {
    setFStatus('ALL')
    setFQualif('ALL')
  }

  const reload = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await clientsApi.list()
      setList(data)
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Falha ao carregar clientes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  // Fecha o dropdown de ações ao clicar fora dele.
  useEffect(() => {
    if (!menuFor) return
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
    return list.filter((c) => {
      const matchesTerm =
        !term ||
        c.name.toLowerCase().includes(term) ||
        (c.email ?? '').toLowerCase().includes(term) ||
        (c.phone ?? '').includes(term)
      const matchesStatus = fStatus === 'ALL' || c.status === fStatus
      const matchesQualif = fQualif === 'ALL' || c.qualification === fQualif
      return matchesTerm && matchesStatus && matchesQualif
    })
  }, [list, q, fStatus, fQualif])

  const stats = useMemo(() => {
    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const total = list.length
    const leads = list.filter((c) => c.status === 'LEAD').length
    const ativos = list.filter((c) => c.status === 'ATIVO').length
    const alta = list.filter((c) => c.qualification === 'ALTA_INTENCAO').length
    const novosNoMes = list.filter((c) => {
      const created = new Date(c.createdAt)
      return !Number.isNaN(created.getTime()) && created >= firstOfMonth
    }).length
    const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 100))
    return {
      total,
      leads,
      ativos,
      alta,
      novosNoMes,
      pctLeads: pct(leads),
      pctAtivos: pct(ativos),
      pctAlta: pct(alta),
    }
  }, [list])

  const saveClient = async (payload: CreateClientPayload) => {
    if (editing) {
      const updated = await clientsApi.update(editing.id, payload)
      setList((L) => L.map((c) => (c.id === editing.id ? updated : c)))
      toast(`Cliente "${updated.name}" atualizado`)
    } else {
      const created = await clientsApi.create(payload)
      setList((L) => [created, ...L])
      toast(`Cliente "${created.name}" cadastrado`)
    }
    setEditing(null)
    setCreating(false)
  }

  const qualificar = async (c: Client) => {
    setMenuFor(null)
    try {
      const updated = await clientsApi.qualify(c.id, 'QUALIFICADO')
      setList((L) => L.map((x) => (x.id === c.id ? updated : x)))
      toast(`Lead "${updated.name}" qualificado`)
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Erro ao qualificar lead')
    }
  }

  const registrarContato = async (c: Client) => {
    setMenuFor(null)
    try {
      const updated = await clientsApi.registerContact(c.id)
      setList((L) => L.map((x) => (x.id === c.id ? updated : x)))
      toast(`Contato registrado com ${updated.name}`)
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Erro ao registrar contato')
    }
  }

  const remover = async (c: Client) => {
    setMenuFor(null)
    if (!window.confirm(`Excluir "${c.name}"? Esta ação não pode ser desfeita.`)) return
    try {
      await clientsApi.remove(c.id)
      setList((L) => L.filter((x) => x.id !== c.id))
      setSelected((s) => {
        const n = new Set(s)
        n.delete(c.id)
        return n
      })
      toast(`"${c.name}" removido`)
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Erro ao excluir cliente')
    }
  }

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map((c) => c.id)))
  }
  const toggleOne = (id: string) => {
    setSelected((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  /**
   * Exporta a lista FILTRADA para CSV (round-trip safe — usa valores
   * canônicos dos enums, prontos para serem re-importados pelo backend).
   */
  const exportar = () => {
    if (filtered.length === 0) {
      toast('Nada para exportar com os filtros atuais.')
      return
    }
    const today = new Date().toISOString().slice(0, 10)
    downloadCsv<Client>({
      rows: filtered,
      filename: `clientes-${today}.csv`,
      columns: [
        'name',
        'email',
        'phone',
        'cpf',
        'address',
        'status',
        'qualification',
        'origin',
        'notes',
        { key: 'lastContactAt', header: 'last_contact_at' },
        { key: 'createdAt', header: 'created_at' },
      ],
    })
    toast(`${filtered.length} contatos exportados`)
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
          <button className="btn" onClick={() => setImporting(true)}>
            {I.upload}<span>Importar</span>
          </button>
          <button className="btn" onClick={exportar}>{I.download}<span>Exportar</span></button>
          <button className="btn primary" onClick={() => setCreating(true)}>
            {I.plus}<span>Novo cliente</span>
          </button>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat">
          <div className="stat-label">Total de Contatos</div>
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
          <div className="stat-label">Leads em aberto</div>
          <div className="stat-value">{stats.leads}</div>
          <div className="stat-delta delta-up">
            {I.spark}<span>{stats.pctLeads}% do total</span>
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">Clientes Ativos</div>
          <div className="stat-value">{stats.ativos}</div>
          <div className="stat-delta delta-up">
            {I.spark}<span>{stats.pctAtivos}% do total</span>
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">Alta Intenção</div>
          <div className="stat-value">{stats.alta}</div>
          <div className="stat-delta delta-up">
            {I.spark}<span>{stats.pctAlta}% do total</span>
          </div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <div className="input grow">
            <span style={{ color: 'var(--text-3)' }}>{I.search}</span>
            <input
              placeholder="Buscar por nome, e-mail ou telefone…"
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
                  <label>Status</label>
                  <select
                    value={fStatus}
                    onChange={(e) => setFStatus(e.target.value as 'ALL' | ClientStatus)}
                  >
                    <option value="ALL">Todos</option>
                    {CLIENT_STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label>Qualificação</label>
                  <select
                    value={fQualif}
                    onChange={(e) => setFQualif(e.target.value as 'ALL' | LeadQualification)}
                  >
                    <option value="ALL">Todas</option>
                    {LEAD_QUALIFICATION_OPTIONS.map((o) => (
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
              <th className="checkbox-col">
                <div
                  className={
                    'checkbox ' +
                    (selected.size && selected.size === filtered.length ? 'checked' : '')
                  }
                  onClick={toggleAll}
                >
                  {selected.size === filtered.length && filtered.length > 0 && I.check}
                </div>
              </th>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Localização</th>
              <th className="num">QTD Pedidos</th>
              <th className="num">Quantidade gasta</th>
              <th>Status</th>
              <th>Qualificação</th>
              <th>Último contato</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={10} style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)' }}>
                  Carregando clientes…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={10} style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)' }}>
                  Nenhum cliente encontrado.
                </td>
              </tr>
            )}
            {!loading && filtered.map((c) => {
              const profile = displayProfile(c.name, c.id)
              return (
                <tr key={c.id}>
                  <td className="checkbox-col">
                    <div
                      className={'checkbox ' + (selected.has(c.id) ? 'checked' : '')}
                      onClick={() => toggleOne(c.id)}
                    >
                      {selected.has(c.id) && I.check}
                    </div>
                  </td>
                  <td>
                    <div className="cell-user">
                      <div className="avatar-sm" style={{ background: profile.color, color: '#fff' }}>
                        {profile.initials}
                      </div>
                      <div>
                        <div className="name">{c.name}</div>
                        <div className="sub">
                          {c.origin ? LEAD_ORIGIN_LABELS[c.origin] : '—'}
                          {c.phone ? ` · ${c.phone}` : ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{c.email ?? '—'}</td>
                  <td>{c.address ?? '—'}</td>
                  <td className="num"><b>0</b></td>
                  <td className="num">R$ 0,00</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td><QualifBadge q={c.qualification} /></td>
                  <td>{formatDate(c.lastContactAt)}</td>
                  <td style={{ position: 'relative', width: 48 }}>
                    <div
                      className="row-action"
                      data-row-menu
                      onClick={() => setMenuFor(menuFor === c.id ? null : c.id)}
                    >
                      {I.more}
                    </div>
                    {menuFor === c.id && (
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
                        <div className="nav-item" onClick={() => { setEditing(c); setMenuFor(null) }}>
                          <span className="nav-ico">{I.edit}</span><span>Editar</span>
                        </div>
                        {c.qualification === 'NAO_QUALIFICADO' && (
                          <div className="nav-item" onClick={() => qualificar(c)}>
                            <span className="nav-ico">{I.star}</span><span>Qualificar lead</span>
                          </div>
                        )}
                        <div className="nav-item" onClick={() => registrarContato(c)}>
                          <span className="nav-ico">{I.phone}</span><span>Registrar contato</span>
                        </div>
                        <div
                          className="nav-item"
                          style={{ color: 'var(--red)' }}
                          onClick={() => remover(c)}
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
              ? '0 contatos'
              : `Mostrando 1–${filtered.length} de ${list.length} contatos`}
          </div>
        </div>
      </div>

      {(creating || editing) && (
        <ClienteForm
          client={editing}
          onClose={() => { setCreating(false); setEditing(null) }}
          onSave={saveClient}
        />
      )}

      {importing && (
        <ImportClientesModal
          onClose={() => setImporting(false)}
          onImported={() => { void reload() }}
        />
      )}
    </div>
  )
}
