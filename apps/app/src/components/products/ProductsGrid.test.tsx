import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductsGrid } from './ProductsGrid'
import type { Product } from '../../types'

const product = (overrides: Partial<Product> = {}): Product => ({
  id: 'p1',
  name: 'iPhone 15 Pro',
  sku: 'IP15P-256',
  description: null,
  category: 'IPHONE',
  price: 7999.9,
  stock: 5,
  status: 'ATIVO',
  createdAt: '2026-09-11T12:00:00Z',
  updatedAt: '2026-09-11T12:00:00Z',
  ...overrides,
})

const catalog: Product[] = [
  product({ id: 'iphone', name: 'iPhone 15 Pro', sku: 'IP15P-256', stock: 5 }),
  product({ id: 'airpods', name: 'AirPods Pro', sku: 'APP-2', category: 'AUDIO', stock: 0 }),
  product({
    id: 'capa',
    name: 'Capa MagSafe',
    sku: 'CAPA-MS',
    category: 'ACESSORIOS',
    status: 'INATIVO',
    stock: 8,
  }),
  product({
    id: 'watch',
    name: 'Apple Watch Série 9',
    sku: 'AW-9',
    category: 'APPLE_WATCH',
    status: 'INATIVO',
    stock: 0,
  }),
  product({ id: 'mac', name: 'MacBook Air', sku: 'MBA-13', category: 'MAC', stock: 2 }),
]

const noop = () => undefined

const renderGrid = (props: Partial<Parameters<typeof ProductsGrid>[0]> = {}) =>
  render(
    <ProductsGrid rows={catalog} loading={false} onOpen={noop} disableVirtualization {...props} />,
  )

const visibleNames = () =>
  screen
    .queryAllByRole('row')
    .slice(1)
    .map((row) => within(row).queryByTestId('product-name')?.textContent)
    .filter(Boolean)

const tab = (name: RegExp) => screen.getByRole('tab', { name })

const rowOf = (name: string) => {
  const row = screen.getByText(name).closest('[role="row"]')
  if (!(row instanceof HTMLElement)) throw new Error(`linha ${name} não encontrada`)
  return row
}

const search = (text: string) =>
  fireEvent.change(screen.getByPlaceholderText(/Buscar por nome ou código/), {
    target: { value: text },
  })

