import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { UsedDeviceStats } from './UsedDeviceStats'

describe('UsedDeviceStats', () => {
  it('mostra a fila e os recebidos no mês como o backend calculou', () => {
    render(
      <UsedDeviceStats
        summary={{ awaiting: 4, receivedThisMonth: { count: 2, value: 2350.5 } }}
      />,
    )

    expect(screen.getByText('Aguardando Avaliação')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('Recebidos no Mês')).toBeInTheDocument()
    expect(screen.getByText(/2\.350,50/)).toBeInTheDocument()
    expect(screen.getByText('2 aparelhos em negociações ganhas')).toBeInTheDocument()
  })

  it('singular com um aparelho recebido', () => {
    render(
      <UsedDeviceStats
        summary={{ awaiting: 0, receivedThisMonth: { count: 1, value: 800 } }}
      />,
    )

    expect(screen.getByText('1 aparelho em negociações ganhas')).toBeInTheDocument()
  })

  it('sem o resumo ainda, mostra o traço no lugar dos números', () => {
    render(<UsedDeviceStats summary={null} />)

    expect(screen.getAllByText('—')).toHaveLength(2)
  })
})
