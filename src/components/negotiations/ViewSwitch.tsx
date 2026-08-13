import { I } from '../../icons'

export type NegotiationView = 'quadro' | 'lista'

interface ViewSwitchProps {
  view: NegotiationView
  onChange: (view: NegotiationView) => void
}

export function ViewSwitch({ view, onChange }: ViewSwitchProps) {
  return (
    <div className="view-switch" role="group" aria-label="Modo de visualização">
      <button
        className={view === 'quadro' ? 'active' : ''}
        onClick={() => onChange('quadro')}
        aria-pressed={view === 'quadro'}
      >
        {I.dashboard}
        <span>Quadro</span>
      </button>
      <button
        className={view === 'lista' ? 'active' : ''}
        onClick={() => onChange('lista')}
        aria-pressed={view === 'lista'}
      >
        {I.orders}
        <span>Lista</span>
      </button>
    </div>
  )
}
