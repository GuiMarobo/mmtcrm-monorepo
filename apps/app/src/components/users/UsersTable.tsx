import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import PowerSettingsNewOutlinedIcon from '@mui/icons-material/PowerSettingsNewOutlined'
import PrivacyTipOutlinedIcon from '@mui/icons-material/PrivacyTipOutlined'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { UserRoleBadge, UserStatusBadge } from './UserBadges'
import { DataTable } from '../common/DataTable'
import type { DataTableColumn } from '../common/DataTable'
import { sortRows } from '../common/dataTableUtils'
import { PersonCell } from '../common/PersonCell'
import { RowActionsMenu } from '../common/RowActionsMenu'
import type { RowAction } from '../common/RowActionsMenu'
import { formatDate, maskPhone } from '../../utils/format'
import type { User } from '../../types'

interface UsersTableProps {
  rows: User[]
  loading: boolean
  currentUserId: number | undefined
  onEdit: (user: User) => void
  onToggleStatus: (user: User) => void
  onDelete: (user: User) => void
  onErase: (user: User) => void
}

export function UsersTable({
  rows,
  loading,
  currentUserId,
  onEdit,
  onToggleStatus,
  onDelete,
  onErase,
}: UsersTableProps) {
  const theme = useTheme()
  const compact = useMediaQuery(theme.breakpoints.down('md'))
  const narrow = useMediaQuery(theme.breakpoints.down('sm'))

  const columns: DataTableColumn<User>[] = [
    {
      key: 'name',
      label: 'Nome',
      render: (user) => (
        <PersonCell
          name={user.name}
          secondary={maskPhone(user.phone) || 'Sem telefone'}
          anonymized={user.anonymizedAt !== null}
        />
      ),
    },
    { key: 'email', label: 'E-mail', hidden: narrow, render: (user) => user.email },
    { key: 'role', label: 'Perfil', render: (user) => <UserRoleBadge role={user.role} /> },
    {
      key: 'status',
      label: 'Status',
      hidden: narrow,
      render: (user) => <UserStatusBadge status={user.status} />,
    },
    {
      key: 'createdAt',
      label: 'Cadastro',
      hidden: compact,
      render: (user) => formatDate(user.createdAt),
    },
  ]

  const actionsFor = (user: User): RowAction[] => {
    const active = user.anonymizedAt === null
    const actions: RowAction[] = []
    if (active) {
      actions.push(
        {
          key: 'edit',
          label: 'Editar',
          icon: <EditOutlinedIcon />,
          onClick: () => onEdit(user),
        },
        {
          key: 'status',
          label: `${user.status === 'ATIVO' ? 'Desativar' : 'Ativar'} usuário`,
          icon: <PowerSettingsNewOutlinedIcon />,
          onClick: () => onToggleStatus(user),
        },
      )
    }
    actions.push({
      key: 'delete',
      label: 'Excluir',
      icon: <DeleteOutlineIcon />,
      onClick: () => onDelete(user),
    })
    if (active && user.id !== currentUserId) {
      actions.push({
        key: 'erase',
        label: 'Eliminar dados pessoais (LGPD)',
        icon: <PrivacyTipOutlinedIcon />,
        onClick: () => onErase(user),
      })
    }
    return actions
  }

  return (
    <DataTable
      label="Usuários"
      rows={sortRows(rows, (user) => user.name, 'asc')}
      columns={columns}
      getRowId={(user) => user.id}
      loading={loading}
      paginated={false}
      emptyMessage="Nenhum usuário encontrado"
      renderActions={(user) => (
        <RowActionsMenu label={`Ações de ${user.name}`} actions={actionsFor(user)} />
      )}
    />
  )
}
