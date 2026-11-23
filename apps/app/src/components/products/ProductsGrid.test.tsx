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

const filterButton = () => screen.getByRole('button', { name: /Filtrar/ })

const applyCategories = async (...labels: string[]) => {
  await userEvent.click(filterButton())
  const panel = screen.getByRole('dialog')
  for (const label of labels) await userEvent.click(within(panel).getByRole('checkbox', { name: label }))
  await userEvent.click(within(panel).getByRole('button', { name: 'Aplicar filtro' }))
}

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

  it.each([
    ['só a busca', async () => search('pixel')],
    ['só o filtro', async () => applyCategories('iPad')],
    [
      'busca e filtro juntos',
      async () => {
        await applyCategories('Mac')
        search('iphone')
      },
    ],
  ])(
    'sem resultado (%s) mostra mensagem própria e "Limpar filtros" zera busca e filtro',
    async (_, narrow) => {
      renderGrid()

      await narrow()
      expect(screen.getByText('Nenhum produto encontrado para a busca e os filtros')).toBeInTheDocument()

      await userEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }))
      expect(screen.getByPlaceholderText(/Buscar por nome ou código/)).toHaveValue('')
      expect(filterButton()).toHaveTextContent(/^Filtrar$/)
      expect(visibleNames()).toHaveLength(5)
    },
  )

  it('catálogo vazio mostra "Nenhum produto ainda"', () => {
    renderGrid({ rows: [] })

    expect(screen.getByText('Nenhum produto ainda')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Limpar filtros' })).not.toBeInTheDocument()
  })

  it('aba vazia sem busca tem a sua mensagem', async () => {
    renderGrid({ rows: [catalog[0]] })

    await userEvent.click(tab(/Inativos/))
    expect(screen.getByText('Nenhum produto inativo')).toBeInTheDocument()
  })

  it('aba vazia durante uma busca que acha produtos em outras abas mostra a mensagem da aba', async () => {
    renderGrid()

    search('macbook')
    await userEvent.click(tab(/Inativos/))
    expect(screen.getByText('Nenhum produto inativo')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Limpar filtros' })).not.toBeInTheDocument()
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

  describe('filtro de categoria', () => {
    it('o painel oferece as seis categorias e aplicar recorta linhas e contadores das abas', async () => {
      renderGrid()

      await userEvent.click(filterButton())
      expect(
        within(screen.getByRole('dialog'))
          .getAllByRole('checkbox')
          .map((box) => box.closest('label')?.textContent),
      ).toEqual(['iPhone', 'iPad', 'Mac', 'Apple Watch', 'Áudio', 'Acessórios'])
      await userEvent.keyboard('{Escape}')

      await applyCategories('iPhone', 'Áudio', 'Acessórios')
      expect(visibleNames()).toEqual(['AirPods Pro', 'Capa MagSafe', 'iPhone 15 Pro'])
      expect(within(tab(/Todos/)).getByText('3')).toBeInTheDocument()
      expect(within(tab(/^Ativos/)).getByText('2')).toBeInTheDocument()
      expect(within(tab(/Inativos/)).getByText('1')).toBeInTheDocument()
      expect(within(tab(/Sem estoque/)).getByText('1')).toBeInTheDocument()
    })

    it('o botão Filtrar mostra quantos filtros estão ativos, e nada quando nenhum', async () => {
      renderGrid()

      expect(filterButton()).toHaveTextContent(/^Filtrar$/)

      await applyCategories('iPhone', 'Mac')
      expect(filterButton()).toHaveTextContent(/^Filtrar2$/)
    })

    it('filtros aplicados viram chips; remover um chip refiltra e baixa o contador', async () => {
      renderGrid()

      await applyCategories('iPhone', 'Mac')
      const chips = screen.getByRole('list', { name: 'Filtros ativos' })
      expect(within(chips).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
        'iPhone',
        'Mac',
      ])

      await userEvent.click(within(chips).getByRole('button', { name: 'Remover filtro Mac' }))
      expect(visibleNames()).toEqual(['iPhone 15 Pro'])
      expect(filterButton()).toHaveTextContent(/^Filtrar1$/)
      expect(within(chips).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
        'iPhone',
      ])
    })

    it('"Limpar todos" no painel volta ao catálogo completo, sem chips nem contador', async () => {
      renderGrid()

      await applyCategories('iPhone', 'Mac')
      await userEvent.click(filterButton())
      await userEvent.click(
        within(screen.getByRole('dialog')).getByRole('button', { name: 'Limpar todos' }),
      )

      expect(visibleNames()).toHaveLength(5)
      expect(filterButton()).toHaveTextContent(/^Filtrar$/)
      expect(screen.queryByRole('list', { name: 'Filtros ativos' })).not.toBeInTheDocument()
    })

    it('busca e categorias valem juntas', async () => {
      renderGrid()

      await applyCategories('iPhone', 'Mac')
      search('pro')
      expect(visibleNames()).toEqual(['iPhone 15 Pro'])
      expect(within(tab(/Todos/)).getByText('1')).toBeInTheDocument()
      expect(within(tab(/Sem estoque/)).getByText('0')).toBeInTheDocument()
    })
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

  describe('menu ⋮ da linha', () => {
    const rowActions = () => ({
      onEdit: vi.fn(),
      onUpdatePrice: vi.fn(),
      onMoveStock: vi.fn(),
      onDiscontinue: vi.fn(),
      onReactivate: vi.fn(),
      onDelete: vi.fn(),
    })

    const openMenu = async (name: string) =>
      userEvent.click(within(rowOf(name)).getByRole('button', { name: `Ações de ${name}` }))

    it('sem ações (VENDEDOR) a linha não tem ⋮', () => {
      renderGrid()

      expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /^Ações de/ })).not.toBeInTheDocument()
    })

    it.each([
      [
        'Ativo',
        'iPhone 15 Pro',
        ['Editar', 'Alterar preço', 'Movimentar estoque', 'Descontinuar', 'Excluir'],
      ],
      [
        'Inativo',
        'Capa MagSafe',
        ['Editar', 'Alterar preço', 'Movimentar estoque', 'Reativar', 'Excluir'],
      ],
    ])('Produto %s oferece os itens da sua Situação', async (_, name, items) => {
      renderGrid({ actions: rowActions() })

      await openMenu(name)

      expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual(items)
    })

    it.each([
      ['Editar', 'onEdit', 'iPhone 15 Pro', 'iphone'],
      ['Alterar preço', 'onUpdatePrice', 'MacBook Air', 'mac'],
      ['Movimentar estoque', 'onMoveStock', 'AirPods Pro', 'airpods'],
      ['Descontinuar', 'onDiscontinue', 'iPhone 15 Pro', 'iphone'],
      ['Reativar', 'onReactivate', 'Capa MagSafe', 'capa'],
      ['Excluir', 'onDelete', 'Apple Watch Série 9', 'watch'],
    ] as const)(
      '⋮ › %s age sobre o Produto da linha sem abrir o detalhe',
      async (item, callback, name, id) => {
        const onOpen = vi.fn()
        const actions = rowActions()
        renderGrid({ onOpen, actions })

        await openMenu(name)
        await userEvent.click(screen.getByRole('menuitem', { name: item }))

        expect(actions[callback]).toHaveBeenCalledTimes(1)
        expect(actions[callback]).toHaveBeenCalledWith(expect.objectContaining({ id }))
        expect(onOpen).not.toHaveBeenCalled()
        expect(screen.queryByRole('menu')).not.toBeInTheDocument()
      },
    )
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
