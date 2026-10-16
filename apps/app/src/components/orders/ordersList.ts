import type { Order, OrderStatus } from '../../types'

export type OrdersTab = 'aguardando' | 'aprovada' | 'desistencia' | 'todos'

export interface OrdersTabDefinition {
  value: OrdersTab
  label: string
  status: OrderStatus | null
  initialDirection: 'asc' | 'desc'
  emptyMessage: string
}

export const ORDERS_TABS: OrdersTabDefinition[] = [
  {
    value: 'aguardando',
    label: 'Aguardando pagamento',
    status: 'EM_NEGOCIACAO',
    initialDirection: 'asc',
    emptyMessage: 'Nenhum pedido aguardando pagamento',
  },
  {
    value: 'aprovada',
    label: 'Compra aprovada',
    status: 'COMPRA_APROVADA',
    initialDirection: 'desc',
    emptyMessage: 'Nenhum pedido com compra aprovada',
  },
  {
    value: 'desistencia',
    label: 'Desistência',
    status: 'DESISTENCIA',
    initialDirection: 'desc',
    emptyMessage: 'Nenhuma desistência',
  },
  {
    value: 'todos',
    label: 'Todos',
    status: null,
    initialDirection: 'desc',
    emptyMessage: 'Nenhum pedido ainda',
  },
]

export const INITIAL_ORDERS_TAB: OrdersTab = 'aguardando'

export const tabDefinition = (tab: OrdersTab): OrdersTabDefinition =>
  ORDERS_TABS.find((definition) => definition.value === tab) ?? ORDERS_TABS[0]

export const ordersInTab = (orders: Order[], tab: OrdersTab): Order[] => {
  const { status } = tabDefinition(tab)
  return status === null ? orders : orders.filter((order) => order.status === status)
}

export const countOrdersByTab = (orders: Order[]): Record<OrdersTab, number> =>
  Object.fromEntries(
    ORDERS_TABS.map(({ value }) => [value, ordersInTab(orders, value).length]),
  ) as Record<OrdersTab, number>
