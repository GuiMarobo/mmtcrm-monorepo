import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import Popover from '@mui/material/Popover'
import Typography from '@mui/material/Typography'
import CancelIcon from '@mui/icons-material/Cancel'
import FilterListIcon from '@mui/icons-material/FilterList'
import { useState } from 'react'

export interface FilterOption<T extends string> {
  value: T
  label: string
}

interface FilterButtonProps<T extends string> {
  title: string
  options: FilterOption<T>[]
  selected: T[]
  onApply: (values: T[]) => void
}

export function FilterButton<T extends string>({
  title,
  options,
  selected,
  onApply,
}: FilterButtonProps<T>) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [draft, setDraft] = useState<T[]>(selected)

  const open = (target: HTMLElement) => {
    setDraft(selected)
    setAnchor(target)
  }

  const toggle = (value: T) =>
    setDraft((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    )

  const apply = (values: T[]) => {
    onApply(options.map((option) => option.value).filter((value) => values.includes(value)))
    setAnchor(null)
  }

  return (
    <>
      <Button
        variant="outlined"
        color="inherit"
        startIcon={<FilterListIcon />}
        endIcon={
          selected.length > 0 ? (
            <Chip size="small" color="primary" label={selected.length} />
          ) : undefined
        }
        onClick={(event) => open(event.currentTarget)}
      >
        Filtrar
      </Button>
      <Popover
        open={anchor !== null}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{ paper: { role: 'dialog', 'aria-label': title, sx: { p: 2, minWidth: (theme) => theme.spacing(30) } } }}
      >
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {title}
        </Typography>
        <FormGroup>
          {options.map((option) => (
            <FormControlLabel
              key={option.value}
              label={option.label}
              control={
                <Checkbox
                  size="small"
                  checked={draft.includes(option.value)}
                  onChange={() => toggle(option.value)}
                />
              }
            />
          ))}
        </FormGroup>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mt: 1.5 }}>
          <Button size="small" variant="contained" onClick={() => apply(draft)}>
            Aplicar filtro
          </Button>
          <Button size="small" onClick={() => apply([])}>
            Limpar todos
          </Button>
        </Box>
      </Popover>
    </>
  )
}

interface FilterChipsProps<T extends string> {
  options: FilterOption<T>[]
  selected: T[]
  onRemove: (value: T) => void
}

export function FilterChips<T extends string>({ options, selected, onRemove }: FilterChipsProps<T>) {
  const active = options.filter((option) => selected.includes(option.value))
  if (active.length === 0) return null
  return (
    <Box
      component="ul"
      aria-label="Filtros ativos"
      sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, listStyle: 'none', m: 0, px: 2, py: 1.25 }}
    >
      {active.map((option) => (
        <li key={option.value}>
          <Chip
            size="small"
            label={option.label}
            aria-label={`Remover filtro ${option.label}`}
            onClick={() => onRemove(option.value)}
            onDelete={() => onRemove(option.value)}
            deleteIcon={<CancelIcon />}
          />
        </li>
      ))}
    </Box>
  )
}
