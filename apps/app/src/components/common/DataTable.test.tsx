import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DataTable } from './DataTable'
import type { DataTableColumn, RowId } from './DataTable'

interface Row {
  id: number
  name: string
  value: number
}

const columns: DataTableColumn<Row>[] = [
  { key: 'name', label: 'Nome', sortValue: (row) => row.name, render: (row) => row.name },
  { key: 'value', label: 'Valor', sortValue: (row) => row.value, render: (row) => row.value },
]

const rows: Row[] = [
  { id: 1, name: 'Bruno', value: 300 },
  { id: 2, name: 'Ana', value: 100 },
  { id: 3, name: 'Carla', value: 200 },
]

const firstColumn = () =>
  screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[0].textContent)

describe('DataTable', () => {
  it('aplica a ordenação inicial e alterna a direção ao clicar no cabeçalho', async () => {
    render(
      <DataTable
        label="Teste"
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        initialSort={{ key: 'name', direction: 'asc' }}
      />,
    )
    expect(firstColumn()).toEqual(['Ana', 'Bruno', 'Carla'])

    await userEvent.click(screen.getByRole('button', { name: 'Valor' }))
    expect(firstColumn()).toEqual(['Ana', 'Carla', 'Bruno'])

    await userEvent.click(screen.getByRole('button', { name: /Valor/ }))
    expect(firstColumn()).toEqual(['Bruno', 'Carla', 'Ana'])
  })

  it('pagina de 10 em 10 com rótulos em pt-BR', async () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ id: i, name: `Item ${i}`, value: i }))
    render(
      <DataTable label="Teste" rows={many} columns={columns} getRowId={(row) => row.id} />,
    )

    expect(screen.getAllByRole('row')).toHaveLength(11)
    expect(screen.getByText('1–10 de 12')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Próxima página' }))
    expect(screen.getAllByRole('row')).toHaveLength(3)
  })

  it('sem paginação, mostra todas as linhas e nenhum rodapé', () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ id: i, name: `Item ${i}`, value: i }))
    render(
      <DataTable
        label="Teste"
        rows={many}
        columns={columns}
        getRowId={(row) => row.id}
        paginated={false}
      />,
    )

    expect(screen.getAllByRole('row')).toHaveLength(13)
    expect(screen.queryByText(/de 12/)).not.toBeInTheDocument()
  })

  it('mostra linhas de carregamento e, depois, a mensagem de vazio', () => {
    const { rerender } = render(
      <DataTable label="Teste" rows={[]} columns={columns} getRowId={(row) => row.id} loading />,
    )
    expect(screen.getAllByTestId('data-table-skeleton-row').length).toBeGreaterThan(0)

    rerender(
      <DataTable
        label="Teste"
        rows={[]}
        columns={columns}
        getRowId={(row) => row.id}
        emptyMessage="Nada aqui"
      />,
    )
    expect(screen.getByText('Nada aqui')).toBeInTheDocument()
  })

  it('linha expansível: clicar na linha abre e fecha o conteúdo, sem disparar onRowClick', async () => {
    const onRowClick = vi.fn()
    render(
      <DataTable
        label="Teste"
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        onRowClick={onRowClick}
        expandLabel={(row) => `Expandir ${row.name}`}
        renderExpanded={(row) => <span>{`Detalhe de ${row.name}`}</span>}
      />,
    )

    expect(screen.queryByText('Detalhe de Ana')).not.toBeInTheDocument()
    await userEvent.click(screen.getByText('Ana'))
    expect(screen.getByText('Detalhe de Ana')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Expandir Ana' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    expect(onRowClick).not.toHaveBeenCalled()
  })

  it('clique nas ações não dispara o clique da linha', async () => {
    const onRowClick = vi.fn()
    const onAction = vi.fn()
    render(
      <DataTable
        label="Teste"
        rows={[rows[0]]}
        columns={columns}
        getRowId={(row) => row.id}
        onRowClick={onRowClick}
        renderActions={() => <button onClick={onAction}>Ação</button>}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Ação' }))
    expect(onAction).toHaveBeenCalledTimes(1)
    expect(onRowClick).not.toHaveBeenCalled()
  })

  it('seleção: marca uma linha e o cabeçalho seleciona todas', async () => {
    let selected: ReadonlySet<RowId> = new Set()
    const onChange = vi.fn((next: Set<RowId>) => {
      selected = next
    })
    const view = () => (
      <DataTable
        label="Teste"
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        selection={{ selected, onChange, rowLabel: (row) => row.name }}
      />
    )
    const { rerender } = render(view())

    await userEvent.click(screen.getByRole('checkbox', { name: 'Selecionar Ana' }))
    expect([...selected]).toEqual([2])

    rerender(view())
    await userEvent.click(screen.getByRole('checkbox', { name: 'Selecionar todos' }))
    expect(new Set(selected)).toEqual(new Set([1, 2, 3]))
  })
})
