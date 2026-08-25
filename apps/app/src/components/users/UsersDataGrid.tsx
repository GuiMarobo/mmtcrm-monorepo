import Box from '@mui/material/Box'
import { DataGridPremium, GridActionsCellItem } from '@mui/x-data-grid-premium'
import type { GridApiPremium, GridColDef } from '@mui/x-data-grid-premium'
import type { RefObject } from 'react'
import { ptBR } from '@mui/x-data-grid/locales'
import { I } from '../../icons'
import { UserRoleBadge, UserStatusBadge } from './UserBadges'
import { Badge } from '../ui'
import { formatDate, maskPhone } from '../../utils/format'
import type { User } from '../../types'
import { ROLE_OPTIONS, USER_STATUS_OPTIONS } from '../../types'

interface UsersDataGridProps {
  apiRef: RefObject<GridApiPremium | null>
  rows: User[]
  loading: boolean
  quickFilter: string
  currentUserId: number | undefined
  onEdit: (user: User) => void
  onToggleStatus: (user: User) => void
  onDelete: (user: User) => void
  onErase: (user: User) => void
}

export function UsersDataGrid({
  apiRef,
  rows,
  loading,
  quickFilter,
  currentUserId,
  onEdit,
  onToggleStatus,
  onDelete,
  onErase,
}: UsersDataGridProps) {
  const columns: GridColDef<User>[] = [
    {
      field: 'name',
      headerName: 'Nome',
      flex: 1.6,
      minWidth: 200,
      renderCell: ({ row }) => (
        <Box sx={{ py: 1 }}>
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}
          >
            {row.name}
            {row.anonymizedAt && <Badge tone="gray">Anonimizado</Badge>}
          </Box>
          <Box sx={{ color: 'text.disabled', fontSize: 12 }}>
            {maskPhone(row.phone) || '-'}
          </Box>
        </Box>
      ),
    },
    { field: 'email', headerName: 'E-mail', flex: 1.6, minWidth: 200 },
    {
      field: 'role',
      headerName: 'Perfil',
      flex: 1,
      minWidth: 130,
      type: 'singleSelect',
      valueOptions: ROLE_OPTIONS,
      renderCell: ({ row }) => <UserRoleBadge role={row.role} />,
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.9,
      minWidth: 110,
      type: 'singleSelect',
      valueOptions: USER_STATUS_OPTIONS,
      renderCell: ({ row }) => <UserStatusBadge status={row.status} />,
    },
    {
      field: 'createdAt',
      headerName: 'Cadastro',
      flex: 1,
      minWidth: 130,
      valueFormatter: (value: string) => formatDate(value),
    },
    {
      field: 'acoes',
      type: 'actions',
      headerName: '',
      width: 56,
      getActions: ({ row }) => {
        const actions = []
        if (!row.anonymizedAt) {
          actions.push(
            <GridActionsCellItem
              key="edit"
              icon={I.edit}
              label="Editar"
              onClick={() => onEdit(row)}
              showInMenu
            />,
          )
          actions.push(
            <GridActionsCellItem
              key="status"
              icon={I.power}
              label={`${row.status === 'ATIVO' ? 'Desativar' : 'Ativar'} usuário`}
              onClick={() => onToggleStatus(row)}
              showInMenu
            />,
          )
        }
        actions.push(
          <GridActionsCellItem
            key="delete"
            icon={I.trash}
            label="Excluir"
            onClick={() => onDelete(row)}
            showInMenu
          />,
        )
        if (!row.anonymizedAt && row.id !== currentUserId) {
          actions.push(
            <GridActionsCellItem
              key="erase"
              icon={I.shield}
              label="Eliminar dados pessoais (LGPD)"
              onClick={() => onErase(row)}
              showInMenu
            />,
          )
        }
        return actions
      },
    },
  ]

  return (
    <DataGridPremium
      apiRef={apiRef}
      rows={rows}
      columns={columns}
      loading={loading}
      getRowId={(row: User) => row.id}
      getRowHeight={() => 'auto'}
      disableRowSelectionOnClick
      filterModel={{
        items: [],
        quickFilterValues: quickFilter.trim().split(/\s+/).filter(Boolean),
      }}
      pagination
      initialState={{
        pagination: { paginationModel: { pageSize: 10, page: 0 } },
        sorting: { sortModel: [{ field: 'name', sort: 'asc' }] },
      }}
      pageSizeOptions={[10, 25, 50]}
      localeText={ptBR.components.MuiDataGrid.defaultProps.localeText}
      sx={{
        border: 0,
        '--DataGrid-overlayHeight': '220px',
        '& .MuiDataGrid-columnHeaders': { backgroundColor: '#fafbfc' },
        '& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center' },
      }}
    />
  )
}
