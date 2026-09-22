import type { Role } from './enums'

export type Route =
  | 'dashboard'
  | 'negociacoes'
  | 'clientes'
  | 'pedidos'
  | 'produtos'
  | 'usados'
  | 'usuarios'
  | 'configuracoes'

export const ROUTE_ROLES: Record<Route, Role[]> = {
  dashboard: ['ADMIN', 'VENDEDOR', 'ATENDENTE', 'TECNICO'],
  negociacoes: ['ADMIN', 'VENDEDOR'],
  clientes: ['ADMIN', 'VENDEDOR', 'ATENDENTE'],
  pedidos: ['ADMIN', 'VENDEDOR'],
  produtos: ['ADMIN', 'VENDEDOR'],
  usados: ['ADMIN', 'TECNICO'],
  usuarios: ['ADMIN'],
  configuracoes: ['ADMIN'],
}

export function canAccess(route: Route, role: Role): boolean {
  return ROUTE_ROLES[route].includes(role)
}
