import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import PrivacyTipOutlinedIcon from '@mui/icons-material/PrivacyTipOutlined'
import StarBorderOutlinedIcon from '@mui/icons-material/StarBorderOutlined'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { ClientQualificationBadge, ClientStatusBadge } from './ClientBadges'
import { DataTable } from '../common/DataTable'
import type { DataTableColumn, RowId } from '../common/DataTable'
import { PersonCell } from '../common/PersonCell'
import { RowActionsMenu } from '../common/RowActionsMenu'
import type { RowAction } from '../common/RowActionsMenu'
import { formatDate, maskCpf, maskPhone } from '../../utils/format'
import type { Client, Role } from '../../types'
import {
  CLIENT_STATUS_LABELS,
  LEAD_ORIGIN_LABELS,
  LEAD_QUALIFICATION_LABELS,
} from '../../types'

interface ClientsTableProps {
  rows: Client[]
  loading: boolean
  selected: ReadonlySet<RowId>
  onSelectionChange: (next: Set<RowId>) => void
  role: Role | undefined
  onEdit: (client: Client) => void
  onQualify: (client: Client) => void
  onRegisterContact: (client: Client) => void
  onDelete: (client: Client) => void
  onErase: (client: Client) => void
}

const originLabel = (client: Client) =>
  client.origin ? LEAD_ORIGIN_LABELS[client.origin] : '-'

export function ClientsTable({
  rows,
  loading,
  selected,
  onSelectionChange,
  role,
  onEdit,
  onQualify,
  onRegisterContact,
  onDelete,
  onErase,
}: ClientsTableProps) {
  const theme = useTheme()
  const compact = useMediaQuery(theme.breakpoints.down('md'))
  const narrow = useMediaQuery(theme.breakpoints.down('sm'))

  const columns: DataTableColumn<Client>[] = [
    {
      key: 'name',
      label: 'Nome',
      sortValue: (client) => client.name,
      render: (client) => (
        <PersonCell
          name={client.name}
          secondary={client.cpf ? `CPF ${maskCpf(client.cpf)}` : 'Sem CPF'}
          anonymized={client.anonymizedAt !== null}
        />
      ),
    },
    {
      key: 'phone',
      label: 'Telefone',
      hidden: narrow,
      sortValue: (client) => client.phone ?? '',
      render: (client) => maskPhone(client.phone) || '-',
    },
    {
      key: 'origin',
      label: 'Forma de Contato',
      hidden: compact,
      sortValue: originLabel,
      render: originLabel,
    },
    {
      key: 'status',
      label: 'Status',
      sortValue: (client) => CLIENT_STATUS_LABELS[client.status],
      render: (client) => <ClientStatusBadge status={client.status} />,
    },
    {
      key: 'qualification',
      label: 'Qualificação',
      hidden: narrow,
      sortValue: (client) => LEAD_QUALIFICATION_LABELS[client.qualification],
      render: (client) => <ClientQualificationBadge value={client.qualification} />,
    },
    {
      key: 'lastContactAt',
      label: 'Último Contato',
      hidden: compact,
      sortValue: (client) => client.lastContactAt ?? '',
      render: (client) => formatDate(client.lastContactAt),
    },
  ]

  const actionsFor = (client: Client): RowAction[] => {
    const active = client.anonymizedAt === null
    const actions: RowAction[] = []
    if (active) {
      actions.push({
        key: 'edit',
        label: 'Editar',
        icon: <EditOutlinedIcon />,
        onClick: () => onEdit(client),
      })
    }
    if (active && client.qualification === 'NAO_QUALIFICADO') {
      actions.push({
        key: 'qualify',
        label: 'Qualificar lead',
        icon: <StarBorderOutlinedIcon />,
        onClick: () => onQualify(client),
      })
    }
    if (active) {
      actions.push({
        key: 'contact',
        label: 'Registrar contato',
        icon: <PhoneOutlinedIcon />,
        onClick: () => onRegisterContact(client),
      })
    }
    actions.push({
      key: 'delete',
      label: 'Excluir',
      icon: <DeleteOutlineIcon />,
      onClick: () => onDelete(client),
    })
    if (role === 'ADMIN' && active) {
      actions.push({
        key: 'erase',
        label: 'Eliminar dados pessoais (LGPD)',
        icon: <PrivacyTipOutlinedIcon />,
        onClick: () => onErase(client),
      })
    }
    return actions
  }

  return (
    <DataTable
      label="Clientes"
      rows={rows}
      columns={columns}
      getRowId={(client) => client.id}
      loading={loading}
      initialSort={{ key: 'name', direction: 'asc' }}
      emptyMessage="Nenhum cliente encontrado"
      selection={{
        selected,
        onChange: onSelectionChange,
        rowLabel: (client) => client.name,
      }}
      renderActions={(client) => (
        <RowActionsMenu label={`Ações de ${client.name}`} actions={actionsFor(client)} />
      )}
    />
  )
}
