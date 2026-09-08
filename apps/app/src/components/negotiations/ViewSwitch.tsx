import FormatListBulletedOutlinedIcon from '@mui/icons-material/FormatListBulletedOutlined'
import ViewKanbanOutlinedIcon from '@mui/icons-material/ViewKanbanOutlined'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'

export type NegotiationView = 'quadro' | 'lista'

interface ViewSwitchProps {
  view: NegotiationView
  onChange: (view: NegotiationView) => void
}

export function ViewSwitch({ view, onChange }: ViewSwitchProps) {
  return (
    <ToggleButtonGroup
      exclusive
      value={view}
      onChange={(_, next: NegotiationView | null) => next && onChange(next)}
      aria-label="Modo de visualização"
    >
      <ToggleButton value="quadro" aria-label="Quadro">
        <ViewKanbanOutlinedIcon />
        Quadro
      </ToggleButton>
      <ToggleButton value="lista" aria-label="Lista">
        <FormatListBulletedOutlinedIcon />
        Lista
      </ToggleButton>
    </ToggleButtonGroup>
  )
}
