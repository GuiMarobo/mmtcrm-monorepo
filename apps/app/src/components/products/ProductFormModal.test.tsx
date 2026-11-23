import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductFormModal } from './ProductFormModal'
import { ApiError } from '../../api'
import type { Product } from '../../types'

const product = (overrides: Partial<Product> = {}): Product => ({
  id: 'p1',
  name: 'iPhone 15 Pro',
  sku: 'IP15P-256',
  description: 'Titânio natural',
  category: 'IPHONE',
  price: 7999.9,
  stock: 5,
  status: 'ATIVO',
  createdAt: '2026-09-11T12:00:00Z',
  updatedAt: '2026-09-11T12:00:00Z',
  ...overrides,
})

describe('ProductFormModal — edição (RP3)', () => {
  const setupEdit = (overrides: Partial<Product> = {}, onSave = vi.fn().mockResolvedValue(undefined)) => {
    render(
      <ProductFormModal product={product(overrides)} onClose={vi.fn()} onSave={onSave} />,
    )
    return { onSave }
  }

  it('abre pré-preenchido com os quatro campos editáveis, sem preço nem estoque', () => {
    setupEdit()

    expect(screen.getByText('Editar Produto')).toBeInTheDocument()
    expect(screen.getByLabelText(/^Nome/)).toHaveValue('iPhone 15 Pro')
    expect(screen.getByLabelText(/Código de Referência/)).toHaveValue('IP15P-256')
    expect(screen.getByLabelText('Descrição')).toHaveValue('Titânio natural')
    expect(
      within(screen.getByRole('dialog')).getByRole('combobox', { name: /Categoria/ }),
    ).toHaveTextContent('iPhone')
    expect(screen.queryByLabelText(/Preço de Venda/)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Quantidade Inicial/)).not.toBeInTheDocument()
  })

  it('envia só nome, código, descrição e categoria', async () => {
    const user = userEvent.setup()
    const { onSave } = setupEdit()

    const name = screen.getByLabelText(/^Nome/)
    await user.clear(name)
    await user.type(name, 'iPhone 15 Pro Max')
    await user.clear(screen.getByLabelText('Descrição'))
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(onSave).toHaveBeenCalledWith({
      name: 'iPhone 15 Pro Max',
      sku: 'IP15P-256',
      description: null,
      category: 'IPHONE',
    })
  })

  it('não envia com o nome em branco', async () => {
    const user = userEvent.setup()
    const { onSave } = setupEdit()

    await user.clear(screen.getByLabelText(/^Nome/))
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByText('Informe o nome do produto.')).toBeInTheDocument()
  })

  it('mostra a recusa do backend (sku duplicado) e mantém o diálogo aberto', async () => {
    const user = userEvent.setup()
    setupEdit(
      {},
      vi
        .fn()
        .mockRejectedValue(
          new ApiError(409, 'Já existe um produto com este código de referência'),
        ),
    )

    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    await waitFor(() =>
      expect(
        screen.getByText('Já existe um produto com este código de referência'),
      ).toBeInTheDocument(),
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})

describe('ProductFormModal — cadastro', () => {
  it('sugere o código enquanto o nome é digitado e envia com preço e quantidade inicial', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<ProductFormModal onClose={vi.fn()} onSave={onSave} />)

    const name = screen.getByLabelText(/^Nome/)
    const sku = screen.getByLabelText(/Código de Referência/)
    await user.type(name, 'AirPods')
    expect(sku).toHaveValue('AIRPODS')
    await user.type(name, ' Pró')
    expect(sku).toHaveValue('AIRPODS-PRO')

    await user.type(screen.getByLabelText(/Preço de Venda/), '1999')
    await user.click(screen.getByRole('button', { name: 'Cadastrar produto' }))

    expect(onSave).toHaveBeenCalledWith({
      name: 'AirPods Pró',
      sku: 'AIRPODS-PRO',
      description: null,
      category: 'IPHONE',
      price: 1999,
      initialStock: 0,
    })
  })
})

describe('ProductFormModal — código sugerido', () => {
  const setupCreate = (existingSkus: string[] = []) => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<ProductFormModal existingSkus={existingSkus} onClose={vi.fn()} onSave={onSave} />)
    return {
      user: userEvent.setup(),
      name: screen.getByLabelText(/^Nome/),
      sku: screen.getByLabelText(/Código de Referência/),
    }
  }

  it('ganha sufixo quando o código sugerido já existe no catálogo carregado', async () => {
    const { user, name, sku } = setupCreate(['ipad-air', 'IPAD-AIR-2'])

    await user.type(name, 'iPad Air')

    expect(sku).toHaveValue('IPAD-AIR-3')
  })

  it('para de acompanhar o nome depois que o código é editado à mão', async () => {
    const { user, name, sku } = setupCreate()

    await user.type(name, 'iPad Air')
    await user.type(sku, '-M2')
    await user.type(name, ' 11')

    expect(sku).toHaveValue('IPAD-AIR-M2')
  })

  it('apagar o código todo não religa a sugestão', async () => {
    const { user, name, sku } = setupCreate()

    await user.type(name, 'iPad Air')
    await user.clear(sku)
    await user.type(name, ' 11')

    expect(sku).toHaveValue('')
  })
})

describe('ProductFormModal — layout', () => {
  it('cadastro em duas seções, com a prévia do avatar acompanhando a categoria', async () => {
    const user = userEvent.setup()
    render(<ProductFormModal onClose={vi.fn()} onSave={vi.fn()} />)

    expect(screen.getByText('Identificação')).toBeInTheDocument()
    expect(screen.getByText('Preço & Estoque')).toBeInTheDocument()
    expect(screen.getByLabelText('iPhone')).toBeInTheDocument()

    await user.click(screen.getByRole('combobox', { name: /Categoria/ }))
    await user.click(screen.getByRole('option', { name: 'Mac' }))

    expect(screen.getByLabelText('Mac')).toBeInTheDocument()
    expect(screen.queryByLabelText('iPhone')).not.toBeInTheDocument()
  })

  it('edição mostra só a seção de identificação', () => {
    render(<ProductFormModal product={product()} onClose={vi.fn()} onSave={vi.fn()} />)

    expect(screen.getByText('Identificação')).toBeInTheDocument()
    expect(screen.queryByText('Preço & Estoque')).not.toBeInTheDocument()
  })
})
