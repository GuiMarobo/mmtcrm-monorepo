import { describe, expect, it } from 'vitest'
import { ROLES } from './enums'
import type { Role } from './enums'
import { ROUTE_ROLES, canAccess } from './route.types'
import type { Route } from './route.types'

const ROUTES = Object.keys(ROUTE_ROLES) as Route[]

const EXPECTED_ROUTES: Route[] = [
  'clientes',
  'dashboard',
  'negociacoes',
  'orcamentos',
  'pedidos',
  'produtos',
  'usados',
  'usuarios',
]

describe('ROUTE_ROLES', () => {
  it('tem uma entrada para cada rota do sistema', () => {
    expect([...ROUTES].sort()).toEqual(EXPECTED_ROUTES)
  })

  it('só usa perfis válidos e sem repetição', () => {
    for (const route of ROUTES) {
      const roles = ROUTE_ROLES[route]
      expect(roles.length).toBeGreaterThan(0)
      expect(new Set(roles).size).toBe(roles.length)
      for (const role of roles) expect(ROLES).toContain(role)
    }
  })

  it('libera o Dashboard para todos os perfis, que é a rota de fallback', () => {
    for (const role of ROLES) expect(canAccess('dashboard', role)).toBe(true)
  })

  it('reflete arquitetura.md §5: usuários é exclusivo do ADMIN', () => {
    expect(ROUTE_ROLES.usuarios).toEqual(['ADMIN'])
  })

  it('reflete arquitetura.md §5: clientes é a única tela do ATENDENTE', () => {
    expect([...ROUTE_ROLES.clientes].sort()).toEqual(['ADMIN', 'ATENDENTE', 'VENDEDOR'])
  })

  it('espelha os @Roles do backend: negociações e pedidos são de ADMIN e VENDEDOR', () => {
    expect([...ROUTE_ROLES.negociacoes].sort()).toEqual(['ADMIN', 'VENDEDOR'])
    expect([...ROUTE_ROLES.pedidos].sort()).toEqual(['ADMIN', 'VENDEDOR'])
  })

  it('reflete UC6 §3.5: produtos é de ADMIN e VENDEDOR, nunca de ATENDENTE ou TECNICO', () => {
    expect([...ROUTE_ROLES.produtos].sort()).toEqual(['ADMIN', 'VENDEDOR'])
    expect(canAccess('produtos', 'ATENDENTE')).toBe(false)
    expect(canAccess('produtos', 'TECNICO')).toBe(false)
  })

  it('dá ao TECNICO só o Dashboard e os Dispositivos Usados (ADR 0014, regra pronta)', () => {
    const visible = ROUTES.filter((route) => canAccess(route, 'TECNICO'))
    expect(visible.sort()).toEqual(['dashboard', 'usados'])
  })

  it('dá ao ATENDENTE só o Dashboard e Clientes', () => {
    const visible = ROUTES.filter((route) => canAccess(route, 'ATENDENTE'))
    expect(visible.sort()).toEqual(['clientes', 'dashboard'])
  })

  it('dá ao ADMIN todas as rotas', () => {
    for (const route of ROUTES) expect(canAccess(route, 'ADMIN')).toBe(true)
  })
})

describe('canAccess', () => {
  it('é verdadeiro quando o perfil está na lista da rota', () => {
    expect(canAccess('usuarios', 'ADMIN')).toBe(true)
  })

  it('é falso quando o perfil não está na lista da rota', () => {
    const otherRole: Role = 'VENDEDOR'
    expect(canAccess('usuarios', otherRole)).toBe(false)
  })
})
