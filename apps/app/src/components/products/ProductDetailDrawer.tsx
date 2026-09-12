import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined'
import MoreVertOutlinedIcon from '@mui/icons-material/MoreVertOutlined'
import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { ProductStatusBadge } from './ProductStatusBadge'
import { DetailField, DetailSection } from '../common/DetailSection'
import { ToneChip } from '../common/ToneChip'
import { formatCurrency, formatDate } from '../../utils/format'
import type { BadgeTone } from '../../theme/tones'
import type { Product, StockMovement, StockMovementType } from '../../types'
import {
  PRODUCT_CATEGORY_LABELS,
  STOCK_MOVEMENT_TYPE_LABELS,
} from '../../types'

const MOVEMENT_TONE: Record<StockMovementType, BadgeTone> = {
  ENTRADA: 'green',
  SAIDA: 'amber',
}

interface ProductDetailDrawerProps {
  product: Product
  movements: StockMovement[]
  movementsLoading: boolean
  movementsError: string | null
  isAdmin: boolean
  onUpdatePrice?: () => void
  onMoveStock?: () => void
  onEdit?: () => void
  onDiscontinue?: () => void
  onReactivate?: () => void
  onDelete?: () => void
  onClose: () => void
}

function MovementRow({ movement }: { movement: StockMovement }) {
  return (
    <Box
      component="li"
      sx={{
        display: 'grid',
        gap: 0.75,
        listStyle: 'none',
        py: 1.5,
        borderBottom: 1,
        borderColor: 'divider',
        '&:last-of-type': { borderBottom: 0, pb: 0 },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ToneChip tone={MOVEMENT_TONE[movement.type]}>
          {STOCK_MOVEMENT_TYPE_LABELS[movement.type]}
        </ToneChip>
        <Typography sx={{ fontSize: 13.5, fontWeight: 700 }}>
          {movement.quantity}
        </Typography>
        <Typography
          sx={{ flex: 1, fontSize: 12.5, color: 'text.secondary', textAlign: 'right' }}
        >
          {formatDate(movement.createdAt)}
        </Typography>
      </Box>
      <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
        {movement.user?.name ?? 'Autor removido'}
      </Typography>
      {movement.note && (
        <Typography sx={{ fontSize: 13, overflowWrap: 'anywhere' }}>
          {movement.note}
        </Typography>
      )}
    </Box>
  )
}

export function ProductDetailDrawer({
  product,
  movements,
  movementsLoading,
  movementsError,
  isAdmin,
  onUpdatePrice,
  onMoveStock,
  onEdit,
  onDiscontinue,
  onReactivate,
  onDelete,
  onClose,
}: ProductDetailDrawerProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  const closeMenu = () => setAnchorEl(null)

  const run = (action?: () => void) => () => {
    closeMenu()
    action?.()
  }

  const active = product.status === 'ATIVO'
  const outOfStock = product.stock === 0

  const history = movementsError
    ? 'error'
    : movementsLoading
      ? 'loading'
      : movements.length === 0
        ? 'empty'
        : 'list'

  return (
    <Drawer
      anchor="right"
      open
      onClose={onClose}
      slotProps={{ paper: { sx: { width: 440, maxWidth: '100%' } } }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1.5,
          px: 3,
          py: 2,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 700, overflowWrap: 'anywhere' }}>
            {product.name}
          </Typography>
          <Box sx={{ mt: 0.5 }}>
            <ProductStatusBadge status={product.status} />
          </Box>
        </Box>
        {isAdmin && (
          <>
            <IconButton
              size="small"
              aria-label="Ações"
              onClick={(e) => setAnchorEl(e.currentTarget)}
            >
              <MoreVertOutlinedIcon />
            </IconButton>
            <Menu
              open={!!anchorEl}
              anchorEl={anchorEl}
              onClose={closeMenu}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <MenuItem disabled={!onEdit} onClick={run(onEdit)}>
                <ListItemIcon>
                  <EditOutlinedIcon />
                </ListItemIcon>
                Editar
              </MenuItem>
              {active ? (
                <MenuItem disabled={!onDiscontinue} onClick={run(onDiscontinue)}>
                  <ListItemIcon>
                    <BlockOutlinedIcon />
                  </ListItemIcon>
                  Descontinuar
                </MenuItem>
              ) : (
                <MenuItem disabled={!onReactivate} onClick={run(onReactivate)}>
                  <ListItemIcon>
                    <ReplayOutlinedIcon />
                  </ListItemIcon>
                  Reativar
                </MenuItem>
              )}
              <MenuItem
                disabled={!onDelete}
                onClick={run(onDelete)}
                sx={{ color: 'error.main', '&:hover': { color: 'error.main' } }}
              >
                <ListItemIcon sx={{ color: 'inherit' }}>
                  <DeleteOutlinedIcon />
                </ListItemIcon>
                Excluir
              </MenuItem>
            </Menu>
          </>
        )}
        <IconButton onClick={onClose} aria-label="Fechar" size="small">
          <CloseOutlinedIcon />
        </IconButton>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <DetailSection title="Produto">
          <DetailField label="Código de referência">{product.sku}</DetailField>
          <DetailField label="Categoria">
            {PRODUCT_CATEGORY_LABELS[product.category]}
          </DetailField>
          <DetailField label="Preço">{formatCurrency(product.price)}</DetailField>
          <DetailField label="Saldo atual">{product.stock}</DetailField>
          {outOfStock && (
            <Alert severity="warning" sx={{ fontSize: 13 }}>
              Sem saldo em estoque: este produto não conta como disponível para
              venda.
            </Alert>
          )}
        </DetailSection>
        <Divider />

        <DetailSection title="Descrição">
          <Typography
            sx={{
              fontSize: 13,
              color: product.description ? 'text.primary' : 'text.disabled',
              overflowWrap: 'anywhere',
            }}
          >
            {product.description ?? 'Sem descrição'}
          </Typography>
        </DetailSection>
        <Divider />

        <DetailSection title="Histórico de estoque">
          {history === 'error' && (
            <Alert severity="error" sx={{ fontSize: 13 }}>
              {movementsError}
            </Alert>
          )}

          {history === 'loading' && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={22} />
            </Box>
          )}

          {history === 'empty' && (
            <Typography sx={{ fontSize: 13, color: 'text.disabled' }}>
              Nenhuma movimentação ainda
            </Typography>
          )}

          {history === 'list' && (
            <Box component="ul" sx={{ m: 0, p: 0 }}>
              {movements.map((movement) => (
                <MovementRow key={movement.id} movement={movement} />
              ))}
            </Box>
          )}
        </DetailSection>
      </Box>

      {isAdmin && (
        <Box
          sx={{
            display: 'flex',
            gap: 1.5,
            px: 3,
            py: 2,
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          <Button
            variant="outlined"
            fullWidth
            disabled={!onUpdatePrice}
            onClick={onUpdatePrice}
          >
            Atualizar Preço
          </Button>
          <Button
            variant="contained"
            fullWidth
            disabled={!onMoveStock}
            onClick={onMoveStock}
          >
            Movimentar Estoque
          </Button>
        </Box>
      )}
    </Drawer>
  )
}
