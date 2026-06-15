import { useEffect, useMemo, useState } from 'react'
import { I } from '../icons'
import { ApiError, clientsApi } from '../api'
import { ImportClientesModal } from '../components/clients/ImportClientesModal'
import { ClientFormModal } from '../components/clients/ClientFormModal'
import { ClientStatusBadge, ClientQualificationBadge } from '../components/clients/ClientBadges'
import {
  Button,
  Checkbox,
  Field,
  FilterPopover,
  Menu,
  MenuItem,
  SearchInput,
  Stat,
  StatGrid,
  TableCard,
  TableEmpty,
  TableError,
  TableResult,
  TableToolbar,
} from '../components/ui'
import { downloadCsv } from '../utils/csv'
import { formatCurrency, formatDate, maskCpf, maskPhone } from '../utils/format'
import type { Client, ClientStatus, CreateClientPayload, LeadQualification } from '../types'
import {
  CLIENT_STATUS_OPTIONS,
  LEAD_ORIGIN_LABELS,
  LEAD_QUALIFICATION_OPTIONS,
} from '../types'

const COLUMN_COUNT = 8

interface ClientesProps {
  toast: (msg: string) => void
}

export function Clientes({ toast }: ClientesProps) {
  const [list, setList] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | ClientStatus>('ALL')
  const [qualificationFilter, setQualificationFilter] = useState<'ALL' | LeadQualification>('ALL')
  const [editing, setEditing] = useState<Client | null>(null)
  const [creating, setCreating] = useState(false)
  const [menuFor, setMenuFor] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [importing, setImporting] = useState(false)

  const activeFiltersCount =
    (statusFilter !== 'ALL' ? 1 : 0) + (qualificationFilter !== 'ALL' ? 1 : 0)

  const clearFilters = () => {
    setStatusFilter('ALL')
    setQualificationFilter('ALL')
  }

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

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return list.filter((c) => {
      const matchesTerm =
        !term ||
        c.name.toLowerCase().includes(term) ||
        (c.email ?? '').toLowerCase().includes(term) ||
        (c.phone ?? '').includes(term)
      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter
      const matchesQualification =
        qualificationFilter === 'ALL' || c.qualification === qualificationFilter
      return matchesTerm && matchesStatus && matchesQualification
    })
  }, [list, query, statusFilter, qualificationFilter])

  const stats = useMemo(() => {
    const total = list.length
    const leads = list.filter((c) => c.status === 'LEAD').length
    const ativos = list.filter((c) => c.status === 'ATIVO').length
    const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 100))
    return { leads, ativos, pct }
  }, [list])

  const selectionActive = selected.size > 0
  const aggregated = selectionActive ? list.filter((c) => selected.has(c.id)) : list
  const faturamento = aggregated.reduce((sum, c) => sum + (c.revenue ?? 0), 0)
  const pedidos = aggregated.reduce((sum, c) => sum + (c.ordersCount ?? 0), 0)
  const selectionSuffix = selectionActive ? ` (${selected.size} sel.)` : ''
  const selectionHint = selectionActive ? 'do(s) cliente(s) selecionado(s)' : 'pedidos aprovados'

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
    setMenuFor(null)
    try {
      const updated = await clientsApi.qualify(client.id, 'QUALIFICADO')
      setList((prev) => prev.map((c) => (c.id === client.id ? { ...c, ...updated } : c)))
      toast(`Lead "${updated.name}" qualificado`)
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Erro ao qualificar lead')
    }
  }

  const registrarContato = async (client: Client) => {
    setMenuFor(null)
    try {
      const updated = await clientsApi.registerContact(client.id)
      setList((prev) => prev.map((c) => (c.id === client.id ? { ...c, ...updated } : c)))
      toast(`Contato registrado com ${updated.name}`)
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Erro ao registrar contato')
    }
  }

  const remover = async (client: Client) => {
    setMenuFor(null)
    if (!window.confirm(`Excluir "${client.name}"? Esta ação não pode ser desfeita.`)) return
    try {
      await clientsApi.remove(client.id)
      setList((prev) => prev.filter((c) => c.id !== client.id))
      setSelected((prev) => {
        const next = new Set(prev)
        next.delete(client.id)
        return next
      })
      toast(`"${client.name}" removido`)
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Erro ao excluir cliente')
    }
  }

  const allSelected = filtered.length > 0 && selected.size === filtered.length
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(filtered.map((c) => c.id)))
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

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
          <Button icon={I.upload} onClick={() => setImporting(true)}>
            Importar
          </Button>
          <Button icon={I.download} onClick={exportar}>
            Exportar
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
          <FilterPopover
            open={filtersOpen}
            activeCount={activeFiltersCount}
            onToggle={() => setFiltersOpen((v) => !v)}
            onClose={() => setFiltersOpen(false)}
            onClear={clearFilters}
          >
            <Field label="Status" inline>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'ALL' | ClientStatus)}
              >
                <option value="ALL">Todos</option>
                {CLIENT_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Qualificação" inline>
              <select
                value={qualificationFilter}
                onChange={(e) => setQualificationFilter(e.target.value as 'ALL' | LeadQualification)}
              >
                <option value="ALL">Todas</option>
                {LEAD_QUALIFICATION_OPTIONS.map((o) => (
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
              <th className="checkbox-col">
                <Checkbox checked={allSelected} onChange={toggleAll} aria-label="Selecionar todos" />
              </th>
              <th>Nome</th>
              <th>Telefone</th>
              <th>Forma de Contato</th>
              <th>Status</th>
              <th>Qualificação</th>
              <th>Último Contato</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading && <TableEmpty colSpan={COLUMN_COUNT}>Carregando clientes…</TableEmpty>}
            {!loading && filtered.length === 0 && (
              <TableEmpty colSpan={COLUMN_COUNT}>Nenhum cliente encontrado.</TableEmpty>
            )}
            {!loading &&
              filtered.map((c) => (
                <tr key={c.id}>
                  <td className="checkbox-col">
                    <Checkbox
                      checked={selected.has(c.id)}
                      onChange={() => toggleOne(c.id)}
                      aria-label={`Selecionar ${c.name}`}
                    />
                  </td>
                  <td>
                    <div className="cell-user">
                      <div>
                        <div className="name">{c.name}</div>
                        {c.cpf && <div className="sub">CPF {maskCpf(c.cpf)}</div>}
                      </div>
                    </div>
                  </td>
                  <td>{maskPhone(c.phone) || '—'}</td>
                  <td>{c.origin ? LEAD_ORIGIN_LABELS[c.origin] : '—'}</td>
                  <td>
                    <ClientStatusBadge status={c.status} />
                  </td>
                  <td>
                    <ClientQualificationBadge value={c.qualification} />
                  </td>
                  <td>{formatDate(c.lastContactAt)}</td>
                  <td style={{ position: 'relative', width: 48 }}>
                    <Menu
                      open={menuFor === c.id}
                      onToggle={() => setMenuFor((m) => (m === c.id ? null : c.id))}
                      onClose={() => setMenuFor(null)}
                    >
                      <MenuItem
                        icon={I.edit}
                        onClick={() => {
                          setEditing(c)
                          setMenuFor(null)
                        }}
                      >
                        Editar
                      </MenuItem>
                      {c.qualification === 'NAO_QUALIFICADO' && (
                        <MenuItem icon={I.star} onClick={() => qualificar(c)}>
                          Qualificar lead
                        </MenuItem>
                      )}
                      <MenuItem icon={I.phone} onClick={() => registrarContato(c)}>
                        Registrar contato
                      </MenuItem>
                      <MenuItem icon={I.trash} danger onClick={() => remover(c)}>
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
            ? '0 contatos'
            : `Mostrando 1–${filtered.length} de ${list.length} contatos`}
        </TableResult>
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
    </div>
  )
}
