import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Sidebar } from './Sidebar'
import type { Role } from '../types'

const noop = () => undefined

function renderSidebar(role: Role) {
  render(
    <Sidebar
      route="dashboard"
      setRoute={noop}
      open={false}
      onClose={noop}
      role={role}
      onLogout={noop}
    />,
  )
}

function menuLabels(): string[] {
  const labels = screen.getAllByRole('button').map((item) => item.textContent ?? '')
  return [...new Set(labels)]
}

describe('Sidebar', () => {
  it('mostra todas as telas ao ADMIN', () => {
    renderSidebar('ADMIN')
    const labels = menuLabels()
    expect(labels).toContain('Usuários')
    expect(labels).toContain('Produtos')
    expect(labels).toContain('Negociações')
    expect(labels).toContain('Dispositivos Usados')
  })

  it('esconde Negociações e Pedidos do ATENDENTE (arquitetura §5)', () => {
    renderSidebar('ATENDENTE')
    const labels = menuLabels()
    expect(labels).not.toContain('Negociações')
    expect(labels).not.toContain('Pedidos')
    expect(labels).not.toContain('Produtos')
    expect(labels).not.toContain('Usuários')
    expect(labels).toContain('Clientes & Leads')
    expect(labels).toContain('Dashboard')
  })

  it('esconde Negociações, Pedidos e Clientes do TECNICO (ADR 0014)', () => {
    renderSidebar('TECNICO')
    const labels = menuLabels()
    expect(labels).not.toContain('Negociações')
    expect(labels).not.toContain('Pedidos')
    expect(labels).not.toContain('Clientes & Leads')
    expect(labels).toContain('Dashboard')
    expect(labels).toContain('Dispositivos Usados')
  })

  it('esconde Usuários do VENDEDOR mas mantém Produtos (UC6 §3.5)', () => {
    renderSidebar('VENDEDOR')
    const labels = menuLabels()
    expect(labels).not.toContain('Usuários')
    expect(labels).toContain('Produtos')
    expect(labels).toContain('Negociações')
  })

  it('não renderiza grupo que ficou sem nenhum item para o perfil', () => {
    renderSidebar('ATENDENTE')
    expect(screen.queryAllByText('Sistema')).toHaveLength(0)
    expect(screen.queryAllByText('Cadastros')).toHaveLength(0)
    expect(screen.queryAllByText('Vendas').length).toBeGreaterThan(0)
  })

  it('mantém Sair disponível a qualquer perfil', () => {
    renderSidebar('TECNICO')
    expect(menuLabels()).toContain('Sair')
  })
})
