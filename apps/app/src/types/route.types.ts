import type { Role } from './enums'

export type Route =
  | 'dashboard'
  | 'negociacoes'
  | 'clientes'
  | 'orcamentos'
  | 'pedidos'
  | 'produtos'
  | 'usados'
  | 'usuarios'

export const ROUTE_ROLES: Record<Route, Role[]> = {
  dashboard: ['ADMIN', 'VENDEDOR', 'ATENDENTE', 'TECNICO'],
  negociacoes: ['ADMIN', 'VENDEDOR'],
  clientes: ['ADMIN', 'VENDEDOR', 'ATENDENTE'],
  orcamentos: ['ADMIN', 'VENDEDOR'],
  pedidos: ['ADMIN', 'VENDEDOR'],
  produtos: ['ADMIN', 'VENDEDOR'],
  usados: ['ADMIN', 'TECNICO'],
  usuarios: ['ADMIN'],
}

export function canAccess(route: Route, role: Role): boolean {
  return ROUTE_ROLES[route].includes(role)
}