describe('ProductsGrid', () => {
  it('abre na aba Todos, com contador em cada uma das quatro abas', () => {
    renderGrid()

    expect(tab(/Todos/)).toHaveAttribute('aria-selected', 'true')
    expect(within(tab(/Todos/)).getByText('5')).toBeInTheDocument()
    expect(within(tab(/^Ativos/)).getByText('3')).toBeInTheDocument()
    expect(within(tab(/Inativos/)).getByText('2')).toBeInTheDocument()
    expect(within(tab(/Sem estoque/)).getByText('2')).toBeInTheDocument()
  })

  it('lista por nome em ordem crescente', () => {
    renderGrid()

    expect(visibleNames()).toEqual([
      'AirPods Pro',
      'Apple Watch Série 9',
      'Capa MagSafe',
      'iPhone 15 Pro',
      'MacBook Air',
    ])
  })

  it('as abas filtram por situação; Sem estoque traz saldo zero em qualquer situação', async () => {
    renderGrid()

    await userEvent.click(tab(/^Ativos/))
    expect(visibleNames()).toEqual(['AirPods Pro', 'iPhone 15 Pro', 'MacBook Air'])

    await userEvent.click(tab(/Inativos/))
    expect(visibleNames()).toEqual(['Apple Watch Série 9', 'Capa MagSafe'])

    await userEvent.click(tab(/Sem estoque/))
    expect(visibleNames()).toEqual(['AirPods Pro', 'Apple Watch Série 9'])
  })

  it('permite ordenar por coluna', async () => {
    renderGrid()

    await userEvent.click(screen.getByRole('columnheader', { name: /Preço/ }))

    expect(visibleNames()).not.toEqual([
      'AirPods Pro',
      'Apple Watch Série 9',
      'Capa MagSafe',
      'iPhone 15 Pro',
      'MacBook Air',
    ])
    expect(visibleNames()).toHaveLength(5)
  })

  it('busca por nome ou código sem diferenciar acento nem maiúsculas, e os contadores seguem a busca', () => {
    renderGrid()

    search('SERIE')
    expect(visibleNames()).toEqual(['Apple Watch Série 9'])
    expect(within(tab(/Todos/)).getByText('1')).toBeInTheDocument()
    expect(within(tab(/^Ativos/)).getByText('0')).toBeInTheDocument()
    expect(within(tab(/Inativos/)).getByText('1')).toBeInTheDocument()
    expect(within(tab(/Sem estoque/)).getByText('1')).toBeInTheDocument()

    search('capa-ms')
    expect(visibleNames()).toEqual(['Capa MagSafe'])
  })

  it('busca sem resultado mostra mensagem própria e "Limpar busca" volta ao catálogo', async () => {
    renderGrid()

    search('pixel')
    expect(screen.getByText('Nenhum produto encontrado para a busca')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Limpar busca' }))
    expect(screen.getByPlaceholderText(/Buscar por nome ou código/)).toHaveValue('')
    expect(visibleNames()).toHaveLength(5)
  })

  it('catálogo vazio mostra "Nenhum produto ainda"', () => {
    renderGrid({ rows: [] })

    expect(screen.getByText('Nenhum produto ainda')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Limpar busca' })).not.toBeInTheDocument()
  })

  it('aba vazia sem busca tem a sua mensagem', async () => {
    renderGrid({ rows: [catalog[0]] })

    await userEvent.click(tab(/Inativos/))
    expect(screen.getByText('Nenhum produto inativo')).toBeInTheDocument()
  })

  it('clicar numa linha abre o detalhe do Produto daquela linha', async () => {
    const onOpen = vi.fn()
    renderGrid({ onOpen })

    await userEvent.click(screen.getByText('Capa MagSafe'))

    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: 'capa' }))
  })

  it('pagina de 25 em 25 por padrão', () => {
    const many = Array.from({ length: 30 }, (_, i) =>
      product({ id: `p${i}`, name: `Produto ${String(i).padStart(2, '0')}`, sku: `SKU-${i}` }),
    )
    renderGrid({ rows: many })

    expect(visibleNames()).toHaveLength(25)
  })

  describe('leitura da linha', () => {
    it('Produto mostra o avatar da categoria, o nome e a categoria embaixo', () => {
      renderGrid()

      const row = rowOf('iPhone 15 Pro')
      expect(within(row).getByTestId('PhoneIphoneIcon')).toBeInTheDocument()
      expect(within(row).getByText('iPhone')).toBeInTheDocument()
      expect(within(rowOf('AirPods Pro')).getByTestId('HeadphonesIcon')).toBeInTheDocument()
      expect(within(rowOf('AirPods Pro')).getByText('Áudio')).toBeInTheDocument()
    })

    it('Código & Cadastro mostra o código e a data de cadastro', () => {
      renderGrid()

      const row = rowOf('iPhone 15 Pro')
      expect(within(row).getByText('IP15P-256')).toBeInTheDocument()
      expect(within(row).getByText('11/09/2026')).toBeInTheDocument()
    })

    it('Preço em reais e Situação como chip em pt-BR', () => {
      renderGrid()

      expect(within(rowOf('iPhone 15 Pro')).getByText('R$ 7.999,90')).toBeInTheDocument()
      expect(within(rowOf('iPhone 15 Pro')).getByText('Ativo')).toBeInTheDocument()
      expect(within(rowOf('Capa MagSafe')).getByText('Inativo')).toBeInTheDocument()
    })

    it('Estoque: zerado "Sem estoque", até 3 "Estoque baixo · N un.", acima "N un."', () => {
      renderGrid()

      expect(within(rowOf('AirPods Pro')).getByText('Sem estoque')).toBeInTheDocument()
      expect(within(rowOf('MacBook Air')).getByText('Estoque baixo · 2 un.')).toBeInTheDocument()
      expect(within(rowOf('iPhone 15 Pro')).getByText('5 un.')).toBeInTheDocument()
    })
  })

  describe('no telefone', () => {
    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('esconde Código & Cadastro e Situação', () => {
      vi.stubGlobal('matchMedia', (query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: noop,
        removeListener: noop,
        addEventListener: noop,
        removeEventListener: noop,
        dispatchEvent: () => false,
      }))

      renderGrid()

      expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument()
      expect(screen.queryByRole('columnheader', { name: /Código/ })).not.toBeInTheDocument()
      expect(screen.queryByRole('columnheader', { name: 'Situação' })).not.toBeInTheDocument()
      expect(screen.queryByText('IP15P-256')).not.toBeInTheDocument()
    })
  })
})
