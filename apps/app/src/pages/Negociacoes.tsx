import { useEffect, useRef, useState } from 'react'
import { I } from '../icons'
import { ApiError, clientsApi, negotiationsApi } from '../api'
import { NegotiationFormModal } from '../components/negotiations/NegotiationFormModal'
import { ConvertToOrderModal } from '../components/negotiations/ConvertToOrderModal'
import { NegotiationBoard } from '../components/negotiations/NegotiationBoard'
import { NegotiationListView } from '../components/negotiations/NegotiationListView'
import { NegotiationStats } from '../components/negotiations/NegotiationStats'
import { TransitionConfirmDialog } from '../components/negotiations/TransitionConfirmDialog'
import { ViewSwitch } from '../components/negotiations/ViewSwitch'
import type { NegotiationView } from '../components/negotiations/ViewSwitch'
import {
  canTransition,
  TRANSITION_REFUSAL,
} from '../components/negotiations/transitions'
import { Button, ConfirmDialog, TableCard, TableError } from '../components/ui'
import type {
  Client,
  CreateNegotiationPayload,
  Negotiation,
  NegotiationStatus,
  PaymentMethod,
} from '../types'

interface NegociacoesProps {
  toast: (msg: string, type?: 'success' | 'error') => void
}

interface PendingTransition {
  negotiation: Negotiation
  target: NegotiationStatus
}

export function Negociacoes({ toast }: NegociacoesProps) {
  const [list, setList] = useState<Negotiation[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [view, setView] = useState<NegotiationView>('quadro')
  const [menuFor, setMenuFor] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Negotiation | null>(null)
  const [converting, setConverting] = useState<Negotiation | null>(null)
  const [pending, setPending] = useState<PendingTransition | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Negotiation | null>(null)
  const [busy, setBusy] = useState(false)
  const resolver = useRef<((applied: boolean) => void) | null>(null)

  const settle = (applied: boolean) => {
    resolver.current?.(applied)
    resolver.current = null
  }

  const reload = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const [negotiations, clientList] = await Promise.all([
        negotiationsApi.list(),
        clientsApi.list(),
      ])
      setList(negotiations)
      setClients(clientList)
    } catch (err) {
      setLoadError(
        err instanceof ApiError ? err.message : 'Falha ao carregar negociações.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  const replaceInList = (updated: Negotiation) =>
    setList((prev) => prev.map((n) => (n.id === updated.id ? updated : n)))

  const save = async (payload: CreateNegotiationPayload) => {
    if (editing) {
      const updated = await negotiationsApi.update(editing.id, payload)
      replaceInList(updated)
      toast('Negociação atualizada')
    } else {
      const created = await negotiationsApi.create(payload)
      setList((prev) => [created, ...prev])
      toast('Negociação aberta')
    }
    setEditing(null)
    setCreating(false)
  }

  const requestTransition = (
    negotiation: Negotiation,
    target: NegotiationStatus,
  ): Promise<boolean> => {
    setMenuFor(null)
    if (negotiation.status === target) return Promise.resolve(false)
    if (!canTransition(negotiation.status, target)) {
      toast(TRANSITION_REFUSAL, 'error')
      return Promise.resolve(false)
    }
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve
      if (target === 'GANHA') setConverting(negotiation)
      else setPending({ negotiation, target })
    })
  }

  const applyConvert = async (paymentMethod: PaymentMethod) => {
    if (!converting) return
    setBusy(true)
    try {
      const updated = await negotiationsApi.convert(converting.id, paymentMethod)
      replaceInList(updated)
      toast(`Negociação ganha · pedido ${updated.order?.code ?? ''} gerado`)
      setConverting(null)
      settle(true)
    } catch (err) {
      toast(
        err instanceof ApiError ? err.message : 'Erro ao converter em pedido',
        'error',
      )
      settle(false)
    } finally {
      setBusy(false)
    }
  }

  const applyPending = async () => {
    if (!pending) return
    const { negotiation, target } = pending
    setBusy(true)
    try {
      const updated =
        target === 'PERDIDA'
          ? await negotiationsApi.cancel(negotiation.id)
          : await negotiationsApi.reopen(negotiation.id)
      replaceInList(updated)
      toast(
        target === 'PERDIDA'
          ? 'Negociação marcada como perdida'
          : 'Negociação reaberta',
      )
      setPending(null)
      settle(true)
    } catch (err) {
      toast(
        err instanceof ApiError ? err.message : 'Erro ao mudar a situação',
        'error',
      )
      settle(false)
    } finally {
      setBusy(false)
    }
  }

  const applyDelete = async () => {
    if (!confirmDelete) return
    setBusy(true)
    try {
      await negotiationsApi.remove(confirmDelete.id)
      setList((prev) => prev.filter((n) => n.id !== confirmDelete.id))
      toast('Negociação excluída')
      setConfirmDelete(null)
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Erro ao excluir', 'error')
    } finally {
      setBusy(false)
    }
  }

  const openEdit = (negotiation: Negotiation) => {
    setEditing(negotiation)
    setMenuFor(null)
  }

  const openDelete = (negotiation: Negotiation) => {
    setConfirmDelete(negotiation)
    setMenuFor(null)
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">Negociações</div>
          <div className="page-sub">
            Acompanhe as tratativas comerciais da abertura ao fechamento.
          </div>
        </div>
        <div className="page-actions">
          <ViewSwitch view={view} onChange={setView} />
          <Button variant="primary" icon={I.plus} onClick={() => setCreating(true)}>
            Nova negociação
          </Button>
        </div>
      </div>

      <NegotiationStats list={list} />

      {loadError && (
        <TableCard>
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
        </TableCard>
      )}

      {!loadError &&
        view === 'quadro' &&
        (loading ? (
          <TableCard>
            <div className="board-empty">Carregando negociações…</div>
          </TableCard>
        ) : (
          <NegotiationBoard
            items={list}
            menuFor={menuFor}
            onMenuToggle={setMenuFor}
            onMove={requestTransition}
            onRefuse={() => toast(TRANSITION_REFUSAL, 'error')}
            onEdit={openEdit}
            onDelete={openDelete}
          />
        ))}

      {!loadError && view === 'lista' && (
        <NegotiationListView
          items={list}
          loading={loading}
          menuFor={menuFor}
          onMenuToggle={setMenuFor}
          onEdit={openEdit}
          onRequestTransition={(n, t) => void requestTransition(n, t)}
          onDelete={openDelete}
        />
      )}

      {(creating || editing) && (
        <NegotiationFormModal
          negotiation={editing}
          clients={clients}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
          onSave={save}
        />
      )}

      {converting && (
        <ConvertToOrderModal
          negotiation={converting}
          loading={busy}
          onConfirm={(pm) => void applyConvert(pm)}
          onCancel={() => {
            setConverting(null)
            settle(false)
          }}
        />
      )}

      {pending && (
        <TransitionConfirmDialog
          negotiation={pending.negotiation}
          target={pending.target}
          loading={busy}
          onConfirm={() => void applyPending()}
          onCancel={() => {
            setPending(null)
            settle(false)
          }}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Excluir negociação?"
          description={
            <>
              A negociação de <b>{confirmDelete.client?.name}</b> deixará de aparecer
              nas consultas. O histórico é preservado na base.
            </>
          }
          confirmLabel="Excluir negociação"
          danger
          loading={busy}
          onConfirm={() => void applyDelete()}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
