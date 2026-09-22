import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NegotiationItemsEditor, type NegotiationItemFormValue } from './NegotiationItemsEditor'
import type { Product } from '../../types'

const product = (overrides: Partial<Product> = {}): Product => ({
  id: 'p1',
  name: 'iPhone 15 Pro',
  sku: 'IP15P-256',
  description: null,
  category: 'IPHONE',
  price: 100,
  stock: 5,
  status: 'ATIVO',
  createdAt: '2026-09-11T12:00:00Z',
  updatedAt: '2026-09-11T12:00:00Z',
  ...overrides,
})

describe('NegotiationItemsEditor', () => {
  it('adiciona um item selecionado no seletor com quantidade 1', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <NegotiationItemsEditor products={[product()]} items={[]} onChange={onChange} />,
    )

    await user.click(screen.getByLabelText('Adicionar produto'))
    await user.click(screen.getByRole('option', { name: /iPhone 15 Pro/ }))

    expect(onChange).toHaveBeenCalledWith([
      { productId: 'p1', quantity: 1, discountType: 'VALOR', discountValue: 0 },
    ])
  })

  it('esconde do seletor um Produto já adicionado, mas mantém a linha dele na lista', async () => {
    const user = userEvent.setup()
    render(
      <NegotiationItemsEditor
        products={[product(), product({ id: 'p2', name: 'AirPods Pro', sku: 'APP2' })]}
        items={[{ productId: 'p1', quantity: 1 }]}
        onChange={vi.fn()}
      />,
    )

    await user.click(screen.getByLabelText('Adicionar produto'))

    expect(
      screen.queryByRole('option', { name: /iPhone 15 Pro/ }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('option', { name: /AirPods Pro/ })).toBeInTheDocument()
    expect(screen.getAllByText('iPhone 15 Pro')).toHaveLength(1)
  })

  it('soma o total dos itens sem edição no rodapé', () => {
    render(
      <NegotiationItemsEditor
        products={[
          product({ id: 'p1', price: 100 }),
          product({ id: 'p2', price: 50, name: 'AirPods Pro', sku: 'APP2' }),
        ]}
        items={[
          { productId: 'p1', quantity: 2 },
          { productId: 'p2', quantity: 1 },
        ]}
        onChange={vi.fn()}
      />,
    )

    expect(screen.getByText(/R\$\s*250,00/)).toBeInTheDocument()
  })

  it('mostra aviso quando a quantidade passa do saldo, sem bloquear', () => {
    render(
      <NegotiationItemsEditor
        products={[product({ stock: 1 })]}
        items={[{ productId: 'p1', quantity: 3 }]}
        onChange={vi.fn()}
      />,
    )

    expect(screen.getByText(/Saldo em estoque: 1/)).toBeInTheDocument()
  })

  it('mantém a linha de um item cujo Produto foi descontinuado (RI2)', () => {
    render(
      <NegotiationItemsEditor
        products={[product({ status: 'INATIVO' })]}
        items={[{ productId: 'p1', quantity: 2, unitPrice: 100 }]}
        onChange={vi.fn()}
      />,
    )

    expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument()
    expect(screen.getByLabelText('Qtd.')).toHaveValue(2)
  })

  it('esconde do seletor de adicionar um Produto descontinuado', async () => {
    const user = userEvent.setup()
    render(
      <NegotiationItemsEditor
        products={[product({ status: 'INATIVO' })]}
        items={[]}
        onChange={vi.fn()}
      />,
    )

    await user.click(screen.getByLabelText('Adicionar produto'))

    expect(screen.getByText('Nenhum produto ativo disponível')).toBeInTheDocument()
  })

  it('remove um item ao clicar no botão de remover', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <NegotiationItemsEditor
        products={[product()]}
        items={[{ productId: 'p1', quantity: 1 }]}
        onChange={onChange}
      />,
    )

    await user.click(screen.getByLabelText('Remover iPhone 15 Pro'))

    expect(onChange).toHaveBeenCalledWith([])
  })

  describe('validações do item (RI2, RI3, RI5, ticket 06)', () => {
    function StatefulEditor({
      products,
      initialItems = [],
      onChange = vi.fn(),
    }: {
      products: Product[]
      initialItems?: NegotiationItemFormValue[]
      onChange?: (items: NegotiationItemFormValue[]) => void
    }) {
      const [items, setItems] = useState(initialItems)
      return (
        <NegotiationItemsEditor
          products={products}
          items={items}
          onChange={(next) => {
            setItems(next)
            onChange(next)
          }}
        />
      )
    }

    it('oferece só Produtos Ativos no seletor (a listagem de Produtos já exclui os excluídos)', async () => {
      const user = userEvent.setup()
      render(
        <StatefulEditor
          products={[
            product({ id: 'p1', name: 'iPhone 15 Pro' }),
            product({ id: 'p2', name: 'iPad Antigo', sku: 'IPAD-OLD', status: 'INATIVO' }),
          ]}
        />,
      )

      await user.click(screen.getByLabelText('Adicionar produto'))

      expect(screen.getByRole('option', { name: /iPhone 15 Pro/ })).toBeInTheDocument()
      expect(screen.queryByRole('option', { name: /iPad Antigo/ })).not.toBeInTheDocument()
    })

    it('um Produto adicionado some das opções restantes', async () => {
      const user = userEvent.setup()
      render(
        <StatefulEditor
          products={[
            product({ id: 'p1', name: 'iPhone 15 Pro' }),
            product({ id: 'p2', name: 'AirPods Pro', sku: 'APP2' }),
          ]}
        />,
      )

      await user.click(screen.getByLabelText('Adicionar produto'))
      await user.click(screen.getByRole('option', { name: /iPhone 15 Pro/ }))
      await user.keyboard('{ArrowDown}')

      expect(screen.getAllByRole('option')).toHaveLength(1)
      expect(screen.queryByRole('option', { name: /iPhone 15 Pro/ })).not.toBeInTheDocument()
      expect(screen.getByRole('option', { name: /AirPods Pro/ })).toBeInTheDocument()
    })

    it('ao digitar quantidade acima do saldo, avisa sem impedir a alteração', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(
        <StatefulEditor
          products={[product({ stock: 2 })]}
          initialItems={[{ productId: 'p1', quantity: 1 }]}
          onChange={onChange}
        />,
      )

      expect(screen.queryByText(/Saldo em estoque/)).not.toBeInTheDocument()

      const quantity = screen.getByLabelText('Qtd.')
      await user.tripleClick(quantity)
      await user.keyboard('5')

      expect(onChange).toHaveBeenLastCalledWith([{ productId: 'p1', quantity: 5 }])
      expect(screen.getByLabelText('Qtd.')).toHaveValue(5)
      expect(screen.getByText(/Saldo em estoque: 2/)).toBeInTheDocument()
    })
  })

  describe('desconto do item em % ou em R$ (ticket 08)', () => {
    function StatefulEditor({
      initialItems,
      onChange = vi.fn(),
    }: {
      initialItems: NegotiationItemFormValue[]
      onChange?: (items: NegotiationItemFormValue[]) => void
    }) {
      const [items, setItems] = useState(initialItems)
      return (
        <NegotiationItemsEditor
          products={[product({ price: 100 })]}
          items={items}
          onChange={(next) => {
            setItems(next)
            onChange(next)
          }}
        />
      )
    }

    it('alterna a forma do desconto entre R$ e % e recalcula o subtotal e o total', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(
        <StatefulEditor
          initialItems={[
            { productId: 'p1', quantity: 2, discountType: 'VALOR', discountValue: 10 },
          ]}
          onChange={onChange}
        />,
      )

      expect(screen.getAllByText(/R\$\s*190,00/)).toHaveLength(2)

      await user.click(screen.getByRole('button', { name: '%' }))

      expect(onChange).toHaveBeenLastCalledWith([
        { productId: 'p1', quantity: 2, discountType: 'PERCENTUAL', discountValue: 10 },
      ])
      expect(screen.getAllByText(/R\$\s*180,00/)).toHaveLength(2)
    })

    it('recalcula o subtotal ao digitar o número do desconto', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(
        <StatefulEditor
          initialItems={[
            { productId: 'p1', quantity: 2, discountType: 'PERCENTUAL', discountValue: 0 },
          ]}
          onChange={onChange}
        />,
      )

      const discount = screen.getByLabelText('Desconto')
      await user.tripleClick(discount)
      await user.keyboard('15')

      expect(onChange).toHaveBeenLastCalledWith([
        { productId: 'p1', quantity: 2, discountType: 'PERCENTUAL', discountValue: 15 },
      ])
      expect(screen.getAllByText(/R\$\s*170,00/)).toHaveLength(2)
    })

    it('não aceita mais de duas casas decimais no desconto', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(
        <StatefulEditor
          initialItems={[
            { productId: 'p1', quantity: 1, discountType: 'VALOR', discountValue: 0 },
          ]}
          onChange={onChange}
        />,
      )

      await user.tripleClick(screen.getByLabelText('Desconto'))
      await user.keyboard('1.255')

      expect(onChange).toHaveBeenLastCalledWith([
        { productId: 'p1', quantity: 1, discountType: 'VALOR', discountValue: 1.25 },
      ])
    })

    it('aponta na linha um desconto maior que a linha', () => {
      render(
        <StatefulEditor
          initialItems={[
            { productId: 'p1', quantity: 1, discountType: 'VALOR', discountValue: 150 },
          ]}
        />,
      )

      expect(screen.getByText('Maior que a linha')).toBeInTheDocument()
    })

    it('item de Produto excluído não permite mudar o desconto', () => {
      render(
        <NegotiationItemsEditor
          products={[]}
          items={[
            {
              productId: 'p1',
              quantity: 1,
              unitPrice: 100,
              discountType: 'VALOR',
              discountValue: 0,
              product: {
                id: 'p1',
                name: 'iPhone 15 Pro',
                sku: 'IP15P-256',
                status: 'ATIVO',
                deleted: true,
              },
            },
          ]}
          onChange={vi.fn()}
        />,
      )

      expect(screen.getByLabelText('Desconto')).toBeDisabled()
      expect(screen.getByRole('button', { name: '%' })).toBeDisabled()
    })
  })
})
