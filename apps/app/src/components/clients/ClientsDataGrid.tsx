import Box from '@mui/material/Box'
import { DataGridPremium, GridActionsCellItem } from '@mui/x-data-grid-premium'
import type {
  GridApiPremium,
  GridColDef,
  GridRowSelectionModel,
} from '@mui/x-data-grid-premium'
import type { RefObject } from 'react'
import { ptBR } from '@mui/x-data-grid/locales'
import { I } from '../../icons'
import { ClientStatusBadge, ClientQualificationBadge } from './ClientBadges'
import { Badge } from '../ui'
import { formatDate, maskCpf, maskPhone } from '../../utils/format'
import type { Client, Role } from '../../types'
import {
  CLIENT_STATUS_OPTIONS,
  LEAD_ORIGIN_LABELS,
  LEAD_ORIGIN_OPTIONS,
  LEAD_QUALIFICATION_OPTIONS,
} from '../../types'

interface ClientsDataGridProps {
  apiRef: RefObject<GridApiPremium | null>
  rows: Client[]
  loading: boolean
  quickFilter: string
  selection: GridRowSelectionModel
  onSelectionChange: (model: GridRowSelectionModel) => void
  role: Role | undefined
  onEdit: (client: Client) => void
  onQualify: (client: Client) => void
  onRegisterContact: (client: Client) => void
  onDelete: (client: Client) => void
  onErase: (client: Client) => void
}

export function ClientsDataGrid({
  apiRef,
  rows,
  loading,
  quickFilter,
  selection,
  onSelectionChange,
  role,
  onEdit,
  onQualify,
  onRegisterContact,
  onDelete,
  onErase,
}: ClientsDataGridProps) {
  const columns: GridColDef<Client>[] = [
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
          {row.cpf && (
            <Box sx={{ color: 'text.disabled', fontSize: 12 }}>
              CPF {maskCpf(row.cpf)}
            </Box>
          )}
        </Box>
      ),
    },
    {
      field: 'phone',
      headerName: 'Telefone',
      flex: 1,
      minWidth: 140,
      valueFormatter: (value: string | null) => maskPhone(value) || '-',
    },
    {
      field: 'origin',
      headerName: 'Forma de Contato',
      flex: 1,
      minWidth: 150,
      type: 'singleSelect',
      valueOptions: LEAD_ORIGIN_OPTIONS,
      valueFormatter: (value: Client['origin']) =>
        value ? LEAD_ORIGIN_LABELS[value] : '-',
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.9,
      minWidth: 120,
      type: 'singleSelect',
      valueOptions: CLIENT_STATUS_OPTIONS,
      renderCell: ({ row }) => <ClientStatusBadge status={row.status} />,
    },
    {
      field: 'qualification',
      headerName: 'Qualificação',
      flex: 1,
      minWidth: 140,
      type: 'singleSelect',
      valueOptions: LEAD_QUALIFICATION_OPTIONS,
      renderCell: ({ row }) => (
        <ClientQualificationBadge value={row.qualification} />
      ),
    },
    {
      field: 'lastContactAt',
      headerName: 'Último Contato',
      flex: 1,
      minWidth: 140,
      valueFormatter: (value: string | null) => formatDate(value),
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
        }
        if (!row.anonymizedAt && row.qualification === 'NAO_QUALIFICADO') {
          actions.push(
            <GridActionsCellItem
              key="qualify"
              icon={I.star}
              label="Qualificar lead"
              onClick={() => onQualify(row)}
              showInMenu
            />,
          )
        }
        if (!row.anonymizedAt) {
          actions.push(
            <GridActionsCellItem
              key="contact"
              icon={I.phone}
              label="Registrar contato"
              onClick={() => onRegisterContact(row)}
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
        if (role === 'ADMIN' && !row.anonymizedAt) {
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
      getRowId={(row: Client) => row.id}
      getRowHeight={() => 'auto'}
      checkboxSelection
      disableRowSelectionOnClick
      rowSelectionModel={selection}
      onRowSelectionModelChange={onSelectionChange}
      filterModel={{ items: [], quickFilterValues: quickFilter.trim().split(/\s+/).filter(Boolean) }}
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
